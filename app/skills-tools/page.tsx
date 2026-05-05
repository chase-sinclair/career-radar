'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MarketLensSelect from '@/components/MarketLensSelect';
import type { JobSignal } from '@/lib/types';
import { DEFAULT_MARKET_LENS_ID, getMarketLens, resolveMarketLensId, type MarketLensId } from '@/lib/marketLenses';
import { getLessDifferentiatingSignals, summarizeSkillTools } from '@/lib/marketInsights';

function readLensFromUrl(): MarketLensId {
  if (typeof window === 'undefined') return DEFAULT_MARKET_LENS_ID;
  return resolveMarketLensId(new URLSearchParams(window.location.search).get('lens'));
}

function setLensInUrl(lensId: MarketLensId) {
  const url = new URL(window.location.href);
  url.searchParams.set('lens', lensId);
  window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
}

export default function SkillsToolsPage() {
  const [lensId, setLensId] = useState<MarketLensId>(DEFAULT_MARKET_LENS_ID);
  const [signals, setSignals] = useState<JobSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedLens = useMemo(() => getMarketLens(lensId), [lensId]);
  const summaries = useMemo(() => summarizeSkillTools(signals, 24), [signals]);
  const losingDifferentiation = getLessDifferentiatingSignals(selectedLens);

  async function loadSignals(nextLensId: MarketLensId) {
    setLoading(true);
    const response = await fetch(`/api/signals?min_score=1&lens=${nextLensId}`);
    const data = (await response.json()) as { signals?: JobSignal[] };
    setSignals(data.signals ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const initialLens = readLensFromUrl();
    window.setTimeout(() => {
      setLensId(initialLens);
      loadSignals(initialLens);
    }, 0);
  }, []);

  function handleLensChange(nextLensId: MarketLensId) {
    setLensId(nextLensId);
    setLensInUrl(nextLensId);
    loadSignals(nextLensId);
  }

  return (
    <main className="market-shell">
      <div className="market-page">
        <section className="briefing-masthead">
          <div>
            <h1>Rising Skills & Tools</h1>
            <p>
              What employers are asking for now, grouped into rising signals, table-stakes capabilities,
              AI-adjacent skills, and role-specific tools.
            </p>
            <div className="briefing-update">
              <span>{selectedLens.label}</span>
              <span>{signals.length.toLocaleString()} postings scanned</span>
            </div>
          </div>
          <MarketLensSelect value={lensId} onChange={handleLensChange} />
        </section>

        <section className="movement-section">
          <div className="section-heading">
            <h2>Skill Movement Briefing</h2>
            <p>
              The strongest tools are not valuable in isolation; they become more powerful when paired with
              domain knowledge, workflow design, and implementation judgment.
            </p>
          </div>
          <div className="movement-grid">
            <div>
              <h3>Rising</h3>
              <ul>{summaries.filter((item) => item.category === 'Rising').slice(0, 5).map((item) => <li key={item.name}>{item.name}</li>)}</ul>
            </div>
            <div>
              <h3>Table Stakes</h3>
              <ul>{summaries.filter((item) => item.category === 'Table stakes').slice(0, 5).map((item) => <li key={item.name}>{item.name}</li>)}</ul>
            </div>
            <div>
              <h3>Losing Differentiation Alone</h3>
              <ul>{losingDifferentiation.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="insight-table-panel">
          <table className="signals-table">
            <thead>
              <tr>
                <th>Skill / Tool</th>
                <th>Category</th>
                <th>Mentions</th>
                <th>Role Families</th>
                <th>Companies</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>Loading skill movement...</td></tr>
              ) : summaries.map((item) => (
                <tr key={item.name}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.category}</td>
                  <td>{item.count}</td>
                  <td>{item.roleFamilies.join(', ') || 'Pattern forming'}</td>
                  <td>{item.companies.join(', ') || 'Pattern forming'}</td>
                  <td><Link href={`/signals?lens=${lensId}&search=${encodeURIComponent(item.name)}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
