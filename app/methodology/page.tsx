import Link from 'next/link';

export default function MethodologyPage() {
  return (
    <main className="market-shell">
      <section className="secondary-page">
        <span className="eyebrow">About / Methodology</span>
        <h1>How Career Radar Works</h1>
        <p>
          Career Radar collects live job postings, enriches them with OpenAI, stores structured labor-market
          signals in Supabase, and turns those signals into role, skill, tool, company, and industry insights.
        </p>
        <div className="methodology-steps">
          <div>
            <strong>1. Collect</strong>
            <span>SerpApi and n8n gather job postings on a schedule.</span>
          </div>
          <div>
            <strong>2. Enrich</strong>
            <span>OpenAI extracts structured signals from titles and descriptions.</span>
          </div>
          <div>
            <strong>3. Interpret</strong>
            <span>The app separates extracted facts from inferred market interpretation.</span>
          </div>
          <div>
            <strong>4. Verify</strong>
            <span>Every insight should link back to source postings in the Signals page.</span>
          </div>
        </div>
        <Link href="/">Return to Market Briefing</Link>
      </section>
    </main>
  );
}
