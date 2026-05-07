'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MarketLensSelect from '@/components/MarketLensSelect';
import type { JobFamily, JobSignal, MarketRoleFamily } from '@/lib/types';
import {
  DEFAULT_MARKET_LENS_ID,
  getMarketLens,
  resolveMarketLensId,
  type MarketLensId,
} from '@/lib/marketLenses';
import { formatBriefingDate, inferCompanySegment, normalizeRoleTitle } from '@/lib/marketInsights';

type SignalsFamily = JobFamily | MarketRoleFamily | 'All';

function readLensFromUrl(): MarketLensId {
  if (typeof window === 'undefined') return DEFAULT_MARKET_LENS_ID;
  return resolveMarketLensId(new URLSearchParams(window.location.search).get('lens'));
}

function writeLensToUrl(lensId: MarketLensId) {
  const url = new URL(window.location.href);
  url.searchParams.set('lens', lensId);
  window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
}

function matchesSearch(signal: JobSignal, search: string): boolean {
  if (!search) return true;
  const haystack = [
    signal.company_name,
    signal.job_title,
    signal.job_family ?? '',
    signal.raw_description ?? '',
    ...(signal.tech_stack ?? []),
  ].join(' ').toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function matchesSegment(signal: JobSignal, segment: string): boolean {
  if (!segment) return true;
  return inferCompanySegment(signal) === segment;
}

export default function SignalsPage() {
  const [lensId, setLensId] = useState<MarketLensId>(DEFAULT_MARKET_LENS_ID);
  const [signals, setSignals] = useState<JobSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [family, setFamily] = useState<SignalsFamily>('All');
  const [tool, setTool] = useState('All');

  const selectedLens = useMemo(() => getMarketLens(lensId), [lensId]);
  const tools = useMemo(() => {
    const values = new Set<string>();
    signals.forEach((signal) => (signal.tech_stack ?? []).forEach((tag) => values.add(tag)));
    return ['All', ...Array.from(values).sort((a, b) => a.localeCompare(b)).slice(0, 80)];
  }, [signals]);

  const families = useMemo(() => {
    const values = new Set<SignalsFamily>();
    signals.forEach((signal) => {
      if (signal.market_role_family) values.add(signal.market_role_family);
      else if (signal.job_family) values.add(signal.job_family);
    });
    return ['All', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [signals]);

  const filteredSignals = useMemo(() => (
    signals.filter((signal) => {
      const displayFamily = signal.market_role_family ?? signal.job_family ?? 'Other';
      const familyMatch = family === 'All' || displayFamily === family || signal.job_family === family;
      const toolMatch = tool === 'All' || (signal.tech_stack ?? []).includes(tool);
      return familyMatch && toolMatch && matchesSearch(signal, search) && matchesSegment(signal, segment);
    })
  ), [signals, search, segment, family, tool]);

  async function fetchSignals(activeLensId: MarketLensId) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/signals?min_score=1&lens=${activeLensId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { signals?: JobSignal[] };
      setSignals(data.signals ?? []);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      setError(message);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialLens = readLensFromUrl();
    const params = new URLSearchParams(window.location.search);
    setLensId(initialLens);
    setSearch(params.get('search') ?? '');
    setSegment(params.get('segment') ?? '');
    fetchSignals(initialLens);
  }, []);

  function handleLensChange(nextLensId: MarketLensId) {
    setLensId(nextLensId);
    writeLensToUrl(nextLensId);
    fetchSignals(nextLensId);
    setSegment('');
    setFamily('All');
    setTool('All');
  }

  return (
    <main className="market-shell">
      <div className="market-page">
        <section className="briefing-masthead evidence-masthead">
          <div>
            <h1>Signals</h1>
            <p>
              Source postings behind the market briefing. Search across titles, companies, descriptions,
              role families, and extracted tools to verify the evidence.
            </p>
            <div className="briefing-update">
              <span>{filteredSignals.length.toLocaleString()} visible signals</span>
              <span>{segment || selectedLens.label}</span>
            </div>
          </div>
          <MarketLensSelect value={lensId} onChange={handleLensChange} />
        </section>

        <section className="signals-panel" aria-label="Signal explorer">
          <div className="signals-toolbar">
            <label>
              <span>Search evidence</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSegment('');
                }}
                placeholder="Company, role, tool, phrase"
              />
            </label>
            <label>
              <span>Role family</span>
              <select value={family} onChange={(event) => setFamily(event.target.value as SignalsFamily)}>
                {families.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span>Tool / tag</span>
              <select value={tool} onChange={(event) => setTool(event.target.value)}>
                {tools.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>

          {error && (
            <div className="error-banner">
              <span>Failed to load signals: {error}</span>
              <button type="button" onClick={() => fetchSignals(lensId)}>Retry</button>
            </div>
          )}

          <div className="signals-table-wrap">
            <table className="signals-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role Signal</th>
                  <th>Family</th>
                  <th>Tools / Tags</th>
                  <th>Date</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading market evidence...</td>
                  </tr>
                ) : filteredSignals.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No signals match this evidence view.</td>
                  </tr>
                ) : (
                  filteredSignals.slice(0, 160).map((signal) => (
                    <tr key={signal.id}>
                      <td>
                        <strong>{signal.company_name}</strong>
                      </td>
                      <td>
                        <strong>{signal.job_title}</strong>
                        <span>{normalizeRoleTitle(signal.role_title_normalized ?? signal.job_title)}</span>
                      </td>
                      <td>{signal.market_role_family ?? signal.job_family ?? 'Other'}</td>
                      <td>
                        <div className="tag-list">
                          {(signal.tech_stack ?? []).slice(0, 5).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td>{formatBriefingDate(signal.created_at)}</td>
                      <td>
                        {signal.job_url ? (
                          <a href={signal.job_url} target="_blank" rel="noreferrer">Open</a>
                        ) : (
                          <span>Stored</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="signals-footnote">
            <span>Showing up to 160 rows for readability.</span>
            <Link href={`/?lens=${lensId}`}>Back to briefing</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
