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

## Apply Company Name Fixes

Apply a cleaned company-name CSV back to `job_signals` using the row `id`:

```powershell
node .\scripts\apply-company-name-fixes.mjs --file "C:\path\to\cleaned-company-fixes.csv" --dry-run
node .\scripts\apply-company-name-fixes.mjs --file "C:\path\to\cleaned-company-fixes.csv"
```

Behavior:

- loads `.env.local` and `.env`
- matches rows by `job_signals.id`
- updates `company_name` when your cleaned CSV has a recovered name
- sets `company_name` to `null` when your cleaned CSV leaves it blank
- skips unchanged rows automatically

## Apply Company Types

Apply a normalized company-name dictionary back to `labor_market_enrichments.company_type`:

```powershell
node .\scripts\apply-company-types.mjs --file "C:\path\to\company-type-dictionary.csv" --dry-run
node .\scripts\apply-company-types.mjs --file "C:\path\to\company-type-dictionary.csv"
```

Behavior:

- loads `.env.local` and `.env`
- matches `lower(trim(job_signals.company_name))` to `normalized_company_name`
- updates `labor_market_enrichments.company_type`
- only accepts the approved V1 company type values
- skips unmatched and unchanged rows automatically

## Backfill Labor Market Enrichments

Create minimal `labor_market_enrichments` rows for older `job_signals` that do not have any enrichment yet:

```powershell
node .\scripts\backfill-labor-market-enrichments.mjs --dry-run
node .\scripts\backfill-labor-market-enrichments.mjs
node .\scripts\backfill-labor-market-enrichments.mjs --limit 100 --dry-run
```

Behavior:

- loads `.env.local` and `.env`
- finds `job_signals` rows without any enrichment row
- creates a minimal partial enrichment row
- infers a best-effort role family, cluster, seniority, and snippet
- sets `company_type` to `Unknown` until a dictionary is applied
