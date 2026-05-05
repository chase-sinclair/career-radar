# Weekly Briefings

Status: deterministic V1.

## Purpose

Weekly briefings turn posting-level evidence into a readable market intelligence object. The V1 implementation uses existing Supabase-backed `signals_with_tags` data and deterministic app-level inference. It is structured so future `labor_market_enrichments` data can replace or strengthen the same output fields.

## Data Sources

Current source:

- `signals_with_tags`
- `job_signals.created_at`
- `job_signals.job_title`
- `job_signals.company_name`
- `job_signals.job_family`
- `signal_tags` aggregated as `tech_stack`

Future source:

- `labor_market_enrichments`
- future weekly aggregation tables if volume grows

## Aggregation Module

Primary file:

- `lib/marketAggregations.ts`

The module aggregates by:

- selected market lens
- normalized role cluster
- role family
- skills/tools
- company
- inferred industry/company segment
- inferred transformation category
- week bucket based on `created_at`

## Briefing Object

`buildWeeklyMarketBriefing()` returns:

- `executiveSummary`
- `keyMarketSignals`
- `emergingRoles`
- `risingSkillsTools`
- `tableStakesSkills`
- `losingDifferentiationAlone`
- `industryReadout`
- `workerTakeaway`
- `evidenceReferences`
- `aggregation`

Every top-level signal includes or derives an evidence link back to `/signals`.

## API Routes

- `/api/market-briefing?lens=finance`
- `/api/market-lenses`
- `/api/market-aggregations`

These routes are dynamic because they read current Supabase data.

## Movement Logic

V1 groups postings by the ISO-style week start derived from `created_at`.

If at least two week buckets exist:

- current week is compared with previous week
- movement uses current count minus previous count

If history is thin:

- current data still produces counts and summaries
- deltas fall back to current counts
- page copy avoids overclaiming growth

## Known Limitations

- `created_at` is ingestion time, not true posting date.
- `tech_stack` still comes from old SignalPulse enrichment and mixes tools/skills.
- Industry/company type is inferred from names and descriptions until `labor_market_enrichments` exists.
- Week-over-week movement is weak if there is only one active week of data.
- Deterministic summaries are designed for demo clarity, not statistical rigor.

## Phase 10 Direction

After the enrichment table and n8n reframe are reviewed:

- power aggregations from `labor_market_enrichments`
- add confidence filtering
- distinguish extracted tools from skills
- persist weekly briefing snapshots
- add a generated narrative summary with cited evidence references
