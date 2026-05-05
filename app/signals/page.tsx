import Link from 'next/link';

export default function SignalsPage() {
  return (
    <main className="market-shell">
      <section className="secondary-page">
        <span className="eyebrow">Evidence Layer</span>
        <h1>Signals</h1>
        <p>
          The signal explorer will hold the source job postings behind each briefing: company, role title,
          extracted tools, role family, posting URL, and evidence snippets.
        </p>
        <Link href="/">Return to Market Briefing</Link>
      </section>
    </main>
  );
}
