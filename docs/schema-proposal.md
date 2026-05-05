# Schema Proposal

Status: proposal only. Do not apply to Supabase until reviewed.

## Summary

Add one new table: `public.labor_market_enrichments`.

The table links to existing `public.job_signals.id` through `job_signal_id`. It stores the labor-market intelligence layer created by the future n8n/OpenAI pipeline while preserving the inherited SignalPulse tables.

## Why A Separate Table

`job_signals` is the inherited source posting table used by the original SignalPulse app. Modifying it directly would mix source data, old sales-intent fields, and new labor-market interpretation in one object.

`labor_market_enrichments` is preferred because it:

- keeps SignalPulse compatibility intact
- lets Career Radar re-enrich a posting without rewriting source data
- separates extracted facts from model interpretation and quality metadata
- supports multiple future prompt/model versions
- makes failed or partial enrichments auditable
- avoids widening `job_signals` with many nullable columns

## Proposed Table

```sql
create table if not exists public.labor_market_enrichments (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_signal_id uuid not null references public.job_signals(id) on delete cascade,
  role_title_normalized text not null,
  role_family text not null,
  role_cluster text not null,
  emerging_role_score integer not null check (emerging_role_score between 1 and 10),
  ai_relevance_score integer not null check (ai_relevance_score between 1 and 10),
  automation_relevance_score integer not null check (automation_relevance_score between 1 and 10),
  company_type text not null default 'Unknown',
  industry text,
  seniority text not null default 'Unknown',
  tools text[] not null default '{}',
  technical_skills text[] not null default '{}',
  business_skills text[] not null default '{}',
  ai_skills text[] not null default '{}',
  responsibilities text[] not null default '{}',
  transformation_category text,
  role_evolution_signal text,
  less_differentiating_alone_signals text[] not null default '{}',
  market_insight text,
  confidence_score numeric(4,3) not null check (confidence_score >= 0 and confidence_score <= 1),
  evidence_snippets text[] not null default '{}',
  model_name text not null,
  prompt_version text not null,
  enrichment_timestamp timestamptz not null default now(),
  schema_version text not null default '2026-05-05',
  raw_model_output jsonb,
  validation_status text not null default 'valid',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_signal_id, prompt_version, schema_version)
);
```

## Proposed Indexes

These indexes support the V1 pages and future APIs:

- `job_signal_id` for joins from source postings
- `role_family` for lens filtering
- `role_cluster` for emerging-role summaries
- `company_type` for industry/segment readouts
- `transformation_category` for weekly briefing groups
- `emerging_role_score desc` for roles-to-watch
- `ai_relevance_score desc` for AI signal pages
- `automation_relevance_score desc` for automation signal pages
- `enrichment_timestamp desc` for weekly recency
- GIN indexes on arrays used for skill/tool filtering:
  - `tools`
  - `technical_skills`
  - `business_skills`
  - `ai_skills`
  - `less_differentiating_alone_signals`
- partial index on public-safe rows:
  - `where validation_status in ('valid', 'partial')`

## RLS And Grants Recommendation

Use a stricter public model than the current inherited app. The base enrichment table should be internal because it stores debug fields such as `raw_model_output` and `error_message`.

Recommended posture:

- Enable RLS on `labor_market_enrichments`.
- Do not grant `anon` or `authenticated` direct access to the base table.
- Expose only a public-safe view that excludes debug/internal columns.
- Public-safe rows are only `validation_status in ('valid', 'partial')`.
- `low_confidence`, malformed, schema-error, and insert-failed rows stay internal.
- Do not grant write permissions to `anon` or `authenticated`.
- Write with `service_role` from n8n only.
- Grant `SELECT` explicitly on the public-safe view instead of `ALL` on the table.

Proposed policies:

```sql
alter table public.labor_market_enrichments enable row level security;

create policy "Service role can manage labor market enrichments"
on public.labor_market_enrichments
for all
to service_role
using (true)
with check (true);

create or replace view public.public_labor_market_enrichments as
select
  id,
  job_signal_id,
  role_title_normalized,
  role_family,
  role_cluster,
  company_type,
  industry,
  seniority,
  tools,
  technical_skills,
  business_skills,
  ai_skills,
  responsibilities,
  emerging_role_score,
  ai_relevance_score,
  automation_relevance_score,
  transformation_category,
  role_evolution_signal,
  less_differentiating_alone_signals,
  market_insight,
  confidence_score,
  evidence_snippets,
  model_name,
  prompt_version,
  enrichment_timestamp,
  schema_version,
  validation_status,
  created_at,
  updated_at
from public.labor_market_enrichments
where validation_status in ('valid', 'partial');
```

Recommended grants:

```sql
revoke all on table public.labor_market_enrichments from anon, authenticated;
grant select on public.public_labor_market_enrichments to anon, authenticated;
```

The public-safe view intentionally excludes:

- `raw_model_output`
- `error_message`

These fields are useful for debugging and reprocessing, but should never be exposed to browser clients.

## Backward Compatibility

This proposal does not:

- drop tables
- rename columns
- alter existing SignalPulse columns
- change `signals_with_tags`
- change `refresh_weekly_snapshots()`
- require the old n8n workflow to change immediately

The current app can continue using `/api/signals` and existing deterministic inference until the new enrichment table is populated.

## Migration Draft

The review-only SQL draft is:

- `supabase/migrations/20260505191712_proposal_labor_market_enrichments.sql`

Do not apply it yet. Review RLS, grants, indexes, and prompt/versioning before applying.
