-- Proposal only.
-- Do not apply this migration until the enrichment contract, RLS posture,
-- and pipeline write path have been reviewed.

create table if not exists public.labor_market_enrichments (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_signal_id uuid not null references public.job_signals(id) on delete cascade,

  -- Extracted facts.
  role_title_normalized text not null,
  role_family text not null,
  role_cluster text not null,
  company_type text not null default 'Unknown',
  industry text,
  seniority text not null default 'Unknown',
  tools text[] not null default '{}',
  technical_skills text[] not null default '{}',
  business_skills text[] not null default '{}',
  ai_skills text[] not null default '{}',
  responsibilities text[] not null default '{}',
  evidence_snippets text[] not null default '{}',

  -- Inferred market signals.
  emerging_role_score integer not null check (emerging_role_score between 1 and 10),
  ai_relevance_score integer not null check (ai_relevance_score between 1 and 10),
  automation_relevance_score integer not null check (automation_relevance_score between 1 and 10),
  transformation_category text,
  role_evolution_signal text,
  less_differentiating_alone_signals text[] not null default '{}',

  -- Generated summary.
  market_insight text,

  -- Quality and audit metadata.
  confidence_score numeric(4,3) not null check (confidence_score >= 0 and confidence_score <= 1),
  model_name text not null,
  prompt_version text not null,
  enrichment_timestamp timestamptz not null default now(),
  schema_version text not null default '2026-05-05',
  raw_model_output jsonb,
  validation_status text not null default 'valid',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint labor_market_enrichments_unique_version
    unique (job_signal_id, prompt_version, schema_version),
  constraint labor_market_enrichments_role_family_check
    check (
      role_family in (
        'Finance',
        'Sales & GTM',
        'Operations',
        'Marketing',
        'Product',
        'HR & People Ops',
        'Risk & Compliance',
        'Data & Analytics',
        'Software & AI',
        'Consulting & Strategy',
        'Other'
      )
    ),
  constraint labor_market_enrichments_seniority_check
    check (
      seniority in (
        'Executive',
        'Senior',
        'Manager',
        'IC',
        'Early Career',
        'Unknown'
      )
    ),
  constraint labor_market_enrichments_validation_status_check
    check (
      validation_status in (
        'valid',
        'partial',
        'invalid_json',
        'schema_error',
        'low_confidence',
        'missing_required_input',
        'insert_failed'
      )
    )
);

create index if not exists labor_market_enrichments_job_signal_id_idx
  on public.labor_market_enrichments (job_signal_id);

create index if not exists labor_market_enrichments_role_family_idx
  on public.labor_market_enrichments (role_family);

create index if not exists labor_market_enrichments_role_cluster_idx
  on public.labor_market_enrichments (role_cluster);

create index if not exists labor_market_enrichments_company_type_idx
  on public.labor_market_enrichments (company_type);

create index if not exists labor_market_enrichments_transformation_category_idx
  on public.labor_market_enrichments (transformation_category);

create index if not exists labor_market_enrichments_emerging_role_score_idx
  on public.labor_market_enrichments (emerging_role_score desc);

create index if not exists labor_market_enrichments_ai_relevance_score_idx
  on public.labor_market_enrichments (ai_relevance_score desc);

create index if not exists labor_market_enrichments_automation_relevance_score_idx
  on public.labor_market_enrichments (automation_relevance_score desc);

create index if not exists labor_market_enrichments_enrichment_timestamp_idx
  on public.labor_market_enrichments (enrichment_timestamp desc);

create index if not exists labor_market_enrichments_public_safe_idx
  on public.labor_market_enrichments (role_family, role_cluster, enrichment_timestamp desc)
  where validation_status in ('valid', 'partial');

create index if not exists labor_market_enrichments_tools_gin_idx
  on public.labor_market_enrichments using gin (tools);

create index if not exists labor_market_enrichments_technical_skills_gin_idx
  on public.labor_market_enrichments using gin (technical_skills);

create index if not exists labor_market_enrichments_business_skills_gin_idx
  on public.labor_market_enrichments using gin (business_skills);

create index if not exists labor_market_enrichments_ai_skills_gin_idx
  on public.labor_market_enrichments using gin (ai_skills);

create index if not exists labor_market_enrichments_less_differentiating_gin_idx
  on public.labor_market_enrichments using gin (less_differentiating_alone_signals);

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

revoke all on table public.labor_market_enrichments from anon, authenticated;
grant select on public.public_labor_market_enrichments to anon, authenticated;
