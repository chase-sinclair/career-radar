'use client';

import type { CSSProperties } from 'react';
import type { CandidateProfile, CandidateProfileId } from '@/lib/types';

interface Props {
  profiles: CandidateProfile[];
  selectedProfile: CandidateProfile;
  matchedTags: string[];
  onSelect: (profileId: CandidateProfileId) => void;
}

function ProfilePills({ values }: { values: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {values.slice(0, 5).map((value) => (
        <span
          key={value}
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: 10,
            padding: '3px 7px',
            borderRadius: 4,
            border: '1px solid rgba(99,102,241,0.22)',
            background: 'rgba(99,102,241,0.1)',
            color: '#a5b4fc',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export default function CandidateProfileSelector({
  profiles,
  selectedProfile,
  matchedTags,
  onSelect,
}: Props) {
  const sectionLabel: CSSProperties = {
    color: 'var(--text-muted)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: 500,
  };

  const targetFamilies = selectedProfile.preferences.target_job_families.join(', ');
  const tagSummary = matchedTags.length > 0
    ? matchedTags.slice(0, 6).join(', ')
    : 'No matching stored tags yet';

  return (
    <section
      aria-label="Candidate profile selector"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        className="candidate-selector-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1.1fr) minmax(280px, 2fr)',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <span style={sectionLabel}>Selected Candidate</span>
          <div>
            <h1
              style={{
                margin: 0,
                color: 'var(--text-primary)',
                fontSize: 22,
                lineHeight: 1.15,
                fontWeight: 600,
              }}
            >
              {selectedProfile.name}
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                color: 'var(--text-secondary)',
                fontSize: 13,
                lineHeight: 1.45,
                maxWidth: 720,
              }}
            >
              {selectedProfile.headline}
            </p>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.45 }}>
            {selectedProfile.summary}
          </div>
        </div>

        <div
          className="profile-card-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          {profiles.map((profile) => {
            const isSelected = profile.id === selectedProfile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile.id)}
                aria-pressed={isSelected}
                style={{
                  textAlign: 'left',
                  background: isSelected ? 'rgba(99,102,241,0.14)' : 'var(--bg-elevated)',
                  border: `1px solid ${isSelected ? 'rgba(99,102,241,0.65)' : 'var(--border)'}`,
                  borderRadius: 8,
                  padding: 12,
                  cursor: 'pointer',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: isSelected ? '0 0 0 1px rgba(99,102,241,0.18)' : 'none',
                }}
              >
                <span
                  style={{
                    color: isSelected ? '#c7d2fe' : 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.25,
                  }}
                >
                  {profile.short_label}
                </span>
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    lineHeight: 1.35,
                  }}
                >
                  {profile.preferences.target_roles.slice(0, 2).join(' / ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="profile-context-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          borderTop: '1px solid var(--border)',
          paddingTop: 14,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <span style={sectionLabel}>Role Focus</span>
          <ProfilePills values={selectedProfile.preferences.target_roles} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <span style={sectionLabel}>Applied Market Lens</span>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.45 }}>
            Families: {targetFamilies}
            <br />
            Skills/tools: {tagSummary}
          </div>
        </div>
      </div>
    </section>
  );
}
