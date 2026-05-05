import Link from 'next/link';

export default function IndustriesPage() {
  return (
    <main className="market-shell">
      <section className="secondary-page">
        <span className="eyebrow">Market Segments</span>
        <h1>Industries</h1>
        <p>
          This page will compare how startups, banks, consulting firms, top tech, healthcare, and enterprise
          employers are reshaping roles through hiring.
        </p>
        <Link href="/">Return to Market Briefing</Link>
      </section>
    </main>
  );
}
