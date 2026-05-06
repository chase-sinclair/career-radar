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

Current workflow state:

- Hosted `Career Radar MarketLens Daily` manual workflow is proven end-to-end for:
  - search
  - OpenAI extraction
  - validation and normalization
  - `job_signals` write
  - `labor_market_enrichments` write
- `job_signals.job_family` still requires legacy enum mapping.
- Claude routine output quality is stronger than SerpApi for cross-functional roles.

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

- Visual/demo polish after reviewing the app in browser.
- Build `Career Radar Sheet Import` workflow for Google Sheet -> Supabase ingestion.
- Use `Dedup Key` as `external_job_id` for curated imports.
- Map sheet `Role Family` to legacy `job_signals.job_family` while preserving rich categories in `labor_market_enrichments`.
- Decide whether curated imports should create minimal `partial` enrichment rows directly or run a second-pass enrichment.
- Update Vercel deployment after final local validation.
- Build a concise recruiter demo story around: live job data -> AI enrichment -> market lenses -> evidence-backed worker guidance.
