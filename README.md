# Career Radar

Career Radar is a labor-market intelligence app for workers navigating AI, automation, and software-driven role change.

It analyzes live job postings as market signals, then turns them into readable briefings about emerging roles, rising skills and tools, company hiring patterns, industry shifts, and worker-relevant next moves.

It is not a job board or resume scanner. The product asks:

> How is the market changing, and what is it asking workers to become?

## Product

V1 is organized around Market Lenses:

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

Main pages:

- `Market Briefing` - simple weekly readout of the strongest signals.
- `Signals` - source evidence table with search, filtering, tags/tools, dates, and links.
- `Emerging Roles` - role clusters, why they are emerging, evolved-from roles, tools, companies, and evidence.
- `Rising Skills & Tools` - rising, table-stakes, and losing-differentiation-alone skill/tool views.
- `Industries` - segment comparisons such as startups, banks, top tech, consulting, enterprise SaaS, healthcare, and government contractors.
- `Companies` - company-level hiring signals and transformation categories.
- `Methodology` - how data is collected, enriched, interpreted, and limited.

## Architecture

```text
SerpApi Google Jobs
       |
       v
n8n scheduled workflows
       |
       v
OpenAI enrichment
       |
       v
Supabase Postgres
       |
       v
Next.js app and API routes
       |
       v
Career Radar market briefings
```

Main stack:

- Next.js 16 App Router
- React 19
- Supabase Postgres
- n8n
- OpenAI GPT-4o-mini
- SerpApi Google Jobs
- Vercel

## Current State

Career Radar is a separate project fork from SignalPulse and currently reuses the existing Supabase project and historical posting data.

Current implementation:

- Market Briefing homepage
- Market Lens selector and `?lens=` URL convention
- Supabase-backed Signals evidence page
- deterministic MVP pages for roles, skills/tools, industries, companies, and methodology
- weekly aggregation utilities and API routes
- proposed labor-market enrichment contract
- proposed additive Supabase migration
- inactive repo-only n8n draft workflow for future pipeline reframe

No live Supabase migration has been applied for the new enrichment table yet. No live n8n workflow has been edited.

## Supabase

Existing source objects:

- `companies`
- `job_signals`
- `signal_tags`
- `weekly_snapshots`
- `signals_with_tags`
- `refresh_weekly_snapshots()`

Proposed future object:

- `labor_market_enrichments`

Important rule:

> Database changes must remain additive and backward-compatible until the original SignalPulse app is retired.

## n8n Workflows

Inherited workflow exports:

- `n8n/signalpulse_daily.json`
- `n8n/signalpulse_snapshots.json`

Backups:

- `n8n/backups/2026-05-05/`

Draft future workflow:

- `n8n/marketlens_daily.json`

The draft is inactive and contains no credentials.

## Local Setup

Install dependencies:

```powershell
npm install
```

Create local env files:

```powershell
Copy-Item .env.local.example .env.local
Copy-Item .env.example .env
```

For the Next.js app, fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Run locally:

```powershell
npm run dev
```

Validate:

```powershell
npm run lint
npm run build
```

## API Routes

- `/api/signals`
- `/api/tags`
- `/api/market-briefing?lens=finance`
- `/api/market-lenses`
- `/api/market-aggregations`

## Deployment

Vercel project:

- project name: `career-radar`
- project id: `prj_qkGy0EPDnsYeKKNBstVEJnMn9JK9`

Required Vercel env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The original SignalPulse deployment should remain untouched until an intentional cutover.

## Documentation

See `CODEX.md` for current project memory and phase history.

Planning docs:

- `docs/enrichment-contract.md`
- `docs/schema-proposal.md`
- `docs/pipeline-extraction-plan.md`
- `docs/pipeline-reframe.md`
- `docs/weekly-briefings.md`
