# Labor Market Enrichment Contract

Status: proposal for review. This contract is not applied to Supabase yet.

## Purpose

Career Radar treats each job posting as a labor-market signal. The existing `job_signals` table should remain the source posting record inherited from SignalPulse. New labor-market intelligence belongs in a separate enrichment layer so the old app can continue using the current schema.

The enrichment layer answers:

- What role is this posting really describing?
- Which role family and cluster does it belong to?
- What tools, skills, and responsibilities are being requested?
- What does the posting imply about AI, automation, role evolution, and worker upskilling?
- How confident is the model output, and what snippets support it?

## Output Object

The OpenAI extraction step should return one JSON object per posting.

```json
{
  "role_title_normalized": "AI Workflow Engineer",
  "role_family": "Operations",
  "role_cluster": "AI Workflow Automation",
  "emerging_role_score": 8,
  "ai_relevance_score": 9,
  "automation_relevance_score": 9,
  "company_type": "Enterprise SaaS",
  "industry": "Software",
  "seniority": "IC",
  "tools": ["OpenAI API", "n8n", "Salesforce", "Python"],
  "technical_skills": ["API integration", "workflow automation", "systems integration"],
  "business_skills": ["process redesign", "stakeholder communication"],
  "ai_skills": ["LLM workflow design", "prompt evaluation"],
  "responsibilities": ["build internal AI workflows", "connect CRM and operational systems"],
  "transformation_category": "AI Workflow Automation",
  "role_evolution_signal": "Operations and engineering responsibilities are converging around AI-enabled workflow design.",
  "less_differentiating_alone_signals": ["prompt engineering alone"],
  "market_insight": "This posting suggests demand for workers who can connect AI models to business systems, not just use standalone AI tools.",
  "confidence_score": 0.86,
  "evidence_snippets": [
    "build automated workflows across Salesforce and internal systems",
    "prototype AI-powered tools using OpenAI APIs"
  ]
}
```

## Field Groups

### Extracted Facts

These should be grounded directly in title, company, description, or source metadata.

- `role_title_normalized`
- `company_type`
- `industry`
- `seniority`
- `tools`
- `technical_skills`
- `business_skills`
- `ai_skills`
- `responsibilities`
- `evidence_snippets`

### Inferred Signals

These are model interpretations based on extracted facts.

- `role_family`
- `role_cluster`
- `emerging_role_score`
- `ai_relevance_score`
- `automation_relevance_score`
- `transformation_category`
- `role_evolution_signal`
- `less_differentiating_alone_signals`

### Generated Summary

This is worker-facing interpretation and should not be treated as raw evidence.

- `market_insight`

### Quality Metadata

These fields support auditability and future reprocessing.

- `confidence_score`
- `model_name`
- `prompt_version`
- `enrichment_timestamp`
- `schema_version`
- `raw_model_output`
- `validation_status`
- `error_message`

## Allowed Values

`role_family` should be one of:

- `Finance`
- `Sales & GTM`
- `Operations`
- `Marketing`
- `Product`
- `HR & People Ops`
- `Risk & Compliance`
- `Data & Analytics`
- `Software & AI`
- `Consulting & Strategy`
- `Other`

`seniority` should be one of:

- `Executive`
- `Senior`
- `Manager`
- `IC`
- `Early Career`
- `Unknown`

`company_type` should be one of:

- `Startup`
- `Top Tech`
- `Bank`
- `Consulting`
- `Enterprise SaaS`
- `Healthcare`
- `Government Contractor`
- `Retail`
- `Insurance`
- `Education`
- `Other`
- `Unknown`

`validation_status` should be one of:

- `valid`
- `partial`
- `invalid_json`
- `schema_error`
- `low_confidence`
- `missing_required_input`
- `insert_failed`

## Scores

Scores use different scales intentionally:

- `emerging_role_score`: integer `1` to `10`
- `ai_relevance_score`: integer `1` to `10`
- `automation_relevance_score`: integer `1` to `10`
- `confidence_score`: numeric `0` to `1`

Score meanings:

- `1-3`: weak or incidental signal
- `4-6`: moderate signal
- `7-8`: strong signal
- `9-10`: defining signal

## Validation Rules

The pipeline should validate before writing to `labor_market_enrichments`.

- Output must parse as one JSON object, not markdown.
- Required strings must be non-empty after trimming.
- Score fields must be numeric and in range.
- Arrays must contain strings only.
- Arrays should be deduplicated case-insensitively.
- Array values should be short labels, not paragraphs.
- `evidence_snippets` should include 1 to 5 concise snippets copied or tightly paraphrased from the posting.
- `confidence_score < 0.55` should write a row with `validation_status = 'low_confidence'` and should not power homepage insights by default.
- Missing company, title, or description should write `validation_status = 'missing_required_input'` when a source row exists but cannot be enriched.

## Malformed Output Handling

1. First parse attempt: parse model output as JSON.
2. If parsing fails, attempt one repair call asking the model to return valid JSON matching the schema without adding new facts.
3. If repair fails, write a failed enrichment row with:
   - `job_signal_id`
   - `validation_status = 'invalid_json'`
   - `raw_model_output`
   - `error_message`
   - `model_name`
   - `prompt_version`
   - `schema_version`
4. Do not drop the posting. The raw `job_signals` row remains useful evidence.

## Retry And Fallback Plan

- Retry transient OpenAI, SerpApi, or Supabase failures up to 2 times with backoff.
- Do not retry deterministic validation failures more than once.
- If a posting is missing a description, fall back to title and company only, but set lower confidence and `validation_status = 'partial'`.
- If enrichment insert fails, log the source `job_signal_id`, company, title, and error message in the workflow execution.
- Keep the source posting write separate from enrichment write so ingestion is not blocked by enrichment quality issues.

## Example Input

```json
{
  "job_signal_id": "0a4ad6f7-98fb-4c03-b38d-00d6f0d9e3f8",
  "company_name": "ExampleBank",
  "job_title": "AI Governance Analyst",
  "raw_description": "Help document model risk controls, evaluate generative AI use cases, partner with compliance, and maintain governance procedures for AI systems.",
  "job_url": "https://example.com/jobs/ai-governance-analyst",
  "posted_at": "2 days ago"
}
```

## Example Valid Output

```json
{
  "role_title_normalized": "AI Governance Analyst",
  "role_family": "Risk & Compliance",
  "role_cluster": "AI Governance",
  "emerging_role_score": 8,
  "ai_relevance_score": 9,
  "automation_relevance_score": 4,
  "company_type": "Bank",
  "industry": "Financial Services",
  "seniority": "IC",
  "tools": [],
  "technical_skills": ["model risk management", "AI system documentation"],
  "business_skills": ["policy writing", "cross-functional governance"],
  "ai_skills": ["responsible AI", "AI risk controls", "model evaluation"],
  "responsibilities": ["document model risk controls", "evaluate generative AI use cases", "maintain AI governance procedures"],
  "transformation_category": "AI Governance",
  "role_evolution_signal": "Compliance and risk roles are expanding to include generative AI oversight and model governance.",
  "less_differentiating_alone_signals": ["generic policy documentation"],
  "market_insight": "This posting shows enterprise demand for workers who can translate AI adoption into risk controls and governance practices.",
  "confidence_score": 0.9,
  "evidence_snippets": [
    "document model risk controls",
    "evaluate generative AI use cases",
    "maintain governance procedures for AI systems"
  ]
}
```

## Proposed OpenAI Extraction Prompt

System:

```text
You analyze job postings as labor-market intelligence signals for workers navigating AI, automation, and software-driven role change. Extract grounded facts separately from inferred market signals. Return only valid JSON matching the requested schema. Do not invent tools, skills, companies, or responsibilities that are not supported by the posting. Use "losing differentiation alone" framing instead of declaring any skill dead or obsolete.
```

User:

```text
Analyze this job posting as a Career Radar labor-market signal.

Return a single JSON object with:
- role_title_normalized
- role_family
- role_cluster
- emerging_role_score
- ai_relevance_score
- automation_relevance_score
- company_type
- industry
- seniority
- tools
- technical_skills
- business_skills
- ai_skills
- responsibilities
- transformation_category
- role_evolution_signal
- less_differentiating_alone_signals
- market_insight
- confidence_score
- evidence_snippets

Rules:
- Use only facts supported by the title, company, description, and source metadata.
- Keep arrays short and deduplicated.
- Scores are 1 to 10 except confidence_score, which is 0 to 1.
- role_family must be one of the approved Career Radar role families.
- If evidence is weak, lower confidence instead of guessing.
- Return JSON only. No markdown.

Posting:
Company: {{$json.company_name}}
Title: {{$json.job_title}}
Posted: {{$json.posted_at}}
Description:
{{$json.raw_description}}
```
