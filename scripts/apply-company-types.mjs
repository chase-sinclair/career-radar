import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_COMPANY_TYPES = new Set([
  'Startup',
  'Top Tech',
  'Bank',
  'Consulting',
  'Enterprise SaaS',
  'Healthcare',
  'Government Contractor',
  'Other',
  'Unknown',
]);

const COMPANY_TYPE_EXCLUSIONS = new Set([
  '<blank>',
  'something went wrong. try again.',
  'unavailable',
  'jobflarely (client)',
  'gpac (client)',
  'niche b2b services company...recession resistant...large brand name clients',
]);

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
    headers.forEach((header, headerIndex) => {
      record[header] = (values[headerIndex] ?? '').trim();
    });
    return record;
  });
}

function normalizeCompanyName(value) {
  const trimmed = (value ?? '').trim().toLowerCase();
  return trimmed && !COMPANY_TYPE_EXCLUSIONS.has(trimmed) ? trimmed : null;
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
  const fileArg = args.file;
  const dryRun = args['dry-run'] === 'true';

  if (!fileArg) {
    throw new Error('Missing required argument: --file <path-to-company-type-dictionary.csv>');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

  const csvPath = path.resolve(fileArg);
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const dictionary = new Map();
  let invalidTypeCount = 0;

  for (const row of rows) {
    const normalized = normalizeCompanyName(row.normalized_company_name);
    const companyType = (row.company_type ?? '').trim();
    if (!normalized) continue;
    if (!ALLOWED_COMPANY_TYPES.has(companyType)) {
      invalidTypeCount += 1;
      continue;
    }
    dictionary.set(normalized, companyType);
  }

  console.log(`Loaded ${dictionary.size} company-type mappings from ${path.basename(csvPath)}`);
  if (invalidTypeCount > 0) {
    console.log(`Skipped ${invalidTypeCount} rows with invalid company_type values`);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const jobSignals = await fetchAll(supabase, 'job_signals', 'id, company_name');
  const enrichments = await fetchAll(
    supabase,
    'labor_market_enrichments',
    'job_signal_id, company_type, prompt_version, schema_version',
  );

  const companyNameByJobSignalId = new Map(
    jobSignals.map((row) => [row.id, normalizeCompanyName(row.company_name)]),
  );

  let matchedCount = 0;
  let updateCount = 0;
  let unchangedCount = 0;

  for (const enrichment of enrichments) {
    const normalizedCompanyName = companyNameByJobSignalId.get(enrichment.job_signal_id);
    if (!normalizedCompanyName) continue;

    const nextCompanyType = dictionary.get(normalizedCompanyName);
    if (!nextCompanyType) continue;

    matchedCount += 1;

    if (enrichment.company_type === nextCompanyType) {
      unchangedCount += 1;
      continue;
    }

    updateCount += 1;
    if (dryRun) continue;

    const { error: updateError } = await supabase
      .from('labor_market_enrichments')
      .update({ company_type: nextCompanyType })
      .eq('job_signal_id', enrichment.job_signal_id)
      .eq('prompt_version', enrichment.prompt_version)
      .eq('schema_version', enrichment.schema_version);

    if (updateError) {
      throw new Error(`Failed company_type update for ${enrichment.job_signal_id}: ${updateError.message}`);
    }
  }

  console.log(`Enrichment rows matched by company dictionary: ${matchedCount}`);
  console.log(`Enrichment rows to update: ${updateCount}`);
  console.log(`Enrichment rows already correct: ${unchangedCount}`);

  if (dryRun) {
    console.log('Dry run only — no Supabase rows were changed.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
