import type {
  CandidateFitComponents,
  CandidateProfile,
  JobFamily,
} from '@/lib/types';

type FitInput = {
  job_title: string;
  raw_description: string | null;
  tech_stack: string[];
  job_family: JobFamily | null;
  created_at: string;
  seniority_label: 'EXEC' | 'SR' | 'IC' | null;
};

type CandidateFitResult = {
  fit_score: number;
  candidate_fit_components: CandidateFitComponents;
  fit_summary: string;
  positioning_hook: string;
  matched_skills: string[];
  missing_skills: string[];
  top_role_match: string | null;
};

const ROLE_STOP_WORDS = new Set([
  'and',
  'associate',
  'builder',
  'consultant',
  'engineer',
  'manager',
  'of',
  'specialist',
  'the',
]);

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9&+.]+/)
    .filter(Boolean);
}

function includesTerm(haystack: string, term: string): boolean {
  return haystack.includes(normalize(term));
}

function matchedTerms(haystack: string, terms: string[]): string[] {
  return unique(terms.filter((term) => includesTerm(haystack, term)));
}

function matchedTags(techStack: string[], text: string, tags: string[]): string[] {
  const lowerStack = techStack.map(normalize);
  return unique(
    tags.filter((tag) => {
      const lowerTag = normalize(tag);
      return lowerStack.includes(lowerTag) || text.includes(lowerTag);
    }),
  );
}

function roleTokenHits(text: string, role: string): number {
  const tokens = tokenize(role).filter((token) => !ROLE_STOP_WORDS.has(token));
  if (tokens.length === 0) return 0;
  return tokens.filter((token) => text.includes(token)).length;
}

function findTopRoleMatch(profile: CandidateProfile, text: string): string | null {
  let bestRole: string | null = null;
  let bestScore = 0;

  for (const role of profile.preferences.target_roles) {
    const score = includesTerm(text, role) ? 100 : roleTokenHits(text, role);
    if (score > bestScore) {
      bestScore = score;
      bestRole = role;
    }
  }

  return bestScore > 0 ? bestRole : null;
}

function buildRoleAlignment(
  profile: CandidateProfile,
  text: string,
  jobFamily: JobFamily | null,
  topRoleMatch: string | null,
): CandidateFitComponents['role_alignment'] {
  const familyMatch = jobFamily
    ? profile.preferences.target_job_families.includes(jobFamily)
    : false;
  const roleKeywordMatches = matchedTerms(text, profile.preferences.role_keywords);

  if (topRoleMatch && familyMatch) {
    return {
      score: 3,
      max: 3,
      reason: `${topRoleMatch} pattern in a target job family`,
    };
  }

  if (topRoleMatch || (familyMatch && roleKeywordMatches.length >= 1)) {
    return {
      score: 2,
      max: 3,
      reason: topRoleMatch
        ? `Closest title match is ${topRoleMatch}`
        : `Target family plus relevant keywords: ${roleKeywordMatches.slice(0, 2).join(', ')}`,
    };
  }

  if (familyMatch || roleKeywordMatches.length >= 1) {
    return {
      score: 1,
      max: 3,
      reason: familyMatch
        ? 'Relevant job family even without a strong title match'
        : `Some directional role overlap: ${roleKeywordMatches[0]}`,
    };
  }

  return {
    score: 0,
    max: 3,
    reason: 'Little role overlap with this candidate target',
  };
}

function buildSkillOverlap(
  profile: CandidateProfile,
  text: string,
  techStack: string[],
): {
  component: CandidateFitComponents['skill_overlap'];
  matchedSkills: string[];
  missingSkills: string[];
} {
  const matchedSkills = matchedTags(techStack, text, profile.preferences.known_tags);
  const knownTagSet = new Set(profile.preferences.known_tags.map(normalize));
  const missingSkills = unique(
    techStack.filter((tag) => !knownTagSet.has(normalize(tag))),
  ).slice(0, 4);

  if (matchedSkills.length >= 3) {
    return {
      component: {
        score: 3,
        max: 3,
        reason: `Strong overlap with ${matchedSkills.slice(0, 3).join(', ')}`,
      },
      matchedSkills,
      missingSkills,
    };
  }

  if (matchedSkills.length === 2) {
    return {
      component: {
        score: 2,
        max: 3,
        reason: `Relevant overlap with ${matchedSkills.join(', ')}`,
      },
      matchedSkills,
      missingSkills,
    };
  }

  if (matchedSkills.length === 1) {
    return {
      component: {
        score: 1,
        max: 3,
        reason: `One clear known skill match: ${matchedSkills[0]}`,
      },
      matchedSkills,
      missingSkills,
    };
  }

  return {
    component: {
      score: 0,
      max: 3,
      reason: 'No direct overlap with current known tools',
    },
    matchedSkills,
    missingSkills,
  };
}

function buildGrowthAlignment(
  profile: CandidateProfile,
  text: string,
  techStack: string[],
): CandidateFitComponents['growth_alignment'] {
  const growthMatches = matchedTags(techStack, text, profile.preferences.growth_tags);
  const directionMatches = matchedTerms(text, profile.preferences.desired_direction);

  if (growthMatches.length >= 2 || (growthMatches.length >= 1 && directionMatches.length >= 1)) {
    return {
      score: 2,
      max: 2,
      reason: growthMatches.length >= 1
        ? `Builds toward target tools like ${growthMatches.slice(0, 2).join(', ')}`
        : `Aligned with desired direction: ${directionMatches.slice(0, 2).join(', ')}`,
    };
  }

  if (growthMatches.length === 1 || directionMatches.length >= 1) {
    return {
      score: 1,
      max: 2,
      reason: growthMatches.length === 1
        ? `Useful stretch toward ${growthMatches[0]}`
        : `Some growth alignment with ${directionMatches[0]}`,
    };
  }

  return {
    score: 0,
    max: 2,
    reason: 'Limited evidence this role grows the desired direction',
  };
}

function buildSeniorityFit(
  profile: CandidateProfile,
  seniorityLabel: 'EXEC' | 'SR' | 'IC' | null,
): CandidateFitComponents['seniority_fit'] {
  if (seniorityLabel && profile.preferences.preferred_seniority.includes(seniorityLabel)) {
    return {
      score: 1,
      max: 1,
      reason: `Seniority looks right for this profile (${seniorityLabel})`,
    };
  }

  return {
    score: 0,
    max: 1,
    reason: seniorityLabel
      ? `Seniority may be a stretch (${seniorityLabel})`
      : 'Seniority is unclear from the title',
  };
}

function buildRecency(createdAt: string): CandidateFitComponents['recency'] {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours < 168) {
    return {
      score: 1,
      max: 1,
      reason: 'Fresh listing from the last 7 days',
    };
  }

  return {
    score: 0,
    max: 1,
    reason: 'Older listing with less urgency',
  };
}

function buildSummary(
  fitScore: number,
  topRoleMatch: string | null,
  matchedSkills: string[],
  roleReason: string,
): string {
  const strength =
    fitScore >= 8 ? 'Strong fit' :
    fitScore >= 6 ? 'Promising fit' :
    'Stretch fit';

  const rolePhrase = topRoleMatch
    ? `for ${topRoleMatch}`
    : 'for this profile lens';

  if (matchedSkills.length > 0) {
    return `${strength} ${rolePhrase} because of ${matchedSkills.slice(0, 2).join(', ')} and ${roleReason.toLowerCase()}.`;
  }

  return `${strength} ${rolePhrase} because ${roleReason.toLowerCase()}.`;
}

function buildPositioningHook(
  profile: CandidateProfile,
  topRoleMatch: string | null,
  matchedSkills: string[],
  missingSkills: string[],
): string {
  const roleLead = topRoleMatch ?? profile.short_label;

  if (matchedSkills.length > 0 && missingSkills.length > 0) {
    return `Lead with ${matchedSkills.slice(0, 2).join(' and ')}, then address ${missingSkills[0]} as the key ramp-up area for ${roleLead.toLowerCase()} work.`;
  }

  if (matchedSkills.length > 0) {
    return `Position yourself around ${matchedSkills.slice(0, 2).join(' and ')} as proof you can contribute quickly in ${roleLead.toLowerCase()} work.`;
  }

  if (missingSkills.length > 0) {
    return `Frame this as an adjacency play and name ${missingSkills[0]} as the first skill you would ramp on for ${roleLead.toLowerCase()} work.`;
  }

  return `Position this as an adjacent move into ${roleLead.toLowerCase()} work with upside for the candidate's target direction.`;
}

export function computeCandidateFit(
  profile: CandidateProfile,
  signal: FitInput,
): CandidateFitResult {
  const text = normalize(
    `${signal.job_title} ${signal.raw_description ?? ''} ${signal.tech_stack.join(' ')}`,
  );
  const topRoleMatch = findTopRoleMatch(profile, text);
  const roleAlignment = buildRoleAlignment(profile, text, signal.job_family, topRoleMatch);
  const skillResult = buildSkillOverlap(profile, text, signal.tech_stack);
  const growthAlignment = buildGrowthAlignment(profile, text, signal.tech_stack);
  const seniorityFit = buildSeniorityFit(profile, signal.seniority_label);
  const recency = buildRecency(signal.created_at);

  const candidateFitComponents: CandidateFitComponents = {
    role_alignment: roleAlignment,
    skill_overlap: skillResult.component,
    growth_alignment: growthAlignment,
    seniority_fit: seniorityFit,
    recency,
  };

  const fitScore =
    roleAlignment.score +
    skillResult.component.score +
    growthAlignment.score +
    seniorityFit.score +
    recency.score;

  return {
    fit_score: fitScore,
    candidate_fit_components: candidateFitComponents,
    fit_summary: buildSummary(
      fitScore,
      topRoleMatch,
      skillResult.matchedSkills,
      roleAlignment.reason,
    ),
    positioning_hook: buildPositioningHook(
      profile,
      topRoleMatch,
      skillResult.matchedSkills,
      skillResult.missingSkills,
    ),
    matched_skills: skillResult.matchedSkills,
    missing_skills: skillResult.missingSkills,
    top_role_match: topRoleMatch,
  };
}
