'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MarketLensSelect from '@/components/MarketLensSelect';
import type { JobSignal } from '@/lib/types';
import { DEFAULT_MARKET_LENS_ID, getMarketLens, resolveMarketLensId, type MarketLensId } from '@/lib/marketLenses';
import { summarizeEmergingRoles } from '@/lib/marketInsights';

function readLensFromUrl(): MarketLensId {
  if (typeof window === 'undefined') return DEFAULT_MARKET_LENS_ID;
  return resolveMarketLensId(new URLSearchParams(window.location.search).get('lens'));
}

function setLensInUrl(lensId: MarketLensId) {
  const url = new URL(window.location.href);
  url.searchParams.set('lens', lensId);
  window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
}

export default function EmergingRolesPage() {
  const [lensId, setLensId] = useState<MarketLensId>(DEFAULT_MARKET_LENS_ID);
  const [signals, setSignals] = useState<JobSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedLens = useMemo(() => getMarketLens(lensId), [lensId]);
  const roles = useMemo(() => summarizeEmergingRoles(signals, 9), [signals]);

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
            <h1>Emerging Roles</h1>
            <p>
              Role titles and clusters that suggest workers are being asked to combine domain knowledge,
              modern software tools, and automation fluency in new ways.
            </p>
            <div className="briefing-update">
              <span>{selectedLens.label}</span>
              <span>{signals.length.toLocaleString()} postings scanned</span>
            </div>
          </div>
          <MarketLensSelect value={lensId} onChange={handleLensChange} />
        </section>

        <section className="role-grid">
          {loading ? (
            <article className="insight-card">Loading emerging role signals...</article>
          ) : roles.length === 0 ? (
            <article className="insight-card">No emerging role clusters found for this lens yet.</article>
          ) : (
            roles.map((role) => (
              <article key={role.role} className="insight-card">
                <div className="insight-card-header">
                  <span>{role.count} postings</span>
                  <Link href={`/signals?lens=${lensId}&search=${encodeURIComponent(role.role)}`}>Evidence</Link>
                </div>
                <h2>{role.role}</h2>
                <p>{role.whyEmerging}</p>
                <dl>
                  <div>
                    <dt>Evolved from</dt>
                    <dd>{role.evolvedFrom}</dd>
                  </div>
                  <div>
                    <dt>Common tools</dt>
                    <dd>{role.commonTools.join(', ') || 'Tool pattern still forming'}</dd>
                  </div>
                  <div>
                    <dt>Companies</dt>
                    <dd>{role.companies.join(', ') || 'Company pattern still forming'}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
