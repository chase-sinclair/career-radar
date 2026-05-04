'use client';

import { Fragment } from 'react';
import type { CandidateFitComponents } from '@/lib/types';

interface Props {
  components: CandidateFitComponents | null | undefined;
  fitScore: number;
  fitSummary: string | null | undefined;
  positioningHook: string | null | undefined;
  matchedSkills: string[];
  missingSkills: string[];
  marketScore: number | null;
}

const LABELS: Record<keyof CandidateFitComponents, string> = {
  role_alignment: 'Role Align',
  skill_overlap: 'Skill Overlap',
  growth_alignment: 'Growth',
  seniority_fit: 'Seniority',
  recency: 'Recency',
};

const ROW_ORDER: Array<keyof CandidateFitComponents> = [
  'role_alignment',
  'skill_overlap',
  'growth_alignment',
  'seniority_fit',
  'recency',
];

function dotColor(score: number, max: number): string {
  if (score === 0) return 'var(--score-low)';
  if (score === max) return 'var(--score-high)';
  return 'var(--score-mid)';
}

function DotDisplay({ score, max }: { score: number; max: number }) {
  const color = dotColor(score, max);
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, index) => (
        <span
          key={index}
          style={{
            fontSize: 9,
            color: index < score ? color : 'var(--text-muted)',
            lineHeight: 1,
          }}
        >
          {index < score ? '●' : '○'}
        </span>
      ))}
    </div>
  );
}

function SkillPills({
  values,
  tone,
  emptyLabel,
}: {
  values: string[];
  tone: 'positive' | 'neutral';
  emptyLabel: string;
}) {
  if (values.length === 0) {
    return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{emptyLabel}</span>;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {values.slice(0, 4).map((value) => (
        <span
          key={value}
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: 10,
            padding: '3px 7px',
            borderRadius: 4,
            border: `1px solid ${
              tone === 'positive' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'
            }`,
            background: tone === 'positive' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
            color: tone === 'positive' ? '#6ee7b7' : '#fcd34d',
          }}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export default function CandidateFitBreakdown({
  components,
  fitScore,
  fitSummary,
  positioningHook,
  matchedSkills,
  missingSkills,
  marketScore,
}: Props) {
  if (!components) return null;

  const totalColor =
    fitScore >= 8
      ? 'var(--score-high)'
      : fitScore >= 5
      ? 'var(--score-mid)'
      : 'var(--score-low)';

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border)',
        padding: '14px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'scoreSlideDown 150ms ease-out',
      }}
    >
      <style>{`
        @keyframes scoreSlideDown {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '100px 72px 36px 1fr',
          rowGap: 8,
          columnGap: 12,
          alignItems: 'center',
        }}
      >
        {ROW_ORDER.map((key) => {
          const component = components[key];
          return (
            <Fragment key={key}>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {LABELS[key]}
              </span>
              <DotDisplay score={component.score} max={component.max} />
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: 11,
                  color: dotColor(component.score, component.max),
                  fontWeight: 500,
                }}
              >
                {component.score}/{component.max}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                }}
              >
                {component.reason}
              </span>
            </Fragment>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Match Summary
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {fitSummary ?? 'No summary available.'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {positioningHook ?? 'No positioning guidance available.'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Matched Skills
            </span>
            <SkillPills values={matchedSkills} tone="positive" emptyLabel="No direct tool overlap yet" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Likely Gaps
            </span>
            <SkillPills values={missingSkills} tone="neutral" emptyLabel="No obvious gap from tagged tools" />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          paddingTop: 8,
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Candidate Fit</span>
        <span
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: 13,
            fontWeight: 600,
            color: totalColor,
          }}
        >
          {fitScore}/10
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Legacy Market Score</span>
        <span
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          {marketScore ?? '—'}/10
        </span>
      </div>
    </div>
  );
}
