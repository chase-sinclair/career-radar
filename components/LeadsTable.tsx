'use client';

import { Fragment, useState } from 'react';
import type { JobSignal } from '@/lib/types';
import { companyInitials, truncate } from '@/lib/utils';
import CandidateFitBreakdown from './CandidateFitBreakdown';
import IntentScoreBadge from './IntentScoreBadge';

const FAMILY_STYLES: Record<string, { bg: string; color: string }> = {
  Finance: { bg: 'rgba(14,116,144,0.12)', color: '#67e8f9' },
  Infrastructure: { bg: 'rgba(8,145,178,0.12)', color: '#22d3ee' },
  Security: { bg: 'rgba(234,88,12,0.12)', color: '#fdba74' },
  Sales: { bg: 'rgba(22,163,74,0.12)', color: '#86efac' },
  Operations: { bg: 'rgba(202,138,4,0.12)', color: '#fde047' },
  Other: { bg: 'rgba(71,85,105,0.18)', color: '#cbd5e1' },
};

type SortField = 'fit_score' | 'computed_score' | 'created_at';
type SortDir = 'asc' | 'desc';

interface Props {
  signals: JobSignal[];
  loading: boolean;
  onReset?: () => void;
  profileLabel: string;
}

function SkeletonRow() {
  return (
    <tr>
      {[70, 120, 220, 220, 150, 70, 80, 60].map((width, index) => (
        <td key={index} style={{ padding: '12px 14px' }}>
          <div
            style={{
              height: 14,
              width,
              borderRadius: 4,
              background: 'var(--bg-elevated)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

function CompanyAvatar({ name }: { name: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 6,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-dm-mono), monospace',
        fontSize: 9,
        color: 'var(--text-secondary)',
        flexShrink: 0,
      }}
    >
      {companyInitials(name)}
    </span>
  );
}

function TechChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>No tagged tools</span>;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: 10,
            color: 'var(--text-muted)',
          }}
        >
          +{tags.length - 3}
        </span>
      )}
    </div>
  );
}

function SkillGapPills({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span style={{ color: '#6ee7b7', fontSize: 11 }}>Ready now</span>;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {values.slice(0, 3).map((value) => (
        <span
          key={value}
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid rgba(245,158,11,0.25)',
            background: 'rgba(245,158,11,0.08)',
            color: '#fcd34d',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function recencyInfo(createdAt: string): { color: string; label: string } {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours < 48) return { color: '#10b981', label: 'Prime window (< 48h)' };
  if (ageHours < 168) return { color: '#f59e0b', label: 'Fresh window (3-7 days)' };
  return { color: '#475569', label: 'Older than 7 days' };
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>↕</span>;
  return <span style={{ color: 'var(--accent)', marginLeft: 4 }}>{dir === 'desc' ? '↓' : '↑'}</span>;
}

export default function LeadsTable({ signals, loading, onReset, profileLabel }: Props) {
  const [sortField, setSortField] = useState<SortField>('fit_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }

    setSortField(field);
    setSortDir('desc');
  }

  const sorted = [...signals].sort((a, b) => {
    if (sortField === 'fit_score') {
      const aValue = a.fit_score ?? 0;
      const bValue = b.fit_score ?? 0;
      return sortDir === 'desc' ? bValue - aValue : aValue - bValue;
    }

    if (sortField === 'computed_score') {
      const aValue = a.computed_score ?? a.intent_score ?? 0;
      const bValue = b.computed_score ?? b.intent_score ?? 0;
      return sortDir === 'desc' ? bValue - aValue : aValue - bValue;
    }

    return sortDir === 'desc'
      ? b.created_at.localeCompare(a.created_at)
      : a.created_at.localeCompare(b.created_at);
  });

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    fontWeight: 500,
    userSelect: 'none',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: 13,
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'top',
  };

  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
              Best-fit jobs for {profileLabel}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Ranking blends role alignment, tool overlap, growth value, seniority, and recency.
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', overflowY: 'auto', height: 'calc(100vh - 290px)', minHeight: 320 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 2 }}>
                <th
                  style={{ ...thStyle, cursor: 'pointer', width: 92 }}
                  onClick={() => toggleSort('fit_score')}
                >
                  Fit
                  <SortIcon field="fit_score" current={sortField} dir={sortDir} />
                </th>
                <th style={thStyle}>Company</th>
                <th style={{ ...thStyle, minWidth: 250 }}>Role</th>
                <th style={{ ...thStyle, minWidth: 240 }}>Why It Fits</th>
                <th style={{ ...thStyle, minWidth: 160 }}>Skill Gaps</th>
                <th
                  style={{ ...thStyle, cursor: 'pointer', width: 96 }}
                  onClick={() => toggleSort('computed_score')}
                >
                  Market
                  <SortIcon field="computed_score" current={sortField} dir={sortDir} />
                </th>
                <th
                  style={{ ...thStyle, cursor: 'pointer', width: 110 }}
                  onClick={() => toggleSort('created_at')}
                >
                  Added
                  <SortIcon field="created_at" current={sortField} dir={sortDir} />
                </th>
                <th style={{ ...thStyle, width: 78 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} />)
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 30 }}>🔎</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        No jobs match this candidate lens yet
                      </span>
                      {onReset && (
                        <button
                          onClick={onReset}
                          style={{
                            marginTop: 4,
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            color: 'var(--text-secondary)',
                            fontSize: 12,
                            padding: '6px 14px',
                            cursor: 'pointer',
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((signal, index) => {
                  const familyStyle = signal.job_family
                    ? (FAMILY_STYLES[signal.job_family] ?? FAMILY_STYLES.Other)
                    : FAMILY_STYLES.Other;
                  const isExpanded = expandedId === signal.id;
                  const recency = recencyInfo(signal.created_at);

                  return (
                    <Fragment key={signal.id}>
                      <tr
                        style={{
                          background: index % 2 === 0 ? 'transparent' : 'rgba(26,26,36,0.28)',
                          transition: 'background 100ms',
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background = 'var(--bg-elevated)';
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background =
                            isExpanded
                              ? 'var(--bg-elevated)'
                              : index % 2 === 0
                              ? 'transparent'
                              : 'rgba(26,26,36,0.28)';
                        }}
                      >
                        <td style={tdStyle}>
                          <IntentScoreBadge
                            score={signal.fit_score ?? null}
                            onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                            isExpanded={isExpanded}
                            label="Candidate fit score"
                          />
                        </td>

                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                            <CompanyAvatar name={signal.company_name} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                                {signal.company_name}
                              </span>
                              {signal.is_hot_lead && (
                                <span style={{ color: '#fcd34d', fontSize: 10 }}>
                                  Legacy market urgency flag
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.4 }}>
                                {truncate(signal.job_title, 46)}
                              </span>
                              {signal.seniority_label && (
                                <span
                                  style={{
                                    fontFamily: 'var(--font-dm-mono), monospace',
                                    fontSize: 9,
                                    padding: '2px 5px',
                                    borderRadius: 4,
                                    background: 'rgba(15,23,42,0.45)',
                                    color: '#cbd5e1',
                                    border: '1px solid rgba(148,163,184,0.18)',
                                  }}
                                >
                                  {signal.seniority_label}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {signal.job_family && (
                                <span
                                  style={{
                                    fontFamily: 'var(--font-dm-mono), monospace',
                                    fontSize: 10,
                                    padding: '3px 7px',
                                    borderRadius: 4,
                                    background: familyStyle.bg,
                                    color: familyStyle.color,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {signal.job_family}
                                </span>
                              )}
                              {signal.top_role_match && (
                                <span
                                  style={{
                                    fontFamily: 'var(--font-dm-mono), monospace',
                                    fontSize: 10,
                                    padding: '3px 7px',
                                    borderRadius: 4,
                                    border: '1px solid rgba(56,189,248,0.25)',
                                    background: 'rgba(56,189,248,0.08)',
                                    color: '#7dd3fc',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {signal.top_role_match}
                                </span>
                              )}
                            </div>

                            <TechChips tags={signal.tech_stack} />
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div className="tooltip-parent" style={{ cursor: 'default', maxWidth: 280 }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.45 }}>
                              {truncate(signal.fit_summary ?? 'No fit summary available.', 104)}
                            </span>
                            {(signal.fit_summary?.length ?? 0) > 104 && (
                              <span className="tooltip-text">{signal.fit_summary}</span>
                            )}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <SkillGapPills values={signal.missing_skills ?? []} />
                        </td>

                        <td style={tdStyle}>
                          <IntentScoreBadge
                            score={signal.computed_score ?? signal.intent_score}
                            label="Legacy market score"
                          />
                        </td>

                        <td style={{ ...tdStyle, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              title={recency.label}
                              style={{
                                display: 'inline-block',
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: recency.color,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 11 }}>
                              {signal.posted_at ?? '—'}
                            </span>
                          </div>
                        </td>

                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <a
                              href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(signal.company_name + ' recruiter')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Search recruiters on LinkedIn"
                              style={{
                                fontFamily: 'var(--font-dm-mono), monospace',
                                fontSize: 10,
                                padding: '3px 7px',
                                borderRadius: 4,
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                textDecoration: 'none',
                                flexShrink: 0,
                              }}
                            >
                              in
                            </a>
                            {signal.job_url && (
                              <a
                                href={signal.job_url}
                                target="_blank"
                                rel="noreferrer"
                                title="View job posting"
                                style={{
                                  fontFamily: 'var(--font-dm-mono), monospace',
                                  fontSize: 10,
                                  padding: '3px 7px',
                                  borderRadius: 4,
                                  border: '1px solid var(--border)',
                                  background: 'transparent',
                                  color: 'var(--text-secondary)',
                                  textDecoration: 'none',
                                  flexShrink: 0,
                                }}
                              >
                                ↗
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                            <CandidateFitBreakdown
                              components={signal.candidate_fit_components}
                              fitScore={signal.fit_score ?? 0}
                              fitSummary={signal.fit_summary}
                              positioningHook={signal.positioning_hook}
                              matchedSkills={signal.matched_skills ?? []}
                              missingSkills={signal.missing_skills ?? []}
                              marketScore={signal.computed_score ?? signal.intent_score}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && sorted.length > 0 && (
          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 11,
              fontFamily: 'var(--font-dm-mono), monospace',
            }}
          >
            {sorted.length} job match{sorted.length !== 1 ? 'es' : ''} for {profileLabel}
          </div>
        )}
      </div>
    </>
  );
}
