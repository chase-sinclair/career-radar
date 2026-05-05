import Link from 'next/link';

export default function SkillsToolsPage() {
  return (
    <main className="market-shell">
      <section className="secondary-page">
        <span className="eyebrow">Skill Demand</span>
        <h1>Rising Skills & Tools</h1>
        <p>
          This page will group skills and tools into rising, table-stakes, AI-adjacent, role-specific, and
          losing-differentiation-alone signals.
        </p>
        <Link href="/">Return to Market Briefing</Link>
      </section>
    </main>
  );
}
