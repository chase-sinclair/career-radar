import type {
  CandidateProfile,
  CandidateProfileId,
  DashboardFilters,
} from '@/lib/types';

export const DEFAULT_CANDIDATE_PROFILE_ID: CandidateProfileId = 'chase-ai-workflow';

export const CANDIDATE_PROFILES: CandidateProfile[] = [
  {
    id: 'chase-ai-workflow',
    name: 'Chase Sinclair',
    short_label: 'AI Workflow Builder',
    headline: 'Applied AI systems, automations, and full-stack workflow tools',
    summary:
      'Prioritizes roles where product thinking, Next.js, Supabase, n8n, OpenAI, and internal tooling come together.',
    skills: [
      { name: 'Next.js', type: 'strength' },
      { name: 'Supabase', type: 'strength' },
      { name: 'n8n', type: 'strength' },
      { name: 'OpenAI workflows', type: 'strength' },
      { name: 'Productized automation', type: 'strength' },
      { name: 'Internal tools', type: 'target' },
      { name: 'GTM systems', type: 'target' },
      { name: 'Enterprise integrations', type: 'gap' },
    ],
    preferences: {
      target_roles: [
        'AI Automation Engineer',
        'Workflow Automation Engineer',
        'Full-Stack AI Builder',
        'GTM Engineer',
        'Internal Tools Engineer',
      ],
      desired_direction: [
        'AI systems',
        'automation',
        'applied data workflows',
        'internal tools',
        'product engineering',
      ],
      target_job_families: ['Infrastructure', 'Operations', 'Sales'],
      priority_tags: [
        'openai',
        'n8n',
        'supabase',
        'next.js',
        'react',
        'typescript',
        'python',
        'postgres',
        'salesforce',
        'hubspot',
        'zapier',
        'airtable',
        'workato',
      ],
      search_keywords: ['automation', 'workflow', 'ai', 'internal tools', 'gtm'],
      role_keywords: [
        'automation',
        'workflow',
        'ai',
        'internal tools',
        'platform',
        'integrations',
        'integration',
        'systems',
        'gtm',
      ],
      known_tags: [
        'next.js',
        'react',
        'typescript',
        'supabase',
        'openai',
        'python',
        'postgres',
        'n8n',
      ],
      growth_tags: [
        'salesforce',
        'hubspot',
        'zapier',
        'airtable',
        'workato',
      ],
      preferred_seniority: ['IC', 'SR'],
    },
    scoring_weights: {
      role_alignment: 0.3,
      current_skill_overlap: 0.25,
      growth_alignment: 0.2,
      seniority_fit: 0.1,
      recency: 0.15,
    },
    default_min_intent_score: 7,
    default_hot_leads_only: false,
  },
  {
    id: 'finance-transformation',
    name: 'Finance Transformation Candidate',
    short_label: 'Finance Systems',
    headline: 'FP&A, ERP modernization, finance operations, and reporting automation',
    summary:
      'Focuses the market view on finance systems roles, transformation programs, ERP work, and analytics-backed planning.',
    skills: [
      { name: 'Excel and Sheets modeling', type: 'strength' },
      { name: 'Accounting workflows', type: 'strength' },
      { name: 'Reporting cadence', type: 'strength' },
      { name: 'ERP exposure', type: 'target' },
      { name: 'Finance automation', type: 'target' },
      { name: 'Process improvement', type: 'target' },
      { name: 'Advanced BI tooling', type: 'gap' },
    ],
    preferences: {
      target_roles: [
        'FP&A Analyst',
        'Finance Systems Analyst',
        'ERP Implementation Analyst',
        'Revenue Operations Analyst',
        'Strategic Finance Associate',
      ],
      desired_direction: [
        'finance transformation',
        'FP&A systems',
        'ERP modernization',
        'operational finance',
        'planning analytics',
      ],
      target_job_families: ['Finance', 'Operations'],
      priority_tags: [
        'netsuite',
        'sap',
        'oracle',
        'workday',
        'quickbooks',
        'sage intacct',
        'coupa',
        'concur',
        'blackline',
        'ramp',
        'brex',
        'stripe',
        'tableau',
        'power bi',
      ],
      search_keywords: ['fp&a', 'finance systems', 'erp', 'revenue operations'],
      role_keywords: [
        'fp&a',
        'finance systems',
        'erp',
        'planning',
        'accounting',
        'business systems',
        'finance',
        'analyst',
      ],
      known_tags: [
        'quickbooks',
        'stripe',
        'tableau',
        'power bi',
        'excel',
      ],
      growth_tags: [
        'netsuite',
        'sap',
        'oracle',
        'workday',
        'coupa',
        'concur',
        'blackline',
        'ramp',
        'brex',
      ],
      preferred_seniority: ['IC', 'SR'],
    },
    scoring_weights: {
      role_alignment: 0.35,
      current_skill_overlap: 0.2,
      growth_alignment: 0.2,
      seniority_fit: 0.15,
      recency: 0.1,
    },
    default_min_intent_score: 7,
    default_hot_leads_only: false,
  },
  {
    id: 'sales-gtm',
    name: 'Sales / GTM Candidate',
    short_label: 'Sales and GTM',
    headline: 'Revenue roles, CRM fluency, prospecting systems, and GTM operations',
    summary:
      'Surfaces companies hiring around sales execution, CRM systems, revenue process, and AI-assisted prospecting.',
    skills: [
      { name: 'Prospecting', type: 'strength' },
      { name: 'CRM usage', type: 'strength' },
      { name: 'Pipeline management', type: 'strength' },
      { name: 'Sales messaging', type: 'strength' },
      { name: 'Customer discovery', type: 'target' },
      { name: 'Revenue process discipline', type: 'target' },
      { name: 'GTM analytics', type: 'gap' },
    ],
    preferences: {
      target_roles: [
        'Account Executive',
        'SDR',
        'BDR',
        'Sales Operations Associate',
        'GTM Specialist',
        'Revenue Growth Associate',
      ],
      desired_direction: [
        'high-growth sales roles',
        'GTM systems fluency',
        'AI-assisted prospecting',
        'revenue operations',
      ],
      target_job_families: ['Sales', 'Operations'],
      priority_tags: [
        'salesforce',
        'hubspot',
        'marketo',
        'gong',
        'outreach',
        'salesloft',
        'apollo',
        'clay',
        'clearbit',
        'zapier',
        'looker',
      ],
      search_keywords: ['sales', 'gtm', 'revenue', 'crm', 'pipeline'],
      role_keywords: [
        'account executive',
        'sales development',
        'business development',
        'sales operations',
        'revenue operations',
        'gtm',
        'crm',
        'pipeline',
        'prospecting',
      ],
      known_tags: [
        'salesforce',
        'hubspot',
        'zapier',
      ],
      growth_tags: [
        'marketo',
        'gong',
        'outreach',
        'salesloft',
        'apollo',
        'clay',
        'clearbit',
        'looker',
      ],
      preferred_seniority: ['IC', 'SR'],
    },
    scoring_weights: {
      role_alignment: 0.35,
      current_skill_overlap: 0.25,
      growth_alignment: 0.15,
      seniority_fit: 0.1,
      recency: 0.15,
    },
    default_min_intent_score: 7,
    default_hot_leads_only: false,
  },
];

export function resolveCandidateProfileId(value: string | null): CandidateProfileId {
  return CANDIDATE_PROFILES.some((profile) => profile.id === value)
    ? (value as CandidateProfileId)
    : DEFAULT_CANDIDATE_PROFILE_ID;
}

export function getCandidateProfile(id: CandidateProfileId): CandidateProfile {
  return (
    CANDIDATE_PROFILES.find((profile) => profile.id === id) ??
    CANDIDATE_PROFILES[0]
  );
}

export function getMatchingProfileTags(
  profile: CandidateProfile,
  availableTags: string[],
): string[] {
  const availableByLower = new Map(
    availableTags.map((tag) => [tag.toLowerCase(), tag]),
  );

  return profile.preferences.priority_tags
    .map((tag) => availableByLower.get(tag.toLowerCase()))
    .filter((tag): tag is string => Boolean(tag));
}

export function buildCandidateProfileFilters(
  profile: CandidateProfile,
  availableTags: string[],
  search = '',
): DashboardFilters {
  return {
    job_families: profile.preferences.target_job_families,
    min_intent_score: profile.default_min_intent_score,
    tags: getMatchingProfileTags(profile, availableTags),
    hot_leads_only: profile.default_hot_leads_only,
    search,
  };
}
