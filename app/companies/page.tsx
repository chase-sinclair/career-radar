import Link from 'next/link';

export default function CompaniesPage() {
  return (
    <main className="market-shell">
      <section className="secondary-page">
        <span className="eyebrow">Hiring Signals</span>
        <h1>Companies</h1>
        <p>
          This page will show what companies reveal through hiring: role clusters, top tools, transformation
          categories, hiring velocity, and evidence from postings.
        </p>
        <Link href="/">Return to Market Briefing</Link>
      </section>
    </main>
  );
}
