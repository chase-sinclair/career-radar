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
    args[key] = next;
    index += 1;
  }
  return args;
}

function isRepairCandidate(url) {
  return typeof url === 'string' && (
    url.includes('to.indeed.com/') ||
    url.includes('www.google.com/url?') ||
    url.includes('google.com/url?')
  );
}

async function main() {
  const repoRoot = process.cwd();
  loadEnvFile(path.join(repoRoot, '.env.local'));
  loadEnvFile(path.join(repoRoot, '.env'));

  const args = parseArgs(process.argv.slice(2));
  const dryRun = args['dry-run'] === 'true';
  const limit = Number.parseInt(args.limit ?? '200', 10);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('job_signals')
    .select('id, job_url, score_components')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed job_signals lookup: ${error.message}`);

  const candidates = (data ?? []).filter((row) => isRepairCandidate(row.job_url));
  console.log(`Scanned rows: ${data?.length ?? 0}`);
  console.log(`Repair candidates: ${candidates.length}`);

  let updated = 0;
  for (const row of candidates) {
    const normalizedOriginal = normalizeJobUrl(row.job_url);
    const resolved = await resolveJobUrl(row.job_url);

    if (!resolved || resolved === normalizedOriginal) continue;

    console.log(`${row.id}\n  before: ${row.job_url}\n  after:  ${resolved}`);

    if (dryRun) continue;

    const nextComponents = {
      ...(row.score_components ?? {}),
      original_apply_url: row.job_url,
      resolved_job_url: resolved,
    };

    const { error: updateError } = await supabase
      .from('job_signals')
      .update({
        job_url: resolved,
        score_components: nextComponents,
      })
      .eq('id', row.id);

    if (updateError) {
      throw new Error(`Failed update for ${row.id}: ${updateError.message}`);
    }

    updated += 1;
  }

  console.log(`Updated rows: ${updated}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
