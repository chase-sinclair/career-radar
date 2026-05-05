import Link from 'next/link';

export default function EmergingRolesPage() {
  return (
    <main className="market-shell">
      <section className="secondary-page">
        <span className="eyebrow">Role Change</span>
        <h1>Emerging Roles</h1>
        <p>
          This page will track new, niche, and mutating role titles, then explain what each role evolved from,
          which tools appear with it, and why the market is asking for it now.
        </p>
        <Link href="/">Return to Market Briefing</Link>
      </section>
    </main>
  );
}
