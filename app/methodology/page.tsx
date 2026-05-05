import Link from 'next/link';

const STEPS = [
  {
    title: 'Collect',
    body: 'n8n runs scheduled SerpApi Google Jobs searches and captures job title, company, description, URL, family, and posting metadata.',
  },
  {
    title: 'Enrich',
    body: 'The current OpenAI step extracts legacy fields such as score, reason, tech_stack, and job_family. Phase 7 defines the new labor-market enrichment contract.',
  },
  {
    title: 'Store',
    body: 'Supabase stores source postings in job_signals and tools/tags through signal_tags. The app reads through signals_with_tags.',
  },
  {
    title: 'Interpret',
    body: 'Career Radar currently uses deterministic app-level aggregation to group postings by lens, role cluster, skill/tool, company, and industry segment.',
  },
  {
    title: 'Verify',
    body: 'Insights should link back to Signals so users can inspect the job postings behind each market readout.',
  },
];

const LIMITATIONS = [
  'Current insights are deterministic and approximate until the new enrichment schema is implemented.',
  'Company segment classification is inferred from names and posting text, not from a dedicated enrichment provider.',
  'Losing differentiation alone is an inference, not a direct claim from any single job posting.',
  'The inherited workflow still uses the old SignalPulse prompt until the pipeline is reframed.',
];

export default function MethodologyPage() {
  return (
    <main className="market-shell">
      <div className="market-page">
        <section className="briefing-masthead">
          <div>
            <h1>About / Methodology</h1>
            <p>
              Career Radar turns job postings into labor-market intelligence by separating source facts
              from interpretation. The product is designed so every insight can eventually be traced back
              to evidence.
            </p>
          </div>
        </section>

        <section className="movement-section">
          <div className="section-heading">
            <h2>Pipeline</h2>
            <p>How a job posting becomes a market signal.</p>
          </div>
          <div className="methodology-steps">
            {STEPS.map((step, index) => (
              <div key={step.title}>
                <strong>{index + 1}. {step.title}</strong>
                <span>{step.body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bottom-readout">
          <article>
            <div className="section-heading">
              <h2>Extracted Facts</h2>
            </div>
            <p>
              Company, title, description, source URL, posting date, job family, and extracted tags/tools
              are treated as source evidence from the pipeline.
            </p>
          </article>
          <article>
            <div className="section-heading">
              <h2>Inferred Interpretation</h2>
            </div>
            <p>
              Emerging roles, role evolution, industry readouts, and losing-differentiation-alone signals
              are app-level interpretations that should link back to source postings.
            </p>
          </article>
        </section>

        <section className="movement-section">
          <div className="section-heading">
            <h2>Current Limitations</h2>
          </div>
          <ul className="plain-list">
            {LIMITATIONS.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <Link href="/signals">Inspect the current evidence layer</Link>
        </section>
      </div>
    </main>
  );
}
