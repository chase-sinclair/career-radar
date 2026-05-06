import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { normalizeJobUrl, resolveJobUrl } from './job-url-utils.mjs';

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
    if (args[key] === undefined) {
      args[key] = next;
    } else if (Array.isArray(args[key])) {
      args[key].push(next);
    } else {
      args[key] = [args[key], next];
    }
    index += 1;
  }
  return args;
}

function parseCsv(content) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(current);
      current = '';
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((value) => value.trim());
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] ?? '').trim();
    });
    return record;
  });
}

function normalizeText(value) {
  return (value ?? '').trim();
}

function normalizeDedupKey(row) {
  const explicit = normalizeText(row['Dedup Key']);
  if (explicit) return explicit.toLowerCase();

  const url = (normalizeJobUrl(row['Apply URL']) ?? '').toLowerCase();
  if (url) return url;

  return [
    normalizeText(row.Company).toLowerCase(),
    normalizeText(row['Job Title']).toLowerCase(),
    normalizeText(row.Location).toLowerCase(),
  ].join('|');
}

function toLegacyJobFamily(roleFamily) {
  switch (roleFamily) {
    case 'Finance':
      return 'Finance';
    case 'Sales & GTM':
      return 'Sales';
    case 'Operations':
      return 'Operations';
    case 'Marketing':
      return 'Sales';
    case 'Product':
      return 'Other';
    case 'HR & People Ops':
      return 'Operations';
    case 'Risk & Compliance':
      return 'Security';
    case 'Data & Analytics':
      return 'Infrastructure';
    case 'Software & AI':
      return 'Infrastructure';
    case 'Consulting & Strategy':
      return 'Other';
    default:
      return 'Other';
  }
}

function buildRawDescription(row) {
  const snippet = normalizeText(row['Job Snippet']);
  const requirements = normalizeText(row['Key Requirements']);
  if (snippet && requirements) return `${snippet}\n\nKey requirements: ${requirements}`;
  return snippet || requirements || '';
}

function buildSheetMetadata(row, dedupKey) {
  return {
    ingestion_source: 'claude_routine',
    dedup_key: dedupKey,
    original_apply_url: normalizeText(row['Apply URL']) || null,
    sheet_source: normalizeText(row.Source) || null,
    sheet_role_family: normalizeText(row['Role Family']) || null,
    sheet_seniority: normalizeText(row.Seniority) || null,
    sheet_salary_range: normalizeText(row['Salary Range']) || null,
    sheet_work_type: normalizeText(row['Work Type']) || null,
    sheet_location: normalizeText(row.Location) || null,
    key_requirements: normalizeText(row['Key Requirements']) || null,
  };
}

function mapRow(row) {
  const dedupKey = normalizeDedupKey(row);
  const roleFamily = normalizeText(row['Role Family']) || 'Other';
  const seniority = normalizeText(row.Seniority) || 'Unknown';
  const rawDescription = buildRawDescription(row);

  return {
    external_job_id: dedupKey,
    company_name: normalizeText(row.Company),
    job_title: normalizeText(row['Job Title']),
    raw_description: rawDescription || null,
    job_url: normalizeJobUrl(row['Apply URL']),
    posted_at: normalizeText(row['Date Posted']) || null,
    legacy_job_family: toLegacyJobFamily(roleFamily),
    role_family: roleFamily,
    seniority,
    score_components: buildSheetMetadata(row, dedupKey),
    market_insight: normalizeText(row['Job Snippet']) || null,
    role_title_normalized: normalizeText(row['Job Title']),
    role_cluster: roleFamily === 'Sales & GTM'
      ? 'Revenue Systems'
      : roleFamily === 'Finance'
        ? 'Finance Transformation'
        : roleFamily === 'Risk & Compliance'
          ? 'AI Governance'
          : roleFamily === 'Data & Analytics'
            ? 'Analytics Modernization'
            : roleFamily === 'Software & AI'
              ? 'AI Systems'
              : roleFamily === 'Operations'
                ? 'Workflow Automation'
                : 'General',
    transformation_category: roleFamily,
    evidence_snippets: normalizeText(row['Job Snippet']) ? [normalizeText(row['Job Snippet'])] : [],
  };
}

async function ensureCompany(supabase, companyName) {
  if (!companyName) return;
  const { error } = await supabase
    .from('companies')
    .upsert({ name: companyName }, { onConflict: 'name', ignoreDuplicates: false });

  if (error) throw new Error(`Failed company upsert for "${companyName}": ${error.message}`);
}

async function upsertJobSignal(supabase, mapped) {
  const payload = {
    external_job_id: mapped.external_job_id,
    company_name: mapped.company_name,
    job_title: mapped.job_title,
    raw_description: mapped.raw_description,
    job_url: mapped.job_url,
    posted_at: mapped.posted_at,
    job_family: mapped.legacy_job_family,
    intent_score: 7,
    sales_hook: mapped.market_insight,
    is_hot_lead: false,
    score_components: mapped.score_components,
  };

  const { data, error } = await supabase
    .from('job_signals')
    .upsert(payload, { onConflict: 'external_job_id', ignoreDuplicates: false })
    .select('id, external_job_id')
    .single();

  if (error) throw new Error(`Failed job_signals upsert for "${mapped.job_title}": ${error.message}`);
  return data;
}

async function upsertEnrichment(supabase, mapped, jobSignalId) {
  const payload = {
    job_signal_id: jobSignalId,
    role_title_normalized: mapped.role_title_normalized,
    role_family: mapped.role_family,
    role_cluster: mapped.role_cluster,
    emerging_role_score: 7,
    ai_relevance_score: 7,
    automation_relevance_score: 7,
    company_type: 'Unknown',
    industry: null,
    seniority: mapped.seniority,
    tools: [],
    technical_skills: [],
    business_skills: [],
    ai_skills: [],
    responsibilities: [],
    transformation_category: mapped.transformation_category,
    role_evolution_signal: null,
    less_differentiating_alone_signals: [],
    market_insight: mapped.market_insight,
    confidence_score: 0.6,
    evidence_snippets: mapped.evidence_snippets,
    model_name: 'sheet-import',
    prompt_version: 'sheet-import-v1',
    schema_version: '2026-05-05',
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

  if (error) throw new Error(`Failed labor_market_enrichments upsert for "${mapped.job_title}": ${error.message}`);
}

async function main() {
  const repoRoot = process.cwd();
  loadEnvFile(path.join(repoRoot, '.env.local'));
  loadEnvFile(path.join(repoRoot, '.env'));

  const args = parseArgs(process.argv.slice(2));
  const inputPaths = Array.isArray(args.file)
    ? args.file
    : args.file
      ? [args.file]
      : [];
  const dryRun = args['dry-run'] === 'true';

  if (inputPaths.length === 0) {
    throw new Error('Missing required argument: --file <path-to-csv> (repeat --file for multiple CSVs)');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

  const allMappedRows = [];
  for (const inputPath of inputPaths) {
    const csvPath = path.resolve(inputPath);
    const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    const mappedRows = rows
      .map(mapRow)
      .filter((row) => row.external_job_id && row.company_name && row.job_title)
      .map((row) => ({ ...row, __source_file: csvPath }));

    console.log(`Loaded ${mappedRows.length} valid rows from ${path.basename(csvPath)}`);
    allMappedRows.push(...mappedRows);
  }

  if (allMappedRows.length === 0) {
    console.log('No valid rows found in file.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const dedupKeys = [...new Set(allMappedRows.map((row) => row.external_job_id))];
  const { data: existingRows, error: existingError } = await supabase
    .from('job_signals')
    .select('external_job_id')
    .in('external_job_id', dedupKeys);

  if (existingError) {
    throw new Error(`Failed existing-row lookup: ${existingError.message}`);
  }

  const existing = new Set((existingRows ?? []).map((row) => row.external_job_id));
  const seenThisRun = new Set();
  const toInsert = [];

  for (const row of allMappedRows) {
    if (existing.has(row.external_job_id)) continue;
    if (seenThisRun.has(row.external_job_id)) continue;
    seenThisRun.add(row.external_job_id);
    toInsert.push(row);
  }

  console.log(`Parsed rows: ${allMappedRows.length}`);
  console.log(`Existing rows skipped: ${allMappedRows.length - toInsert.length}`);
  console.log(`Net-new rows: ${toInsert.length}`);

  if (dryRun || toInsert.length === 0) return;

  let inserted = 0;
  for (const row of toInsert) {
    row.job_url = await resolveJobUrl(row.job_url);
    await ensureCompany(supabase, row.company_name);
    const jobSignal = await upsertJobSignal(supabase, row);
    await upsertEnrichment(supabase, row, jobSignal.id);
    inserted += 1;
  }

  console.log(`Inserted rows: ${inserted}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
