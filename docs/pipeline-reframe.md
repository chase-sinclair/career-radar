# Pipeline Reframe

Status: repo draft only. The live n8n instance has not been changed.

## What Changed In The Repo

- Current exports were backed up to `n8n/backups/2026-05-05/`.
- A new inactive draft workflow was created at `n8n/marketlens_daily.json`.
- The draft uses a smaller MVP labor-market query set instead of SignalPulse sales-intent searches.
- The draft OpenAI prompt matches `docs/enrichment-contract.md`.
- The draft maps enriched output to the proposed `labor_market_enrichments` table.

## What Did Not Change

- No live n8n workflow was edited.
- No Supabase migration was applied.
- No credentials were committed.
- Existing SignalPulse exports remain in place:
  - `n8n/signalpulse_daily.json`
  - `n8n/signalpulse_snapshots.json`

## New Pipeline Goal

The future workflow should answer:

> What is the market asking workers to become as AI, automation, and modern software reshape roles?

That is different from the old goal of identifying B2B software-buying intent.

## Draft Query Strategy

The MVP query list intentionally spans the highest-priority role families:

- Finance
- Sales & GTM
- Operations
- Risk & Compliance
- Data & Analytics
- Software & AI

The first query set lives in `n8n/marketlens_daily.json` and `docs/pipeline-extraction-plan.md`.

## Prompt Strategy

The old prompt focused on state-of-change sales intent. The new prompt asks the model to extract:

- normalized role title
- role family
- role cluster
- emerging role score
- AI relevance
- automation relevance
- company type
- industry
- seniority
- tools
- technical skills
- business skills
- AI skills
- responsibilities
- role evolution signal
- less-differentiating-alone signals
- worker-facing market insight
- evidence snippets
- confidence score

The prompt explicitly separates facts from inference and avoids "dead skill" framing.

## Safer Write Pattern

The old workflow contains unsafe SQL interpolation around company names. The draft avoids this by using Supabase table upsert nodes for:

1. `companies`
2. `job_signals`
3. `labor_market_enrichments`

If the final workflow still needs raw SQL, all source-derived values should use parameter binding.

## Error Visibility

The draft includes validation status values for:

- malformed JSON
- schema errors
- low confidence
- missing required inputs
- failed inserts

Recommended production behavior:

- keep source posting writes independent from enrichment writes
- preserve raw model output for debugging
- reprocess invalid or partial enrichments later
- add notifications once a stable alert channel exists

## Mapping To The New Table

`job_signals` remains the source posting record. `labor_market_enrichments` stores the new intelligence layer. This keeps Career Radar additive and protects the existing SignalPulse app while both products share the Supabase project.

## Import Notes

Before importing `n8n/marketlens_daily.json` into live n8n:

- review the node types against the installed n8n version
- attach SerpApi, OpenAI, and Supabase service credentials manually
- confirm Supabase table-node upsert output includes the inserted `job_signals.id`
- keep the imported workflow inactive/manual during setup
- test with 1-2 queries first
- use `gpt-4o-mini` for MVP extraction
- inspect `job_signals` and `labor_market_enrichments` rows before scheduling
- verify malformed-output paths before activating the schedule
- apply and verify the proposed Supabase migration before importing/testing
- after successful manual tests, schedule daily at 6 AM
