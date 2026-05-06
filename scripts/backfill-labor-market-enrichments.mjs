import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const BACKFILL_PROMPT_VERSION = 'backfill-v1';
const SCHEMA_VERSION = '2026-05-05';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key]) continue;
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function normalizeText(value) {
  return (value ?? '').trim();
}

function fetchSnippet(rawDescription) {
  const text = normalizeText(rawDescription).replace(/\s+/g, ' ');
  if (!text) return null;
  return text.slice(0, 240);
}

function inferMarketRoleFamily(jobFamily, title, description) {
  const haystack = `${title} ${description}`.toLowerCase();

  if (/(risk|compliance|governance|audit|privacy|okta|iam|security|model risk)/.test(haystack)) {
    return 'Risk & Compliance';
  }
  if (/(finance|fp&a|accounting|controller|payroll|workday|netsuite|erp|oracle|sap)/.test(haystack)) {
    return 'Finance';
  }
  if (/(marketing|campaign|marketo|martech|demand generation|lifecycle)/.test(haystack)) {
    return 'Marketing';
  }
  if (/(salesforce|sales cloud|service cloud|crm|revops|revenue|gtm|sales operations|salesforce consultant|salesforce developer)/.test(haystack)) {
    return 'Sales & GTM';
  }
  if (/(data|analytics|snowflake|dbt|databricks|power bi|tableau|sql|bi\b|reporting)/.test(haystack)) {
    return 'Data & Analytics';
  }
  if (/(ai|llm|machine learning|software|developer|engineer|python|java|kubernetes|cloud|api)/.test(haystack)) {
    return 'Software & AI';
  }
  if (/(operations|workflow|process|program|internal tools|workfront|administrator|implementation|specialist)/.test(haystack)) {
    return 'Operations';
  }
  if (/(consultant|consulting|strategy|transformation)/.test(haystack)) {
    return 'Consulting & Strategy';
  }

  switch (jobFamily) {
    case 'Finance':
      return 'Finance';
    case 'Sales':
      return 'Sales & GTM';
    case 'Operations':
      return 'Operations';
    case 'Security':
      return 'Risk & Compliance';
    case 'Infrastructure':
      return 'Software & AI';
    default:
      return 'Other';
  }
}

function inferRoleCluster(roleFamily) {
  switch (roleFamily) {
    case 'Sales & GTM':
      return 'Revenue Systems';
    case 'Finance':
      return 'Finance Transformation';
    case 'Risk & Compliance':
      return 'AI Governance';
    case 'Data & Analytics':
      return 'Analytics Modernization';
    case 'Software & AI':
      return 'AI Systems';
    case 'Operations':
      return 'Workflow Automation';
    case 'Marketing':
      return 'Marketing Operations';
    case 'Consulting & Strategy':
      return 'Transformation Advisory';
    default:
      return 'General';
  }
}

function inferSeniority(title) {
  const lower = title.toLowerCase();
  if (/(chief|vp|vice president|head of|director)/.test(lower)) return 'Executive';
  if (/(senior|sr\.?|principal|staff|lead)/.test(lower)) return 'Senior';
  if (/manager/.test(lower)) return 'Manager';
  if (/(associate|junior|entry|intern)/.test(lower)) return 'Early Career';
  return 'IC';
}

async function fetchAll(supabase, table, selectClause) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectClause)
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Failed reading ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function main() {
  const repoRoot = process.cwd();
  loadEnvFile(path.join(repoRoot, '.env.local'));
  loadEnvFile(path.join(repoRoot, '.env'));

  const args = parseArgs(process.argv.slice(2));
  const dryRun = args['dry-run'] === 'true';
  const limit = Number.parseInt(args.limit ?? '0', 10);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const jobSignals = await fetchAll(
    supabase,
    'job_signals',
    'id, company_name, job_title, raw_description, job_family, created_at',
  );
  const enrichments = await fetchAll(
    supabase,
    'labor_market_enrichments',
    'job_signal_id, prompt_version, schema_version',
  );

  const enrichedIds = new Set(enrichments.map((row) => row.job_signal_id));
  const missing = jobSignals.filter((row) => !enrichedIds.has(row.id));
  const scoped = limit > 0 ? missing.slice(0, limit) : missing;

  console.log(`Job signals scanned: ${jobSignals.length}`);
  console.log(`Existing enrichment rows: ${enrichments.length}`);
  console.log(`Missing enrichment rows: ${missing.length}`);
  console.log(`Rows selected for backfill: ${scoped.length}`);

  if (dryRun || scoped.length === 0) return;

  let inserted = 0;
  for (const row of scoped) {
    const marketInsight = fetchSnippet(row.raw_description);
    const roleFamily = inferMarketRoleFamily(row.job_family, row.job_title, row.raw_description ?? '');

    const payload = {
      job_signal_id: row.id,
      role_title_normalized: normalizeText(row.job_title),
      role_family: roleFamily,
      role_cluster: inferRoleCluster(roleFamily),
      emerging_role_score: 5,
      ai_relevance_score: 5,
      automation_relevance_score: 5,
      company_type: 'Unknown',
      industry: null,
      seniority: inferSeniority(row.job_title),
      tools: [],
      technical_skills: [],
      business_skills: [],
      ai_skills: [],
      responsibilities: [],
      transformation_category: roleFamily,
      role_evolution_signal: null,
      less_differentiating_alone_signals: [],
      market_insight: marketInsight,
      confidence_score: 0.35,
      evidence_snippets: marketInsight ? [marketInsight] : [],
      model_name: 'backfill',
      prompt_version: BACKFILL_PROMPT_VERSION,
      schema_version: SCHEMA_VERSION,
      raw_model_output: null,
      validation_status: 'partial',
      error_message: null,
    };

    const { error } = await supabase
      .from('labor_market_enrichments')
      .upsert(payload, {
        onConflict: 'job_signal_id,prompt_version,schema_version',
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed backfill for ${row.id}: ${error.message}`);
    }

    inserted += 1;
  }

  console.log(`Backfilled enrichment rows: ${inserted}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
