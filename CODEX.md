# CODEX.md - Career Radar

Compact project memory for future Codex sessions. Keep this file short and current.

## Product Direction

Career Radar is a labor-market intelligence product for workers navigating AI, automation, and software-driven role change across industries.

Core thesis:

> Career Radar shows how roles are changing, what skills and tools are rising, and what workers should learn next.

It is not a job board, resume scanner, candidate-profile recommender, or tech-only product. It analyzes live job postings as labor-market signals.

Visible brand for V1: `Career Radar`.

Internal analytical system: `Market Lens`.

V1 lenses:

- All Market
- Finance
- Sales & GTM
- Operations
- Marketing
- Product
- HR & People Ops
- Risk & Compliance
- Data & Analytics
- Software & AI
- Consulting & Strategy

Design direction:

- Clean editorial intelligence-report feel inspired by the Market Briefing mockup.
- Navy/teal/orange palette.
- Simple top navigation and lens selector.
- Homepage stays simple and briefing-like.
- Raw evidence, tables, and filtering belong on `Signals`.

## Workspace Rules

- Work in `C:\Users\chase\Documents\career-radar`.
- Do not modify `C:\Users\chase\Documents\signalpulse` unless explicitly requested.
- Original SignalPulse compatibility matters; Supabase and n8n changes must be additive until the old app is retired.
- Do not apply Supabase migrations unless the user explicitly asks.
- Do not edit live n8n unless explicitly asked.
- Do not commit secrets, `.env.local`, `.next`, `.vercel`, SQLite files, or credentials.
- Separate extracted facts from inferred market interpretation.

## Current App Shape

Routes:

- `/` - Market Briefing homepage.
- `/signals` - evidence table with search/filtering/source links.
- `/emerging-roles` - deterministic emerging role summaries.
- `/skills-tools` - rising, table-stakes, and losing-differentiation-alone skill/tool summaries.
- `/industries` - segment comparison.
- `/companies` - company-level hiring signal summaries.
- `/methodology` - pipeline and interpretation methodology.
- `/intelligence` - old-route redirect to `/skills-tools`.

Key files:

- `lib/marketLenses.ts` - lens definitions and filtering.
- `lib/marketInsights.ts` - deterministic role, skill, company, and segment helpers.
- `lib/marketAggregations.ts` - weekly briefing and aggregation contract.
- `app/api/signals/route.ts` - existing Supabase-backed source/evidence API.
- `app/api/market-briefing/route.ts` - weekly briefing API.
- `app/api/market-lenses/route.ts` - lens API.
- `app/api/market-aggregations/route.ts` - all-lens aggregation API.
- `docs/enrichment-contract.md` - future OpenAI output contract.
- `docs/schema-proposal.md` - additive Supabase schema proposal.
- `docs/pipeline-reframe.md` - n8n/OpenAI reframe notes.
- `n8n/marketlens_daily.json` - validated hosted n8n workflow draft for manual runs.

## Data And Pipeline

Existing Supabase project:

- Project ref: `qolusthqrhcontdvfvyx`.
- Source tables: `companies`, `job_signals`, `signal_tags`, `weekly_snapshots`.
- View/function: `signals_with_tags`, `refresh_weekly_snapshots()`.
- Schema dump: `supabase/schema.sql`.

Additive labor-market table:

- `labor_market_enrichments`
- Applied from `supabase/migrations/20260505191712_proposal_labor_market_enrichments.sql`
- Public-safe view exists: `public_labor_market_enrichments`

Existing n8n exports:

- `n8n/signalpulse_daily.json`
- `n8n/signalpulse_snapshots.json`

Backups:

- `n8n/backups/2026-05-05/`

Current ingestion sources:

- `SerpApi` via hosted n8n workflow
- Claude connector routine writing curated rows into `Career Radar - Job Tracker`
- Local curated CSV import via `scripts/import-curated-jobs.mjs`

Current workflow state:

- Hosted `Career Radar MarketLens Daily` manual workflow is proven end-to-end for:
  - search
  - OpenAI extraction
  - validation and normalization
  - `job_signals` write
  - `labor_market_enrichments` write
- `job_signals.job_family` still requires legacy enum mapping.
- Claude routine output quality is stronger than SerpApi for cross-functional roles.

Current local scripts:

- `scripts/import-curated-jobs.mjs` - imports curated CSVs into `job_signals` and `labor_market_enrichments`
- `scripts/repair-job-urls.mjs` - upgrades redirect-style outbound URLs
- `scripts/apply-company-name-fixes.mjs` - updates recovered employer names by `job_signals.id`
- `scripts/apply-company-types.mjs` - maps dictionary company types into `labor_market_enrichments.company_type`
- `scripts/backfill-labor-market-enrichments.mjs` - creates minimal enrichment rows for legacy `job_signals`

Current data status:

- Curated CSV import path is active and preferred for higher-quality data.
- Imported rows now auto-apply company types when `company-type-dictionary.csv` is available.
- `705` legacy rows were backfilled into `labor_market_enrichments` with minimal `partial` rows (`prompt_version = backfill-v1`).
- Recovered employer names were applied to `job_signals.company_name` where possible.
- Unresolved intermediary/source-like rows remain as evidence rows but are excluded from company analysis.
- Company analysis exclusions are enforced in backend summary logic (`Companies`, `Industries`, company-oriented aggregations).
- Company type dictionary has already been applied to existing enrichment rows.
- Some old Serp/Google Jobs rows still have weak Google wrapper `job_url` values and are not fully cleaned yet.

Known future database/security work:

- Tighten broad Supabase grants and restrict `refresh_weekly_snapshots()` away from `anon`.
- Add query indexes for existing dashboard paths.
- Add an ingestion-source field or durable metadata path for `serpapi`, `claude_routine`, and future manual imports.

## Completed Phases

- Phase 0 - Baseline and safety: separate Career Radar project fork created.
- Phase 1 - Fork stabilization: env templates, Vercel project, lint/build established.
- Phase 2 - Candidate profile experiment: superseded by labor-market product direction.
- Phase 3 - Candidate fit scoring experiment: superseded by market lens model.
- Phase 4 - MarketLens product reframe: homepage/nav/design reframed around Market Briefing.
- Phase 5 - App-level market lens model: lenses, `?lens=`, Signals evidence page, candidate code removal.
- Phase 6 - MVP pages: Signals, Emerging Roles, Skills & Tools, Industries, Companies, Methodology.
- Phase 7 - Enrichment contract and schema proposal: docs and draft migration only.
- Phase 8 - n8n/OpenAI pipeline reframe: backup exports and inactive draft workflow only.
- Phase 9 - Weekly aggregation: aggregation utilities and market API routes.
- Phase 8.5 - Hosted workflow validation: migration applied, community upsert node tested, manual smoke tests passed, legacy family mapping added.
- Phase 8.6 - Claude routine source: Google Sheet/CSV curated source validated as promising secondary ingestion source.
- Phase 8.7 - Local curated import: CSV importer, URL repair, company-name cleanup, company-type mapping, and enrichment backfill completed.

Latest validation:

- `npm run lint`: passes.
- `npm run build`: passes.
- Smoke-tested locally on `http://localhost:3004`:
  - `/`
  - `/signals`
  - `/emerging-roles`
  - `/skills-tools`
  - `/industries`
  - `/companies`
  - `/methodology`
  - `/api/market-lenses`
  - `/api/market-briefing?lens=finance`
  - `/api/market-aggregations`

## Validation Commands

```powershell
npm run lint
npm run build
```

Smoke test:

```powershell
Invoke-WebRequest -Uri 'http://localhost:3004' -UseBasicParsing -TimeoutSec 15
Invoke-WebRequest -Uri 'http://localhost:3004/api/market-briefing?lens=finance' -UseBasicParsing -TimeoutSec 30
```

Build may change `next-env.d.ts` from `.next/dev/types/routes.d.ts` to `.next/types/routes.d.ts`; restore the dev import before finalizing if it appears as generated churn.

## Recommended Phase 10

- Review the app in browser and polish UX/content using the cleaned dataset.
- Improve old Serp/Google Jobs wrapper URL handling if those legacy rows still matter.
- Optionally make future imports auto-apply company-name fixes dictionary, not just company types.
- Continue frontend/product refinement now that the data layer is substantially cleaner.
