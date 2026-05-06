import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function main() {
  const repoRoot = process.cwd();
  loadEnvFile(path.join(repoRoot, '.env.local'));
  loadEnvFile(path.join(repoRoot, '.env'));

  const args = parseArgs(process.argv.slice(2));
  const fileArg = args.file;
  const dryRun = args['dry-run'] === 'true';

  if (!fileArg) {
    throw new Error('Missing required argument: --file <path-to-cleaned-company-csv>');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

  const csvPath = path.resolve(fileArg);
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const fixes = rows
    .map((row) => ({
      id: (row.id ?? '').trim(),
      company_name: normalizeCompanyName(row.company_name),
    }))
    .filter((row) => row.id);

  console.log(`Loaded ${fixes.length} candidate rows from ${path.basename(csvPath)}`);

  if (fixes.length === 0) {
    console.log('No rows with ids found in file.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const ids = fixes.map((row) => row.id);
  const { data: existingRows, error: existingError } = await supabase
    .from('job_signals')
    .select('id, company_name')
    .in('id', ids);

  if (existingError) {
    throw new Error(`Failed job_signals lookup: ${existingError.message}`);
  }

  const existingById = new Map((existingRows ?? []).map((row) => [row.id, row.company_name]));
  let updateCount = 0;
  let unresolvedBlankCount = 0;
  let unchangedCount = 0;
  let notFoundCount = 0;

  for (const fix of fixes) {
    const currentCompanyName = existingById.get(fix.id);

    if (!existingById.has(fix.id)) {
      notFoundCount += 1;
      continue;
    }

    const nextCompanyName = fix.company_name;
    const currentNormalized = normalizeCompanyName(currentCompanyName);

    if (currentNormalized === nextCompanyName) {
      unchangedCount += 1;
      continue;
    }

    if (nextCompanyName === null) {
      unresolvedBlankCount += 1;
      continue;
    }

    updateCount += 1;

    if (dryRun) continue;

    const { error: updateError } = await supabase
      .from('job_signals')
      .update({ company_name: nextCompanyName })
      .eq('id', fix.id);

    if (updateError) {
      throw new Error(`Failed update for ${fix.id}: ${updateError.message}`);
    }
  }

  console.log(`Rows found in Supabase: ${existingById.size}`);
  console.log(`Rows to update with recovered company names: ${updateCount}`);
  console.log(`Rows skipped because no recovered company name was provided: ${unresolvedBlankCount}`);
  console.log(`Rows unchanged: ${unchangedCount}`);
  console.log(`Rows not found: ${notFoundCount}`);

  if (dryRun) {
    console.log('Dry run only — no Supabase rows were changed.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
