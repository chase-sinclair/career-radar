# CODEX.md - Career Radar

> Project memory and execution plan for the SignalPulse pivot.
> This file is the Codex-facing source of truth for the project direction, implementation phases, and constraints.

---

## 0. Current Project Status

Career Radar is a clean project fork created from `C:\Users\chase\Documents\signalpulse`.

The original SignalPulse project should remain untouched unless explicitly requested. All pivot work should happen in:

```text
C:\Users\chase\Documents\career-radar
```

Current state:

- The app is a Next.js 16 project deployed separately from the original SignalPulse project.
- It reuses the existing Supabase project `qolusthqrhcontdvfvyx`.
- It reuses the existing n8n / SerpApi / OpenAI / Supabase ingestion pattern.
- The repo currently contains prior candidate-profile experiment work, but the product direction has pivoted again.
- The new product direction is labor-market intelligence for workers navigating AI, automation, and software-driven role change.

Important current decision:

- Keep the existing Supabase project for now.
- Keep all database changes additive and backward-compatible.
- Do not modify the original SignalPulse repo.
- Do not start Supabase migrations or n8n workflow edits until the new Market Briefing UI and enrichment contract are clear.

---

## 1. Product Thesis

SignalPulse started as a B2B sales-intelligence dashboard that identified software buying windows from job postings.

Career Radar is now becoming a labor-market intelligence product.

Core thesis:

> Career Radar helps workers understand how AI, automation, and modern software tools are reshaping roles, skills, tools, and career paths by analyzing live job postings as labor-market signals.

This is not a job board.

This is not only for tech workers.

This is not a resume scanner.

The product should feel closer to:

- A labor-market radar for the AI era.
- Google Trends for role and skill transformation.
- A weekly intelligence briefing on how work is changing.

Primary question:

> What is the market asking workers to become?

Supporting questions:

- What roles are emerging?
- Which traditional roles are being transformed?
- Which skills are becoming expected?
- Which tools are rising across industries?
- Which standalone skills are losing differentiation unless paired with newer capabilities?
- Which companies and industries are signaling workforce transformation through hiring?
- What should workers learn next to stay relevant?

---

## 2. Target Users

Career Radar is for knowledge workers and career builders whose roles are being reshaped by AI, automation, and modern software tools.

It should support many role families, including:

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

Examples of worker-facing questions:

- Finance: Is Excel enough, or are roles now asking for SQL, Power BI, NetSuite, Workday, Python, and automation?
- Sales & GTM: Are GTM roles becoming more technical through CRM workflows, enrichment tools, AI prospecting, and revenue automation?
- Operations: Are process roles becoming workflow automation roles?
- Risk & Compliance: Are banks and enterprises hiring for AI governance, model risk, documentation, and responsible AI?
- Marketing: Are marketing operations roles shifting toward AI content workflows, analytics, and automation?
- Software & AI: Which AI engineering, evals, workflow, and infrastructure roles are actually appearing in job postings?

Positioning line:

> Career Radar shows how roles are changing across industries, what skills and tools are rising, and what workers should learn next.

---

## 3. MVP Product Surface

The MVP should use the visual direction from the provided MarketLens mockup:

- Clean editorial intelligence-report feel.
- Navy/teal/orange palette.
- Large serif-style briefing headline.
- Simple top navigation.
- Lens selector, but no confusing homepage filters.
- Homepage sections arranged like a weekly market readout.
- Cards may exist, but the page should not feel like a dense configurable dashboard.

Recommended MVP tabs:

### Market Briefing

Homepage. Answers: "What is changing in the labor market right now?"

Expected sections:

- Executive briefing.
- Key market signals.
- Market movement snapshot.
- Industry readout.
- What this means for workers.
- Evidence CTA linking to the raw signal explorer.

### Signals

Evidence layer. Shows the enriched job postings behind the insights.

This is where search, detailed tables, and filters belong. Keep them off the homepage.

### Emerging Roles

Tracks new, niche, or rapidly mutating job titles.

For each role, show:

- Normalized role title.
- Why it is emerging.
- Traditional role it evolved from.
- Common skills/tools.
- Companies or industries hiring.
- Evidence snippets from postings.

### Rising Skills & Tools

Combines skill and tool intelligence for MVP.

Categories:

- Rising skills.
- Table-stakes skills.
- AI-adjacent skills.
- Role-specific tools.
- Skills losing differentiation alone.

### Industries

Compares role and skill change across market segments.

Initial segments:

- Startups.
- Banks.
- Top Tech.
- Consulting.
- Enterprise SaaS.
- Healthcare.
- Government Contractors.

### Companies

Shows what companies reveal through hiring.

For each company, show:

- Hiring focus.
- Top roles.
- Top tools/skills.
- Transformation category.
- Evidence from postings.

### About / Methodology

Explains the pipeline:

- SerpApi Google Jobs collection.
- n8n scheduling.
- OpenAI enrichment.
- Supabase storage.
- App-level aggregation and inference.
- Difference between extracted facts and inferred market interpretation.

---

## 4. Market Lenses

The product should use market lenses, not candidate profiles.

Initial lenses:

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

Later lenses may include:

- AI & Automation
- Enterprise AI Governance
- Startups
- Banks
- Top Tech
- Consulting Firms

Lens behavior:

- The selected lens changes briefing text, role clusters, skills/tools, companies, industries, and evidence.
- Lenses are analysis scopes, not user profiles.
- The homepage should keep lens selection simple.

---

## 5. Data Direction

Existing base tables remain useful:

- `companies`
- `job_signals`
- `signal_tags`
- `weekly_snapshots`

Existing useful view/function:

- `signals_with_tags`
- `refresh_weekly_snapshots()`

Existing fields already provide:

- Job title.
- Company.
- Job description.
- Job family.
- Tags/tools through `signal_tags`.
- Posting URL.
- Ingestion time.
- Legacy intent score.

New labor-market intelligence fields should be additive.

Target enrichment contract:

```json
{
  "role_title_normalized": "AI Workflow Engineer",
  "role_family": "Operations",
  "role_cluster": "AI Workflow Automation",
  "emerging_role_score": 8,
  "ai_relevance_score": 9,
  "automation_relevance_score": 9,
  "company_type": "Startup",
  "industry": "Enterprise SaaS",
  "seniority": "IC",
  "tools": ["OpenAI", "n8n", "Zapier", "Python"],
  "technical_skills": ["API integration", "workflow automation"],
  "business_skills": ["process redesign", "stakeholder communication"],
  "ai_skills": ["RAG", "prompt evaluation", "LLM workflow design"],
  "responsibilities": ["build internal AI tools", "automate business workflows"],
  "transformation_category": "AI Workflow Automation",
  "role_evolution_signal": "Operations and engineering responsibilities are converging around AI-enabled workflow design.",
  "less_differentiating_alone_signals": ["prompt engineering alone"],
  "market_insight": "This role suggests growing demand for workers who can connect AI models to operational systems."
}
```

Important distinction:

- Extracted facts: role title, tools, skills, company, industry, responsibilities.
- Inferred signals: emerging role score, role evolution notes, less differentiating alone signals, market insight.

Avoid saying "dead skills." Use:

> Losing differentiation alone.

---

## 6. Ingestion Direction

The current n8n workflow is still valuable, but its purpose must change.

Current workflow:

- Runs daily at 6 AM.
- Uses SerpApi Google Jobs searches.
- Sends postings to GPT-4o-mini.
- Extracts score, reason, tech_stack, and job_family.
- Writes data into Supabase.

New workflow goal:

> Analyze each job posting as a labor-market intelligence signal. Extract what it reveals about emerging roles, AI adoption, required skills, requested tools, company type, role evolution, and worker-relevant market shifts.

Search queries need to broaden beyond the old SignalPulse software-buying intent queries.

Example future queries:

- AI workflow automation.
- AI governance analyst.
- GTM engineer.
- finance systems analyst automation.
- FP&A Power BI SQL automation.
- RevOps automation.
- marketing operations AI.
- HR operations automation.
- model risk AI.
- LLM evaluation.
- internal tools AI.
- operations workflow automation.
- AI transformation consultant.

Do not edit the live workflow until exports are backed up and the new schema is reviewed.

---

## 7. Current Infrastructure Facts

Supabase:

- Project ref: `qolusthqrhcontdvfvyx`
- Existing schema dump: `supabase/schema.sql`
- Migrations directory currently empty.
- RLS allows public SELECT in practice.
- Known issue: broad grants should be tightened later.
- Known issue: missing secondary indexes for dashboard/query paths.
- Known issue: `refresh_weekly_snapshots()` should not be callable by `anon`.

n8n:

- Workflow exports are present:
  - `n8n/signalpulse_daily.json`
  - `n8n/signalpulse_snapshots.json`
- Daily workflow name: `SignalPulse AI`
- Snapshot workflow name: `signalpulse_snapshots`
- Daily workflow active at export time.
- Snapshot workflow active at export time.
- OpenAI model: `gpt-4o-mini`
- Credentials are referenced by name only, not exported as secrets.

Known workflow issue:

```sql
INSERT INTO companies (name)
VALUES ('{{ $json.company_name }}')
```

This direct interpolation can break on apostrophes and should be replaced with parameter binding before relying on the workflow long-term.

---

## 8. Implementation Phases

This is the revised roadmap after the labor-market intelligence pivot.

### Phase 0 - Baseline And Safety

Status: Complete.

Goal: keep `career-radar` independent and protect the original SignalPulse project.

Exit criteria:

- Separate repo exists.
- Original SignalPulse remains untouched.
- Secrets and runtime artifacts are not committed.
- `CODEX.md` exists as active project memory.

### Phase 1 - Fork Stabilization

Status: Complete.

Goal: make the copied app run locally and deploy separately.

Exit criteria:

- Dependencies installed.
- Lint/build pass.
- Local Supabase env configured.
- Vercel project exists for Career Radar.

### Phase 2 - Candidate Profile Experiment

Status: Complete, but superseded.

Goal: prove app-level personalization against existing job signals.

Outcome:

- Candidate profiles were implemented.
- Profile-specific fit scoring was implemented.
- This proved the data could be transformed into different interpretations.

Current decision:

- Do not persist candidate profiles.
- Do not build Supabase schema around candidate personalization.
- Candidate-profile code may be removed or repurposed during the MarketLens refactor.

### Phase 3 - Candidate Fit Scoring Experiment

Status: Complete, but superseded.

Goal: score existing job signals for candidate-specific fit.

Outcome:

- Useful as proof that app-level derived scoring works.
- Not the final product model.

Current decision:

- Replace candidate fit with market-signal aggregation and lens-based interpretation.

### Phase 4 - MarketLens Product Reframe

Status: Implemented locally.

Goal: convert the app from candidate recommendations to labor-market intelligence.

Scope:

- Rename/refocus visible product language around Market Briefing and labor-market signals.
- Replace candidate tabs with market lens selector.
- Update navigation to:
  - Market Briefing
  - Signals
  - Emerging Roles
  - Rising Skills & Tools
  - Industries
  - Companies
  - About / Methodology
- Rebuild homepage using the provided mockup as design direction.
- Keep homepage simple and report-like.
- Move raw tables/search/filtering to Signals.

Exit criteria:

- The homepage clearly answers "what is changing in the labor market?"
- The app no longer reads as a candidate-profile job recommender.
- The design feels close to the provided MarketLens mockup.
- No Supabase or n8n changes yet.

Implementation notes:

- `app/page.tsx` now renders the Market Briefing homepage.
- `lib/marketLenses.ts` defines the app-level market lens system.
- `lib/marketInsights.ts` derives briefing copy, roles to watch, skills moving up, losing-differentiation-alone signals, and industry readouts from existing Supabase-backed job signals.
- Navigation now uses the MVP tabs: Market Briefing, Signals, Emerging Roles, Rising Skills & Tools, Industries, Companies, and About / Methodology.
- The old candidate-era homepage UI components were removed from `components/`.
- Secondary MVP pages currently exist as clean scaffolds for Phase 6.

### Phase 5 - App-Level Market Lens Model

Goal: define lenses and derive first-pass insights from existing data.

Scope:

- Add market lens types and definitions in app code.
- Map existing job families/tags/titles into lens scopes.
- Derive first-pass sections from existing data:
  - roles to watch
  - skills moving up
  - tools moving up
  - less differentiating alone
  - industry/company readouts
- Use deterministic aggregation before adding generated summaries.

Exit criteria:

- Selecting a lens changes the briefing and visible market signals.
- Existing Supabase data powers the first version.
- No schema changes required yet.

### Phase 6 - MVP Pages

Goal: build the MVP information architecture beyond the homepage.

Pages:

- Signals
- Emerging Roles
- Rising Skills & Tools
- Industries
- Companies
- About / Methodology

Exit criteria:

- Homepage stays simple.
- Detail/exploration moves to secondary pages.
- Every insight page can link back to evidence from postings.

### Phase 7 - Enrichment Contract And Schema Proposal

Goal: define the durable labor-market enrichment model before touching production data.

Scope:

- Create a documented JSON schema for the new OpenAI extraction output.
- Create Supabase migration proposals for additive fields/tables.
- Decide whether to store enriched fields on `job_signals` or in a related `labor_market_signals` table.
- Add indexes for likely query paths.
- Plan grant/RLS tightening.

Exit criteria:

- Migration SQL is reviewable.
- Existing SignalPulse-compatible tables remain intact.
- No destructive schema changes.

### Phase 8 - n8n / OpenAI Pipeline Reframe

Goal: point ingestion at labor-market intelligence instead of sales intent.

Scope:

- Backup workflow exports.
- Replace old OpenAI prompt with labor-market intelligence prompt.
- Broaden SerpApi search queries across role families.
- Fix unsafe company-name SQL interpolation.
- Write new extracted fields to additive schema.
- Add basic error visibility.

Exit criteria:

- New workflow can run manually.
- New records include role/skill/tool/company-type intelligence.
- Old data remains usable.

### Phase 9 - Aggregation And Weekly Briefings

Goal: turn individual job postings into weekly intelligence.

Scope:

- Aggregate by lens, role cluster, skill, tool, company, and industry.
- Generate weekly executive briefing summaries.
- Track rising/table-stakes/less-differentiating-alone patterns.
- Store or cache weekly briefing snapshots.

Exit criteria:

- Market Briefing is based on aggregated signals, not one-off examples.
- Weekly readouts can be compared over time.

### Phase 10 - Demo Polish And Portfolio Story

Goal: make the product demo crisp for recruiters and portfolio viewers.

Scope:

- Polish the MarketLens visual identity.
- Update README around labor-market intelligence.
- Update methodology page.
- Prepare demo script:
  - ingestion pipeline
  - OpenAI extraction
  - Supabase model
  - market lens aggregation
  - evidence-backed insights

Exit criteria:

- The product reads as a finished intelligence MVP.
- The engineering story is easy to explain.
- The demo is not dependent on the old SignalPulse or candidate-profile framing.

---

## 9. Immediate Next Step

Review Phase 4 visually in the browser, then start Phase 5.

Phase 5 should:

1. Tighten market lens definitions.
2. Improve deterministic aggregation logic.
3. Make the selected lens affect the detail pages.
4. Keep raw evidence and filters on the Signals page, not the homepage.
5. Continue avoiding Supabase and n8n changes until the app-level model feels right.

---

## 10. Validation State

Known validation after Phase 4:

- `npm install`: completed.
- `npm audit`: 0 vulnerabilities.
- `tsc --noEmit --incremental false`: passes.
- `npm run lint`: passes.
- `npm run build`: passes.
- Local app has been running at `http://localhost:3004`.
- `http://localhost:3004/` returns `200 OK`.
- MVP tab routes return `200 OK`: `/signals`, `/emerging-roles`, `/skills-tools`, `/industries`, `/companies`, `/methodology`.
- `/api/signals?min_score=1` returns `200 OK` and existing Supabase-backed job signal data.

Run after each implementation phase:

```powershell
npm run lint
npm run build
```

Then smoke test:

```powershell
Invoke-WebRequest -Uri 'http://localhost:3004' -UseBasicParsing -TimeoutSec 15
```

---

## 11. Working Rules For Codex

- Work in `C:\Users\chase\Documents\career-radar` unless explicitly told otherwise.
- Do not modify `C:\Users\chase\Documents\signalpulse`.
- Keep Supabase changes additive until the old app is retired.
- Prefer migrations over manual schema edits.
- Do not commit secrets or runtime artifacts.
- Keep homepage simple, clear, and report-like.
- Separate facts extracted from postings from inferred market interpretation.
- Keep evidence accessible through the Signals page.

---

## 12. Open Questions

- Should the visible brand remain Career Radar or become MarketLens?
- Which exact role-family lenses should ship in V1?
- Should the first Market Briefing use deterministic summaries only, or include generated copy from app-level aggregation?
- Should new enrichment fields live on `job_signals` or in a new related table?
- How broad should the next n8n query set be for the first labor-market ingestion test?
