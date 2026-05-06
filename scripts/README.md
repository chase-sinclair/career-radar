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
- writes a minimal `labor_market_enrichments` row with `validation_status = 'partial'`
- maps rich role families to legacy `job_signals.job_family` values for SignalPulse compatibility
