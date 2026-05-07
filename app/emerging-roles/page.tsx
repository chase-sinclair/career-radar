'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CompanyTypeEmblem from '@/components/CompanyTypeEmblem';
import MarketLensSelect from '@/components/MarketLensSelect';
import type { JobSignal } from '@/lib/types';
import { DEFAULT_MARKET_LENS_ID, getMarketLens, resolveMarketLensId, type MarketLensId } from '@/lib/marketLenses';
import { countValues, summarizeEmergingRoles, type RoleSummary } from '@/lib/marketInsights';

const ROLE_ICONS = ['AI', 'LLM', 'GOV', 'OPS', 'SYS'];

const SEGMENT_COPY: Record<string, { description: string }> = {
  Startup: {
    description: 'Builders who can ship workflows quickly.',
  },
  Bank: {
    description: 'Governance, risk, documentation, and controlled AI adoption.',
  },
  'Top Tech': {
    description: 'AI infrastructure, evaluation, reliability, and productization.',
  },
  Consulting: {
    description: 'AI transformation, enablement, and workflow redesign.',
  },
  'Enterprise SaaS': {
    description: 'Systems, customer workflows, and platform automation.',
  },
  Healthcare: {
    description: 'Care delivery, quality, and compliant workflow modernization.',
  },
  'Government Contractors': {
    description: 'Operational modernization with quality and compliance needs.',
  },
};

function readLensFromUrl(): MarketLensId {
  if (typeof window === 'undefined') return DEFAULT_MARKET_LENS_ID;
  return resolveMarketLensId(new URLSearchParams(window.location.search).get('lens'));
}

function setLensInUrl(lensId: MarketLensId) {
  const url = new URL(window.location.href);
  url.searchParams.set('lens', lensId);
  window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
}

function strongestIn(role: RoleSummary): string {
  const segments = countValues(
    role.evidence
      .map((signal) => signal.company_type)
      .filter((value): value is string => Boolean(value && value !== 'Unknown')),
  ).map((item) => item.label);

  return segments.slice(0, 2).join(', ') || role.companies.slice(0, 2).join(', ') || 'Pattern still forming';
}

function whatChanged(role: RoleSummary): string {
  const tools = role.commonTools.slice(0, 2).join(' and ') || 'automation';
  return `${role.evolvedFrom} work now includes ${tools}, workflow redesign, and stronger systems judgment.`;
}

function segmentCards(roles: RoleSummary[]) {
  const grouped = new Map<string, Set<string>>();

  roles.forEach((role) => {
    role.evidence.forEach((signal) => {
      const segment = signal.company_type;
      if (!segment || segment === 'Unknown') return;
      if (!grouped.has(segment)) grouped.set(segment, new Set());
      grouped.get(segment)?.add(role.role);
    });
  });

  return [...grouped.entries()]
    .map(([segment, roleSet]) => ({
      segment,
      roles: [...roleSet].slice(0, 3),
      ...SEGMENT_COPY[segment],
    }))
    .filter((item) => item.description)
    .sort((a, b) => b.roles.length - a.roles.length || a.segment.localeCompare(b.segment))
    .slice(0, 4);
}

export default function EmergingRolesPage() {
  const [lensId, setLensId] = useState<MarketLensId>(DEFAULT_MARKET_LENS_ID);
  const [signals, setSignals] = useState<JobSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedLens = useMemo(() => getMarketLens(lensId), [lensId]);
  const roles = useMemo(() => summarizeEmergingRoles(signals, 7), [signals]);
  const roleEvolution = useMemo(() => roles.slice(0, 5), [roles]);
  const segments = useMemo(() => segmentCards(roles), [roles]);

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

        <section className="emerging-panel roles-watch-panel">
          <div className="section-heading">
            <h2>Roles to Watch</h2>
            <p>New and rapidly changing roles showing up across AI-era job postings.</p>
          </div>

          {loading ? (
            <div className="table-empty">Loading emerging role signals...</div>
          ) : roles.length === 0 ? (
            <div className="table-empty">No emerging role clusters found for this job family yet.</div>
          ) : (
            <div className="emerging-table-wrap">
              <table className="emerging-table roles-watch-table">
                <thead>
                  <tr>
                    <th aria-label="Role marker" />
                    <th>Role</th>
                    <th>Description</th>
                    <th>Evolved from</th>
                    <th>Common tools / skills</th>
                    <th>Strongest in</th>
                    <th aria-label="Evidence" />
                  </tr>
                </thead>
                <tbody>
                  {roles.slice(0, 5).map((role, index) => (
                    <tr key={role.role}>
                      <td><span className="role-symbol" aria-hidden="true">{ROLE_ICONS[index % ROLE_ICONS.length]}</span></td>
                      <td><strong>{role.role}</strong></td>
                      <td>{role.whyEmerging}</td>
                      <td>{role.evolvedFrom}</td>
                      <td>{role.commonTools.slice(0, 5).join(', ') || 'Tool pattern still forming'}</td>
                      <td>{strongestIn(role)}</td>
                      <td>
                        <Link href={`/signals?lens=${lensId}&search=${encodeURIComponent(role.role)}`}>
                          View signals
                          <span aria-hidden="true">&gt;</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {!loading && roles.length > 0 && (
          <section className="emerging-panel role-change-panel">
            <div className="section-heading">
              <h2>How Traditional Roles Are Changing</h2>
              <p>Emerging roles often start as familiar jobs with new tools, responsibilities, and expectations added on.</p>
            </div>
            <div className="emerging-table-wrap">
              <table className="emerging-table role-change-table">
                <thead>
                  <tr>
                    <th>Traditional Role</th>
                    <th>Emerging Direction</th>
                    <th>What Changed</th>
                  </tr>
                </thead>
                <tbody>
                  {roleEvolution.map((role) => (
                    <tr key={`${role.role}-${role.evolvedFrom}`}>
                      <td><strong>{role.evolvedFrom}</strong></td>
                      <td>{role.role}</td>
                      <td>{whatChanged(role)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && lensId === 'all' && segments.length > 0 && (
          <section className="emerging-panel segment-appearance-panel">
            <div className="section-heading">
              <h2>Where These Roles Are Appearing</h2>
              <p>Role patterns vary by company type and market segment context.</p>
            </div>
            <div className="appearance-grid">
              {segments.map((segment) => (
                <article key={segment.segment} className="appearance-card">
                  <CompanyTypeEmblem type={segment.segment} className="appearance-icon" />
                  <div>
                    <h3>{segment.segment === 'Startup' ? 'Startups' : segment.segment}</h3>
                    <p>{segment.description}</p>
                  </div>
                  <div className="appearance-examples">
                    <span>Example roles</span>
                    <p>{segment.roles.join(', ')}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
