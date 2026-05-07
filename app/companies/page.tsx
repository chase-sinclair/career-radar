'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MarketLensSelect from '@/components/MarketLensSelect';
import type { JobSignal } from '@/lib/types';
import { DEFAULT_MARKET_LENS_ID, getMarketLens, resolveMarketLensId, type MarketLensId } from '@/lib/marketLenses';
import { formatBriefingDate, summarizeCompanies } from '@/lib/marketInsights';

function readLensFromUrl(): MarketLensId {
  if (typeof window === 'undefined') return DEFAULT_MARKET_LENS_ID;
  return resolveMarketLensId(new URLSearchParams(window.location.search).get('lens'));
}

function setLensInUrl(lensId: MarketLensId) {
  const url = new URL(window.location.href);
  url.searchParams.set('lens', lensId);
  window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
}

export default function CompaniesPage() {
  const [lensId, setLensId] = useState<MarketLensId>(DEFAULT_MARKET_LENS_ID);
  const [signals, setSignals] = useState<JobSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedLens = useMemo(() => getMarketLens(lensId), [lensId]);
  const companies = useMemo(() => summarizeCompanies(signals, 18), [signals]);

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
            <h1>Companies</h1>
            <p>
              Company-level hiring signals: where employers appear to be modernizing systems,
              reshaping roles, and asking workers for new combinations of tools and skills.
            </p>
            <div className="briefing-update">
              <span>{selectedLens.label}</span>
              <span>{signals.length.toLocaleString()} postings scanned</span>
            </div>
          </div>
          <MarketLensSelect value={lensId} onChange={handleLensChange} />
        </section>

        <section className="company-signal-list">
          {loading ? (
            <article className="company-signal-row">Loading company signals...</article>
          ) : companies.length === 0 ? (
            <article className="company-signal-row">No company patterns found for this job family yet.</article>
          ) : (
            <>
              <div className="company-signal-row company-signal-header">
                <span>Company</span>
                <span>Strongest Signal</span>
                <span>Top Tools / Tags</span>
                <span>Evidence</span>
              </div>
              {companies.map((company) => (
                <article key={company.company} className="company-signal-row">
                  <div>
                    <span>{company.count} postings / latest {formatBriefingDate(company.latestSignal)}</span>
                    <h2>{company.company}</h2>
                  </div>
                  <div>
                    <strong>{company.transformationCategory}</strong>
                    <p>{company.topRole}</p>
                  </div>
                  <div className="tag-list">
                    {company.topTools.map((tool) => <span key={tool}>{tool}</span>)}
                  </div>
                  <Link href={`/signals?lens=${lensId}&search=${encodeURIComponent(company.company)}`}>Evidence</Link>
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
