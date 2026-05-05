# Pipeline Extraction Plan

Status: planning artifact. The live n8n workflow is unchanged.

## Objective

Reframe ingestion from old sales-intent scoring into labor-market intelligence. The future workflow should continue collecting Google Jobs postings, but the OpenAI step should extract role, skill, tool, AI, automation, company type, and role-evolution signals.

## Proposed MVP Query List

Start with a smaller 10-query set to keep manual testing cheap and readable:

- finance systems analyst automation
- FP&A Power BI SQL automation
- RevOps automation
- GTM engineer
- operations workflow automation
- AI governance analyst
- model risk AI
- data analyst AI automation
- LLM evaluation
- AI workflow automation

Expansion candidates after manual testing:

- finance transformation analyst AI
- sales operations AI automation
- AI operations specialist
- compliance AI governance
- analytics engineer AI
- internal tools AI
- product manager AI workflows
- marketing operations AI
- HR operations automation
- business analyst AI tools
- consulting AI transformation
- AI enablement manager

## Source Write Strategy

Keep the current source-object model:

1. Upsert company into `companies`.
2. Upsert posting into `job_signals` by `external_job_id`.
3. Upsert tags into `signal_tags` for compatibility and lightweight filtering.
4. Insert or upsert labor-market enrichment into `labor_market_enrichments`.

The enrichment write should not block the source posting write. If enrichment fails, the posting should still exist as evidence and can be reprocessed later.

## OpenAI Step

Use the prompt in `docs/enrichment-contract.md`.

Recommended model behavior:

- JSON-only output.
- Temperature low enough for consistent extraction.
- Include prompt version, model name, and schema version in the write payload.
- Preserve raw model output in `raw_model_output` for audit and repair.

## Validation Before Insert

The workflow should validate:

- company exists
- title exists
- description or snippet exists
- model output is valid JSON
- required strings are present
- score ranges are valid
- enum fields map to allowed values
- arrays contain only short strings

Suggested workflow statuses:

- `valid`
- `partial`
- `invalid_json`
- `schema_error`
- `low_confidence`
- `missing_required_input`
- `insert_failed`

## Error Visibility

The future workflow draft should surface:

- malformed JSON
- low confidence
- missing company/title/description
- failed company upsert
- failed posting upsert
- failed enrichment insert

Minimum logging payload:

- source query
- external job id
- company
- title
- validation status
- error message

## Mapping To Supabase

| Contract field | Table column |
| --- | --- |
| `role_title_normalized` | `labor_market_enrichments.role_title_normalized` |
| `role_family` | `labor_market_enrichments.role_family` |
| `role_cluster` | `labor_market_enrichments.role_cluster` |
| `emerging_role_score` | `labor_market_enrichments.emerging_role_score` |
| `ai_relevance_score` | `labor_market_enrichments.ai_relevance_score` |
| `automation_relevance_score` | `labor_market_enrichments.automation_relevance_score` |
| `company_type` | `labor_market_enrichments.company_type` |
| `industry` | `labor_market_enrichments.industry` |
| `seniority` | `labor_market_enrichments.seniority` |
| `tools` | `labor_market_enrichments.tools` |
| `technical_skills` | `labor_market_enrichments.technical_skills` |
| `business_skills` | `labor_market_enrichments.business_skills` |
| `ai_skills` | `labor_market_enrichments.ai_skills` |
| `responsibilities` | `labor_market_enrichments.responsibilities` |
| `transformation_category` | `labor_market_enrichments.transformation_category` |
| `role_evolution_signal` | `labor_market_enrichments.role_evolution_signal` |
| `less_differentiating_alone_signals` | `labor_market_enrichments.less_differentiating_alone_signals` |
| `market_insight` | `labor_market_enrichments.market_insight` |
| `confidence_score` | `labor_market_enrichments.confidence_score` |
| `evidence_snippets` | `labor_market_enrichments.evidence_snippets` |

## Parameter Safety

The old workflow has unsafe company-name SQL interpolation. The reframed workflow should prefer Supabase table operations, RPC calls with parameters, or prepared query parameters rather than string-building SQL with company names.

If a raw SQL node remains necessary, all user/source-derived values must be parameterized.
