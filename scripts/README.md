# Scripts

## Curated CSV Import

Import a curated job batch from CSV into Supabase without using n8n:

```powershell
node .\scripts\import-curated-jobs.mjs --file "C:\path\to\Career-Radar-Jobs.csv" --dry-run
node .\scripts\import-curated-jobs.mjs --file "C:\path\to\Career-Radar-Jobs.csv"
node .\scripts\import-curated-jobs.mjs --file "C:\path\to\Career-Radar-Jobs-2026-05-05.csv" --file "C:\path\to\Career-Radar-Jobs-2026-05-06.csv" --dry-run
```

Behavior:

- loads `.env.local` and `.env`
- uses `Dedup Key` as `job_signals.external_job_id`
- skips rows already present in `job_signals`
- dedupes across multiple input files in the same run
- normalizes and attempts to resolve redirect-style Apply URLs before insert
- writes a minimal `labor_market_enrichments` row with `validation_status = 'partial'`
- maps rich role families to legacy `job_signals.job_family` values for SignalPulse compatibility

## Repair Existing Job URLs

Upgrade existing redirect-style URLs in `job_signals.job_url` to the best resolved outbound link:

```powershell
node .\scripts\repair-job-urls.mjs --dry-run
node .\scripts\repair-job-urls.mjs
node .\scripts\repair-job-urls.mjs --limit 500 --dry-run
```

Behavior:

- scans recent `job_signals` rows
- targets redirect-style URLs such as `to.indeed.com` and Google `/url` links
- follows redirects when possible and stores the stronger final URL
- preserves the original URL in `score_components.original_apply_url`
