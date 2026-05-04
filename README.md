# Career Radar

Career Radar is a personalized job-market intelligence dashboard built from the SignalPulse data pipeline.

It monitors live job postings, enriches them with AI, stores structured hiring signals in Supabase, and turns the market into candidate-specific recommendations: best-fit jobs, skill gaps, company momentum, positioning advice, and portfolio ideas.

The first version reuses the existing SignalPulse infrastructure while reframing the product around candidates instead of sales teams.

## Product Direction

Career Radar answers a more direct question than the original project:

> Given a candidate's skills, goals, and target roles, what is the market telling them to do next?

The dashboard will eventually support:

- selectable demo candidate profiles
- profile-aware job ranking
- skill demand and gap analysis
- company hiring radar
- candidate positioning strategy
- suggested portfolio projects based on market gaps
- guided onboarding that creates a custom candidate profile

Initial demo profiles:

- Chase / AI Workflow Builder
- Finance Transformation Candidate
- Sales / GTM Candidate

## Current State

This repo is a clean project fork of the original SignalPulse app.

Completed setup:

- copied the useful Next.js, Supabase, n8n, and Docker assets
- excluded local env files, build output, SQLite runtime DBs, Vercel state, and agent settings
- initialized a separate GitHub repo
- created a separate Vercel project named `career-radar`
- added `CODEX.md` as the active project memory and roadmap
- added safe env templates

The app still contains inherited SignalPulse screens and data concepts. Phase 1 is focused on product reframe and local stability before deeper candidate-fit logic.

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
Next.js dashboard
       |
       v
Candidate-specific market intelligence
```

Main stack:

- Next.js 16 App Router
- React 19
- Supabase Postgres
- n8n
- OpenAI GPT-4o-mini
- SerpApi Google Jobs
- Recharts
- Vercel

## Supabase

Career Radar currently reuses the existing Supabase project and historical job data.

Existing source objects:

- `companies`
- `job_signals`
- `signal_tags`
- `weekly_snapshots`
- `signals_with_tags`
- `refresh_weekly_snapshots()`

Important rule:

> Database changes must be additive and backward-compatible until the original SignalPulse app is retired.

Planned future objects may include:

- `candidate_profiles`
- `candidate_profile_skills`
- `candidate_preferences`
- `candidate_job_matches`
- `career_insights`

## n8n Workflows

Workflow exports are committed in:

- `n8n/signalpulse_daily.json`
- `n8n/signalpulse_snapshots.json`

Current workflows are still the inherited SignalPulse ingestion jobs. They remain useful as the base data pipeline, but the prompt and search strategy will later be reframed around career-market intelligence.

Known workflow issue to fix later:

- the company insert SQL interpolates `company_name` directly and should be converted to parameter binding.

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The broader `.env` is for future local pipeline or n8n-style tooling. It can stay as placeholders until that work begins.

Run locally:

```powershell
npm run dev
```

Validate:

```powershell
npm run lint
npm run build
```

## Deployment

Vercel project:

- project name: `career-radar`
- project id: `prj_qkGy0EPDnsYeKKNBstVEJnMn9JK9`

Required Vercel env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The original SignalPulse deployment should remain untouched until an intentional cutover.

## Roadmap

See `CODEX.md` for the active implementation plan.

Immediate order:

1. Product reframe and local stability
2. Hardcoded candidate profile model and selector
3. Candidate fit scoring using existing Supabase data
4. Career dashboard UX
5. Additive Supabase migrations
6. Pipeline reframe
7. Personalized onboarding
8. Deployment/cutover
9. Demo polish and portfolio story
