# CODEX.md - Career Radar

> Project memory and execution plan for the SignalPulse pivot.
> This file is the Codex-facing source of truth for the new project, similar in spirit to `CLAUDE.md` in the original SignalPulse repo.

---

## 0. Current Project Status

Career Radar is a clean project fork created from `C:\Users\chase\Documents\signalpulse`.

The original SignalPulse project should remain untouched unless explicitly requested. All pivot work should happen in:

```text
C:\Users\chase\Documents\career-radar
```

Initial setup completed:

- Copied useful app source from SignalPulse into `career-radar`.
- Excluded runtime/generated/local files: `.env.local`, `.next/`, `.vercel/`, `.claude/`, `database*.sqlite`, SQLite WAL/SHM files, and `tsconfig.tsbuildinfo`.
- Added a clean `.gitignore`.
- Initialized `career-radar` as a separate git repository.
- Installed dependencies with `npm install`.
- Verified TypeScript with `tsc --noEmit --incremental false`.
- Confirmed `npm audit` reports `0 vulnerabilities`.
- Fixed inherited lint issue in `app/methodology/page.tsx`.
- Added Phase 2 candidate profile model and selector.

Important current decision:

- Keep the existing Supabase project.
- Likely keep the existing Vercel setup long-term, but avoid overwriting the current production deployment until Career Radar is ready.
- Treat current database changes as additive and backward-compatible so SignalPulse can keep running during the pivot.

---

## 1. Product Pivot

SignalPulse started as a B2B sales-intelligence dashboard that identifies software buying windows from job postings.

Career Radar pivots the same infrastructure toward job-market intelligence for candidates.

Core product thesis:

> The system monitors the broader job market, then adapts the findings to a selected candidate profile so the dashboard shows what matters for that candidate.

The product should answer:

- Which jobs are best fit for this candidate?
- Which companies are hiring in patterns relevant to this candidate?
- Which skills are in demand for the candidate's target roles?
- Which skill gaps are blocking stronger matches?
- How should the candidate position themselves?
- What portfolio project should the candidate build next?

This should feel less like a raw job board and more like a personalized career strategy engine.

---

## 2. Target Experience

The first polished version should support two candidate-personalization modes.

### Demo Profile Mode

Ship three preloaded candidate profiles so the product can be demoed instantly.

Initial profiles:

1. Chase / AI Workflow Builder
   - Target roles: AI Automation Engineer, Workflow Automation Engineer, Full-Stack AI Builder, GTM Engineer, Internal Tools Engineer.
   - Strengths: Next.js, Supabase, n8n, OpenAI workflows, productized automation, dashboards, full-stack implementation.
   - Desired direction: AI systems, automation, applied data workflows, internal tools, product engineering.

2. Finance Transformation Candidate
   - Target roles: FP&A Analyst, Finance Systems Analyst, ERP Implementation Analyst, Revenue/Finance Operations Analyst, Strategic Finance Associate.
   - Strengths: Excel/Sheets modeling, ERP exposure, accounting workflows, reporting, process improvement, finance automation.
   - Desired direction: finance transformation, FP&A systems, ERP modernization, operational finance, analytics-backed planning.

3. Sales / GTM Candidate
   - Target roles: Account Executive, SDR/BDR, Sales Operations Associate, GTM Specialist, Revenue Growth Associate.
   - Strengths: prospecting, CRM usage, pipeline management, sales messaging, customer discovery, revenue process discipline.
   - Desired direction: high-growth sales roles, GTM systems fluency, AI-assisted prospecting, revenue operations awareness.

Selecting a profile should change:

- ranked jobs
- KPI cards
- skill demand map
- company radar
- role clusters
- fit explanations
- skill gaps
- suggested positioning
- suggested portfolio projects

### Onboarding Mode

Later, add a guided questionnaire that creates a candidate profile from user answers.

Likely questions:

- What roles are you targeting?
- What skills/tools do you already have?
- What skills/tools do you want to use more?
- What industries or company types interest you?
- What do you optimize for: compensation, remote work, learning, stability, prestige, startup pace, speed to offer?
- What seniority level are you targeting?
- Are you looking for full-time, freelance, startup, enterprise, or agency work?

---

## 3. Infrastructure Strategy

Use the existing infrastructure instead of rebuilding from scratch.

Existing pieces to reuse:

- Next.js 16 app structure
- Supabase project `qolusthqrhcontdvfvyx`
- Existing job/company/signal/tag data
- n8n scheduled ingestion pattern
- SerpApi Google Jobs collection
- OpenAI enrichment workflow
- Vercel deployment path

Important rule:

> Because the Supabase project is shared with the original SignalPulse app, database changes must be additive and backward-compatible until SignalPulse is officially retired.

Do not drop or rename existing tables/columns yet.

Current Supabase base tables:

- `companies`
- `job_signals`
- `signal_tags`
- `weekly_snapshots`

Current useful view/function:

- `signals_with_tags`
- `refresh_weekly_snapshots()`

Planned additive tables/views:

- `candidate_profiles`
- `candidate_profile_skills`
- `candidate_preferences`
- `candidate_job_matches` or profile-specific match view
- `career_insights` or generated recommendations table

Potential added fields for future ingestion:

- `role_category`
- `seniority`
- `remote_status`
- `employment_type`
- `salary_min`
- `salary_max`
- `required_skills`
- `nice_to_have_skills`

---

## 4. Data Model Direction

Existing `job_signals` should become the source job-posting/event table.

Existing `signal_tags` should be interpreted more broadly as skills/tools, not just B2B buying-signal tags.

New candidate-specific logic should not overwrite old `intent_score`.

Instead, introduce candidate-specific concepts:

- `fit_score`: how well this role matches the selected candidate
- `growth_score`: how useful this role is for the candidate's desired direction
- `gap_score`: how many missing skills separate the candidate from a strong match
- `explanation`: why this job is ranked this way for this candidate
- `positioning_hook`: how the candidate should frame themselves for the role

Candidate matching should combine:

- target role alignment
- skill overlap
- desired skill growth
- company/industry preference
- seniority fit
- remote/location preference if data is available
- recency
- market velocity signals

---

## 5. UI Direction

Replace the inherited sales-leads framing with candidate-centered decision surfaces.

Recommended primary navigation:

- Briefing
- Best-Fit Jobs
- Skill Radar
- Company Radar
- Strategy
- Methodology

Recommended first dashboard sections:

1. Candidate Selector
   - Three demo profiles at first.
   - Later: onboarding-generated profile.

2. Career Briefing
   - A short synthesized summary for the selected profile.
   - Example: "You have 18 high-fit opportunities this week. AI workflow automation demand is rising. Your top gap is Salesforce experience."

3. Best-Fit Jobs
   - Ranked cards or dense list.
   - Show match score, missing skills, why it fits, why it may not, and suggested application angle.

4. Skill Demand Map
   - Skills/tools appearing in matching jobs.
   - Separate current strengths, recurring gaps, and emerging skills.

5. Company Radar
   - Companies repeatedly hiring in relevant role clusters.
   - Highlight acceleration and repeated demand.

6. Positioning Strategy
   - Candidate-specific recommendations.
   - Example: "Position as AI Workflow Engineer, not generic full-stack developer."

7. Portfolio Project Recommendations
   - Suggestions generated from market gaps.
   - Example: "Build a finance workflow assistant that reconciles ERP exports, highlights planning variances, and drafts stakeholder updates."

---

## 6. n8n Workflow Status

Workflow exports are now present in the project:

- `n8n/signalpulse_daily.json`
- `n8n/signalpulse_snapshots.json`

Verified facts:

- Daily workflow name: `SignalPulse AI`
- Daily workflow active: true
- Daily workflow node count: 14
- Snapshot workflow name: `signalpulse_snapshots`
- Snapshot workflow active: true
- Snapshot workflow node count: 2
- Daily schedule: 6 AM
- Snapshot schedule: cron `0 23 * * 0`, Sunday 23:00
- OpenAI model: `gpt-4o-mini`
- Exported workflow contains credential references only, not raw secrets.

Credential references seen:

- `OpenAI account`
- `Postgres account`
- `SerpAPI account`
- `Supabase account`

Important workflow finding:

- The company insert SQL currently interpolates `company_name` directly:

```sql
INSERT INTO companies (name)
VALUES ('{{ $json.company_name }}')
```

This can break on apostrophes and should be converted to parameter binding before relying on the workflow long-term.

Another important finding:

- Current workflow query list differs from older docs. The export uses `dbt data transformation engineer`, not `Databricks data engineer`.

---

## 7. Supabase Status

`supabase/schema.sql` exists and was created from a Supabase CLI dump.

Schema dump is a snapshot, not canonical migration history.

`supabase/migrations/` is currently empty.

Known schema concerns to fix later:

1. Missing secondary indexes
   - The app filters/orders by `created_at`, `intent_score`, `is_hot_lead`, `job_family`, `company_name`, and joins through `signal_tags.signal_id`.
   - Add indexes before scaling.

2. Overbroad grants
   - `anon` and `authenticated` have broad `GRANT ALL` privileges in the dump.
   - RLS currently allows public SELECT only, but grants should be tightened for a public read-only product.

3. Public RPC concern
   - `refresh_weekly_snapshots()` is granted to `anon`.
   - Since this is a write path through RPC, restrict it to service-role/admin usage.

4. Extension dependency
   - UUID defaults use `extensions.uuid_generate_v4()`.
   - Fresh restores need `uuid-ossp` available in the `extensions` schema.

Product decision:

- Dashboard should remain public read-only.

---

## 8. Repo Hygiene Plan

Original SignalPulse should remain untouched for now.

In Career Radar, avoid committing:

- `.env.local`
- `.next/`
- `.vercel/`
- `.claude/`
- `database*.sqlite`
- `*.sqlite-shm`
- `*.sqlite-wal`
- `tsconfig.tsbuildinfo`

Original SignalPulse has tracked runtime artifacts that can be cleaned later, but only after explicit approval.

User confirmed:

- `database3.sqlite` and related SQLite runtime files are disposable now that workflow JSON exports exist.

---

## 9. Implementation Phases

This roadmap is ordered deliberately. The early phases prove the product pivot with the least production risk. Supabase and n8n changes should stay additive until the new experience is clearly better than the original SignalPulse dashboard.

### Phase 0 - Baseline And Safety

Goal: make `career-radar` safe to work in independently, with a clean memory trail and no accidental impact on SignalPulse.

Scope:

- Keep all work in `C:\Users\chase\Documents\career-radar`.
- Keep `C:\Users\chase\Documents\signalpulse` untouched unless explicitly requested.
- Confirm no secrets, SQLite runtime files, `.vercel/`, `.claude/`, `.next/`, or `.env.local` are committed.
- Preserve current Supabase and Vercel production behavior until cutover is explicitly approved.
- Keep `CODEX.md` updated after meaningful product or architecture decisions.

Exit criteria:

- New repo exists and is separate from SignalPulse.
- `CODEX.md` exists and captures the pivot plan.
- TypeScript passes.
- Known copied issues are documented.

Status: Complete.

### Phase 1 - Product Reframe And Local Stability

Goal: make the copied app recognizably Career Radar while keeping the existing data pipeline unchanged.

Status: Complete. App metadata, package name, global header, navigation labels, README, and several top-level page labels have been reframed for Career Radar. The inherited methodology lint issue was fixed. Data/API behavior remains unchanged.

Scope:

- Rename package/app metadata from SignalPulse to Career Radar.
- Rewrite README around the candidate-intelligence product story.
- Update visible product language, nav labels, page headings, and methodology copy.
- Fix inherited lint error in `app/methodology/page.tsx`.
- Fix inherited LeadsTable malformed Actions cell if that component remains in use.
- Decide whether to keep `CLAUDE.md` as historical context or replace it with `CODEX.md` as the active memory file.
- Create `.env.local` locally from the existing Supabase project values when ready to run the app.

Exit criteria:

- `npm run lint` passes.
- `tsc --noEmit --incremental false` passes.
- App can run locally against the current Supabase project.
- No database or n8n changes yet.

### Phase 2 - Candidate Profile Model In App Code

Goal: introduce candidate personalization without changing Supabase yet.

Status: Complete. Candidate profiles are hardcoded in app code, selectable from the dashboard, persisted through the `profile` URL query param, and translated into profile-specific family/tag/score filters against the existing API routes.

Scope:

- Add TypeScript types for candidate profiles, candidate skills, preferences, target roles, and scoring weights.
- Add three hardcoded demo profiles:
  - Chase / AI Workflow Builder
  - Finance Transformation Candidate
  - Sales / GTM Candidate
- Add a profile selector at the top-level app experience.
- Persist selected profile in URL params or local state for demo reliability.
- Make existing dashboard queries profile-aware at the client/app layer.

Exit criteria:

- User can select any of the three profiles.
- The selected profile changes visible labels, KPI counts, and ranking context.
- No Supabase schema changes required yet.

Implementation notes:

- Candidate profile types now live in `lib/types.ts`.
- Demo profile definitions and profile-to-filter helpers live in `lib/candidateProfiles.ts`.
- The selector UI lives in `components/CandidateProfileSelector.tsx`.
- `app/page.tsx` applies selected profile filters to the existing `/api/signals` query layer.
- `components/FilterSidebar.tsx` now accepts profile-specific default filters so reset actions keep the selected candidate lens.

### Phase 3 - Candidate Fit Scoring Layer

Goal: turn existing job signals into candidate-specific recommendations.

Scope:

- Build deterministic `fit_score` logic separate from old `intent_score` and `computed_score`.
- Interpret `signal_tags.tech_stack` as skills/tools for matching.
- Score jobs by:
  - target role alignment
  - current skill overlap
  - desired skill growth
  - missing skill severity
  - seniority fit
  - company/industry preference if available
  - recency
- Generate per-job explanations:
  - why this fits
  - what is missing
  - how the candidate should position themselves
- Replace the sales-leads table with candidate-centered job cards or a cleaner ranked list.

Exit criteria:

- Each demo profile produces a meaningfully different ranked job list.
- Each ranked job has a clear explanation and skill-gap callout.
- Current SignalPulse scoring remains available only as legacy/source context, not the primary UX.

### Phase 4 - Career Dashboard UX

Goal: replace the old sales dashboard with a compelling recruiter-demo experience.

Scope:

- Build the new primary layout around candidate outcomes:
  - Career Briefing
  - Best-Fit Jobs
  - Skill Radar
  - Company Radar
  - Positioning Strategy
  - Portfolio Recommendations
  - Methodology
- Add profile-specific KPI cards, such as:
  - high-fit jobs
  - strongest role cluster
  - top missing skill
  - companies accelerating
- Add skill demand sections:
  - strengths showing up in the market
  - recurring gaps
  - emerging skills to learn
- Add company radar based on profile-relevant hiring patterns.
- Keep visual design polished but quieter and more decision-oriented than the current leads table.

Exit criteria:

- A recruiter can understand the product in under 60 seconds.
- The Chase profile tells a strong personal career narrative.
- The other two profiles prove the system adapts beyond one hardcoded use case.

### Phase 5 - Additive Supabase Foundation

Goal: start persisting candidate/profile concepts without breaking the original SignalPulse data model.

Scope:

- Create migrations instead of editing `schema.sql` directly.
- Add tables only if app-code profiles are proven useful:
  - `candidate_profiles`
  - `candidate_profile_skills`
  - `candidate_preferences`
  - optional `career_insights`
  - optional `candidate_job_matches`
- Add seed data for the three demo profiles.
- Add secondary indexes for existing dashboard/query paths.
- Tighten grants for public read-only posture.
- Restrict `refresh_weekly_snapshots()` RPC access away from `anon`.

Exit criteria:

- Migrations can be reviewed before applying to the shared Supabase project.
- Existing SignalPulse tables/routes remain backward-compatible.
- Candidate profile data can be loaded from Supabase or seeded safely.

### Phase 6 - Pipeline Reframe

Goal: adjust n8n/OpenAI ingestion so future data is better suited to career intelligence.

Scope:

- Keep existing workflow exports as backups before editing.
- Fix unsafe company-name SQL interpolation with parameter binding.
- Broaden SerpApi queries toward candidate-relevant market intelligence.
- Update OpenAI prompt to extract:
  - role category
  - seniority
  - hard skills
  - tools/platforms
  - nice-to-have skills
  - remote/location clues
  - employment type where available
  - candidate-relevant learning signals
- Preserve existing `job_signals` compatibility or add new fields additively.
- Add basic error handling/observability for SerpApi, OpenAI, and Supabase failures.

Exit criteria:

- New workflow can be tested manually without corrupting existing data.
- Existing historical data remains usable.
- New records are richer for candidate-fit scoring.

### Phase 7 - Personalized Onboarding

Goal: let a user generate their own candidate profile through guided questions.

Scope:

- Build onboarding questionnaire.
- Convert answers into a candidate profile object.
- Let users compare generated profile against demo profiles.
- Optionally persist custom profiles in Supabase.
- Tailor dashboard output to the generated profile.

Exit criteria:

- A new user can answer questions and receive a tailored dashboard.
- The generated profile affects ranking, gaps, briefing, and recommendations.

### Phase 8 - Deployment And Cutover

Goal: deploy Career Radar without accidentally breaking the existing SignalPulse production experience.

Scope:

- Decide between:
  - new Vercel project using same Supabase project, or
  - existing Vercel project with controlled preview/production cutover.
- Configure env vars in the chosen Vercel project.
- Run production build and smoke test.
- Validate public read-only behavior.
- Decide whether/when Career Radar replaces `signalpulse-six.vercel.app`.

Exit criteria:

- Career Radar has a stable deployed URL.
- Supabase writes are still restricted to service/admin paths.
- Original SignalPulse deployment is either preserved or intentionally replaced.

### Phase 9 - Demo Polish And Portfolio Story

Goal: make the project tell a sharp story for recruiters.

Scope:

- Add a guided demo path using the Chase profile.
- Add a concise methodology page explaining ingestion, enrichment, scoring, and personalization.
- Add sample screenshots or a short walkthrough script if useful.
- Update README with architecture, tradeoffs, and what changed from SignalPulse.
- Prepare talking points:
  - data pipeline
  - LLM extraction
  - personalization layer
  - schema design
  - public read-only security model
  - product pivot decision

Exit criteria:

- The demo explains both the engineering system and the product value.
- The app feels like a finished career-intelligence product, not a renamed sales dashboard.

---

## 9.1 Immediate Next Phase

Next recommended work when implementation begins:

1. Phase 3: candidate fit scoring using existing Supabase data.
2. Phase 4: replace the inherited sales-leads table with candidate-centered recommendation surfaces.
3. Phase 5: only then consider additive Supabase migrations for persisted candidate concepts.

Do not start Supabase migrations or n8n workflow edits until the profile-aware UI proves the pivot.

## 10. Current Known Validation State

In `career-radar`:

- `npm install`: completed
- `npm audit`: 0 vulnerabilities
- `tsc --noEmit --incremental false`: passes
- `npm run lint`: passes
- `npm run build`: passes

To run locally, create `C:\Users\chase\Documents\career-radar\.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Then run:

```powershell
npm run dev
```

---

## 11. Working Rules For Codex

- Work in `C:\Users\chase\Documents\career-radar` unless the user explicitly says otherwise.
- Do not modify `C:\Users\chase\Documents\signalpulse` unless explicitly requested.
- Treat Supabase changes as additive until the original app is retired.
- Prefer migrations over editing schema dumps manually.
- Do not commit secrets or local runtime artifacts.
- Keep the product centered on candidate outcomes, not generic market charts.
- Build demo reliability first: three profiles should always produce a compelling walkthrough.

---

## 12. Open Questions

- Will Career Radar eventually replace the existing Vercel production deployment, or live as a second Vercel project first?
- Should candidate profiles be stored in Supabase immediately, or hardcoded for the first demo milestone?
- Which three exact candidate profiles should ship in the polished demo?
- How much of the existing historical job data is useful for the new profile-matching direction?
- Should the ingestion pipeline broaden now, or after the UI proves the pivot?



