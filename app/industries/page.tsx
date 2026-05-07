'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CompanyTypeEmblem from '@/components/CompanyTypeEmblem';
import MarketLensSelect from '@/components/MarketLensSelect';
import type { JobSignal } from '@/lib/types';
import { DEFAULT_MARKET_LENS_ID, getMarketLens, resolveMarketLensId, type MarketLensId } from '@/lib/marketLenses';
import { summarizeIndustrySegments } from '@/lib/marketInsights';

function readLensFromUrl(): MarketLensId {
  if (typeof window === 'undefined') return DEFAULT_MARKET_LENS_ID;
  return resolveMarketLensId(new URLSearchParams(window.location.search).get('lens'));
}

function setLensInUrl(lensId: MarketLensId) {
  const url = new URL(window.location.href);
  url.searchParams.set('lens', lensId);
  window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
}

export default function IndustriesPage() {
  const [lensId, setLensId] = useState<MarketLensId>(DEFAULT_MARKET_LENS_ID);
  const [signals, setSignals] = useState<JobSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedLens = useMemo(() => getMarketLens(lensId), [lensId]);
  const segments = useMemo(() => summarizeIndustrySegments(signals), [signals]);

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
            <h1>Market Segments</h1>
            <p>
              Market segment readout of how different employers signal role change through hiring,
              from startups and banks to consulting firms and healthcare organizations.
            </p>
            <div className="briefing-update">
              <span>{selectedLens.label}</span>
              <span>{signals.length.toLocaleString()} postings scanned</span>
            </div>
          </div>
          <MarketLensSelect value={lensId} onChange={handleLensChange} />
        </section>

        <section className="industry-card-grid">
          {loading ? (
            <article className="insight-card">Loading market segment signals...</article>
          ) : segments.length === 0 ? (
            <article className="insight-card">No market segment patterns found for this job family yet.</article>
          ) : segments.map((segment) => (
            <article key={segment.segment} className="industry-card">
              <div className="insight-card-header">
                <span>{segment.count} postings</span>
                <Link href={`/signals?lens=${lensId}&segment=${encodeURIComponent(segment.segment)}`}>Evidence</Link>
              </div>
              <div className="industry-card-heading">
                <CompanyTypeEmblem type={segment.segment} className="appearance-icon" />
                <div>
                  <h2>{segment.segment}</h2>
                  <p>{segment.strongestSignal}</p>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Top roles</dt>
                  <dd>{segment.topRoles.join(', ') || 'Role pattern forming'}</dd>
                </div>
                <div>
                  <dt>Top tools</dt>
                  <dd>{segment.topTools.join(', ') || 'Tool pattern forming'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
