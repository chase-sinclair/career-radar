# CODEX.md - Career Radar

Compact project memory for Codex. Keep this file short and current. Update it when product direction, architecture, phases, or validation state changes.

---

## Current Direction

Career Radar is a labor-market intelligence product for workers navigating AI, automation, and software-driven role change across industries.

Core thesis:

> Career Radar shows how roles are changing across industries, what skills and tools are rising, and what workers should learn next.

It is not a job board, resume scanner, candidate-profile recommender, or tech-only product. It analyzes live job postings as labor-market signals.

Primary audience:

- Finance, Sales & GTM, Operations, Marketing, Product, HR & People Ops, Risk & Compliance, Data & Analytics, Software & AI, and Consulting & Strategy workers.

Design direction:

- Use the provided MarketLens mockup as the V1 north star.
- Clean editorial intelligence-report feel.
- Navy/teal/orange palette.
- Large serif-style briefing headline.
- Simple top navigation.
- Lens selector is allowed; homepage should not have dense filters, sliders, or configurable dashboard clutter.
- Raw evidence, tables, and filters belong on `Signals`, not the homepage.

---

## Workspace Rules

- Work in `C:\Users\chase\Documents\career-radar`.
- Do not modify `C:\Users\chase\Documents\signalpulse` unless explicitly requested.
- Original SignalPulse compatibility matters; Supabase and n8n changes must be additive until the old app is retired.
- Prefer migrations over editing schema dumps.
- Do not commit secrets or runtime artifacts.
- Separate extracted facts from inferred market interpretation.
- Keep `CODEX.md` concise.

Known unrelated worktree item:

- `CLAUDE.md` is deleted in the current worktree. Do not restore or remove intentionally unless the user decides.

---

## Current App Shape

Active product routes:

- `/` - Market Briefing homepage.
- `/signals` - evidence layer scaffold.
- `/emerging-roles` - emerging role intelligence scaffold.
- `/skills-tools` - rising skills and tools scaffold.
- `/industries` - industry/segment comparison scaffold.
- `/companies` - company hiring signal scaffold.
- `/methodology` - about/methodology scaffold.
- `/intelligence` - redirects to `/skills-tools` for old-route compatibility.

Key active files:

- `app/page.tsx` - Market Briefing homepage.
- `app/globals.css` - MarketLens-inspired visual system.
- `app/layout.tsx` - app shell, font setup, header.
- `components/NavLinks.tsx` - MVP navigation.
- `lib/marketLenses.ts` - market lens definitions and signal filtering.
- `lib/marketInsights.ts` - first-pass deterministic briefing aggregation.
- `app/api/signals/route.ts` - existing Supabase-backed signal API.
- `lib/supabase.ts` - Supabase clients.
- `lib/types.ts` - shared types, still includes some legacy candidate-era types.

Legacy candidate/sales dashboard components were removed during Phase 4.

---

## Data And Pipeline

Existing Supabase project:

- Project ref: `qolusthqrhcontdvfvyx`.
- Base tables: `companies`, `job_signals`, `signal_tags`, `weekly_snapshots`.
- Useful view/function: `signals_with_tags`, `refresh_weekly_snapshots()`.
- Schema dump exists at `supabase/schema.sql`; migration history is not established.

Existing ingestion:

- n8n workflow exports:
  - `n8n/signalpulse_daily.json`
  - `n8n/signalpulse_snapshots.json`
- Current workflow uses SerpApi Google Jobs, OpenAI `gpt-4o-mini`, and Supabase writes.
- Current enrichment is still old SignalPulse-style: score, reason, `tech_stack`, `job_family`.

Known future fixes:

- Tighten broad Supabase grants and restrict `refresh_weekly_snapshots()` away from `anon`.
- Add indexes for query paths before scaling.
- Fix unsafe n8n SQL interpolation for `company_name`.
- Reframe n8n search queries and OpenAI prompt for labor-market intelligence.

Target future enrichment contract should include additive fields such as:

- `role_title_normalized`
- `role_family`
- `role_cluster`
- `emerging_role_score`
- `ai_relevance_score`
- `automation_relevance_score`
- `company_type`
- `industry`
- `seniority`
- `tools`
- `technical_skills`
- `business_skills`
- `ai_skills`
- `responsibilities`
- `transformation_category`
- `role_evolution_signal`
- `less_differentiating_alone_signals`
- `market_insight`

Use the phrase "losing differentiation alone," not "dead skills."

---

## Completed Phases

### Phase 0 - Baseline And Safety

Complete. `career-radar` is a separate project fork from SignalPulse.

### Phase 1 - Fork Stabilization

Complete. Dependencies, lint/build, local env, and Vercel setup were established.

### Phase 2 - Candidate Profile Experiment

Complete but superseded. Candidate profiles proved that existing data can be transformed into different interpretations. Do not persist candidate profile schema.

### Phase 3 - Candidate Fit Scoring Experiment

Complete but superseded. Candidate fit scoring proved app-level derived scoring. It is not the final product model.

### Phase 4 - MarketLens Product Reframe

Complete locally.

What changed:

- Homepage converted from candidate recommendations to `Market Briefing`.
- MVP nav added: Market Briefing, Signals, Emerging Roles, Rising Skills & Tools, Industries, Companies, About / Methodology.
- Market lens system added in `lib/marketLenses.ts`.
- First-pass market briefing aggregation added in `lib/marketInsights.ts`.
- Secondary MVP routes added as scaffolds.
- Old candidate-era homepage components removed.
- No Supabase, n8n, or production pipeline changes were made.

Validation:

- `npm run lint`: passes.
- `npm run build`: passes.
- `/`, `/signals`, `/emerging-roles`, `/skills-tools`, `/industries`, `/companies`, `/methodology` returned `200 OK` locally.
- `/api/signals?min_score=1` returned `200 OK`.
- Dev server has been running at `http://localhost:3004`.

---

## Next Phase

### Phase 5 - App-Level Market Lens Model

Do this before Supabase or n8n changes.

Goals:

- Tighten market lens definitions.
- Improve deterministic aggregation logic in `lib/marketInsights.ts`.
- Make selected lens affect detail pages, especially `Signals`.
- Move any raw evidence/search/table behavior to `Signals`.
- Keep homepage simple and report-like.

Likely implementation tasks:

- Add reusable lens selector component.
- Add a shared query-param convention: `?lens=...`.
- Build a real `Signals` page using existing `/api/signals`.
- Link Market Briefing insights to filtered evidence.
- Improve role normalization and tool/skill grouping.
- Remove or quarantine remaining candidate-era code from `lib/types.ts`, `lib/candidateProfiles.ts`, and `lib/candidateFit.ts` once no routes depend on it.

Phase 5 exit criteria:

- Lens selection changes visible insights on homepage and at least one detail page.
- User can verify a briefing signal by clicking through to evidence.
- No database changes required.

---

## Later Phases

### Phase 6 - MVP Detail Pages

Build real versions of:

- Emerging Roles
- Rising Skills & Tools
- Industries
- Companies
- About / Methodology

Every insight should link to source postings where possible.

### Phase 7 - Enrichment Contract And Schema Proposal

Create a reviewable labor-market intelligence schema and Supabase migration plan. Keep changes additive.

### Phase 8 - n8n / OpenAI Pipeline Reframe

Update workflow exports, search queries, OpenAI prompt, and write paths after the app-level model is proven.

### Phase 9 - Weekly Aggregation

Generate weekly briefings, rising/table-stakes/losing-differentiation-alone patterns, and snapshots by lens.

### Phase 10 - Demo Polish

Update README, methodology, visuals, and demo story for recruiters/portfolio viewers.

---

## Validation Commands

Run after implementation changes:

```powershell
npm run lint
npm run build
```

Smoke test locally:

```powershell
Invoke-WebRequest -Uri 'http://localhost:3004' -UseBasicParsing -TimeoutSec 15
Invoke-WebRequest -Uri 'http://localhost:3004/api/signals?min_score=1' -UseBasicParsing -TimeoutSec 30
```

Build may change `next-env.d.ts` from `.next/dev/types/routes.d.ts` to `.next/types/routes.d.ts`; restore the dev import before finalizing if it appears as generated churn.

---

## Open Decisions

- Keep the visible brand as Career Radar, or rename to MarketLens?
- Which market lenses should ship in V1?
- Should the first Market Briefing stay deterministic, or later include generated weekly narrative summaries?
- Should future enriched fields live on `job_signals` or a related table?
- How broad should the first labor-market n8n query set be?
