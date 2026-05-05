'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { JobSignal } from '@/lib/types';
import {
  DEFAULT_MARKET_LENS_ID,
  getMarketLens,
  resolveMarketLensId,
  type MarketLensId,
} from '@/lib/marketLenses';
import { buildMarketBriefing, formatBriefingDate } from '@/lib/marketInsights';
import MarketLensSelect from '@/components/MarketLensSelect';

function readLensFromUrl(): MarketLensId {
  if (typeof window === 'undefined') return DEFAULT_MARKET_LENS_ID;
  return resolveMarketLensId(new URLSearchParams(window.location.search).get('lens'));
}

function writeLensToUrl(lensId: MarketLensId) {
  const url = new URL(window.location.href);
  url.searchParams.set('lens', lensId);
  window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-banner">
      <span>Failed to load market signals: {message}</span>
      <button type="button" onClick={onRetry}>Retry</button>
    </div>
  );
}

function LoadingBriefing() {
  return (
    <main className="market-shell">
      <div className="market-page">
        <div className="briefing-skeleton is-title" />
        <div className="briefing-skeleton" />
        <div className="briefing-skeleton" />
        <div className="briefing-skeleton" />
      </div>
    </main>
  );
}

export default function MarketBriefingPage() {
  const [lensId, setLensId] = useState<MarketLensId>(DEFAULT_MARKET_LENS_ID);
  const [signals, setSignals] = useState<JobSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const selectedLens = useMemo(() => getMarketLens(lensId), [lensId]);
  const briefing = useMemo(() => buildMarketBriefing(signals, selectedLens), [signals, selectedLens]);

  async function fetchSignals() {
    setLoading(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/signals?min_score=1');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { signals?: JobSignal[] };
      setSignals(data.signals ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch market signals:', message);
      setFetchError(message);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const syncLens = () => setLensId(readLensFromUrl());
    syncLens();
    window.addEventListener('popstate', syncLens);
    return () => window.removeEventListener('popstate', syncLens);
  }, []);

  useEffect(() => {
    fetchSignals();
  }, []);

  function handleLensChange(nextLensId: MarketLensId) {
    setLensId(nextLensId);
    writeLensToUrl(nextLensId);
  }

  if (loading) return <LoadingBriefing />;

  return (
    <main className="market-shell">
      <div className="market-page">
        <section className="briefing-masthead">
          <div>
            <h1>Market Briefing</h1>
            <p>A weekly readout on how AI, automation, and software tools are reshaping roles, skills, and hiring demand.</p>
            <div className="briefing-update">
              <span>Updated {formatBriefingDate(briefing.updatedAt)}</span>
              <span>{briefing.lensSignals.length.toLocaleString()} postings analyzed</span>
            </div>
          </div>

          <MarketLensSelect value={lensId} onChange={handleLensChange} />
        </section>

        {fetchError && <ErrorBanner message={fetchError} onRetry={fetchSignals} />}

        <section className="executive-briefing" aria-label="Executive briefing">
          <div className="section-heading">
            <h2>Executive Briefing</h2>
          </div>
          <p>{briefing.executiveSummary}</p>

          <div className="briefing-callouts">
            <div>
              <span className="callout-dot" />
              <strong>Emerging:</strong>
              <p>{briefing.emerging.join(', ') || 'Role clusters still forming'}</p>
            </div>
            <div>
              <span className="callout-arrow">Up</span>
              <strong>Rising:</strong>
              <p>{briefing.rising.join(', ') || 'Tool demand still forming'}</p>
            </div>
            <div>
              <span className="callout-eye">Watch</span>
              <strong>Watch:</strong>
              <p>{briefing.watch.join(', ') || 'No watch signal yet'}</p>
            </div>
          </div>
        </section>

        <section className="key-signals" aria-label="Key market signals">
          <div className="section-heading">
            <h2>Key Market Signals</h2>
          </div>

          <div className="signal-layout">
            {briefing.keySignals.map((signal, index) => (
              <article
                key={signal.title}
                className={`signal-card signal-${signal.tone}${index === 0 ? ' is-large' : ''}`}
              >
                <div className="signal-icon" aria-hidden="true">
                  {index === 0 ? 'AI' : index === 1 ? 'CO' : 'SK'}
                </div>
                <div>
                  <h3>{signal.title}</h3>
                  <p>{signal.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="movement-section" aria-label="Market movement snapshot">
          <div className="section-heading">
            <h2>Market Movement Snapshot</h2>
            <p>A quick scan of roles, skills, and market shifts.</p>
          </div>

          <div className="movement-grid">
            <div>
              <h3>Roles to Watch</h3>
              <ul>
                {briefing.rolesToWatch.map((role) => <li key={role}>{role}</li>)}
              </ul>
              <Link href={`/emerging-roles?lens=${lensId}`}>View details</Link>
            </div>
            <div>
              <h3>Skills Moving Up</h3>
              <ul>
                {briefing.skillsMovingUp.map((skill) => <li key={skill}>{skill}</li>)}
              </ul>
              <Link href={`/skills-tools?lens=${lensId}`}>View details</Link>
            </div>
            <div>
              <h3>Losing Differentiation Alone</h3>
              <ul>
                {briefing.losingDifferentiation.map((skill) => <li key={skill}>{skill}</li>)}
              </ul>
              <Link href={`/skills-tools?lens=${lensId}`}>View details</Link>
            </div>
          </div>
        </section>

        <section className="bottom-readout" aria-label="Industry and worker readout">
          <article>
            <div className="section-heading">
              <h2>Industry Readout</h2>
            </div>
            <div className="industry-table">
              <div className="industry-row is-header">
                <span>Segment</span>
                <span>Strongest Signal</span>
              </div>
              {briefing.industryReadout.map((row) => (
                <div key={row.segment} className="industry-row">
                  <span>{row.segment}</span>
                  <span>{row.signal}</span>
                </div>
              ))}
            </div>
          </article>

          <article>
            <div className="section-heading">
              <h2>What This Means for Workers</h2>
            </div>
            <p>{briefing.workerMeaning}</p>
            <div className="worker-links">
              <Link href={`/industries?lens=${lensId}`}>For {selectedLens.workerPath}</Link>
              <Link href={`/signals?lens=${lensId}`}>View source signals</Link>
            </div>
          </article>
        </section>

        <section className="evidence-cta" aria-label="Evidence call to action">
          <span>Want to verify the signals?</span>
          <Link href={`/signals?lens=${lensId}`}>View Evidence</Link>
        </section>
      </div>
    </main>
  );
}
