import type { JobFamily, JobSignal } from '@/lib/types';

export type MarketLensId =
  | 'all'
  | 'finance'
  | 'sales-gtm'
  | 'operations'
  | 'marketing'
  | 'product'
  | 'hr-people'
  | 'risk-compliance'
  | 'data-analytics'
  | 'software-ai'
  | 'consulting-strategy';

export interface MarketLens {
  id: MarketLensId;
  label: string;
  description: string;
  families: JobFamily[];
  titleKeywords: string[];
  tagKeywords: string[];
  workerPath: string;
}

export const MARKET_LENSES: MarketLens[] = [
  {
    id: 'all',
    label: 'All Markets',
    description: 'Cross-functional view of role, skill, tool, and hiring shifts.',
    families: [],
    titleKeywords: [],
    tagKeywords: [],
    workerPath: 'all workers',
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Finance, FP&A, ERP, accounting operations, and planning systems.',
    families: ['Finance'],
    titleKeywords: ['finance', 'fp&a', 'accounting', 'controller', 'erp', 'revenue operations', 'strategic finance'],
    tagKeywords: ['netsuite', 'workday', 'sap', 'oracle', 'power bi', 'tableau', 'excel', 'coupa', 'blackline'],
    workerPath: 'finance workers',
  },
  {
    id: 'sales-gtm',
    label: 'Sales & GTM',
    description: 'Sales, revenue operations, CRM systems, and GTM automation.',
    families: ['Sales'],
    titleKeywords: ['sales', 'gtm', 'revenue', 'revops', 'crm', 'account executive', 'business development'],
    tagKeywords: ['salesforce', 'hubspot', 'clay', 'apollo', 'gong', 'outreach', 'marketo', 'looker'],
    workerPath: 'sales and GTM workers',
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Business operations, workflows, process design, and internal systems.',
    families: ['Operations'],
    titleKeywords: ['operations', 'workflow', 'process', 'program manager', 'business systems', 'internal tools'],
    tagKeywords: ['workday', 'rippling', 'zapier', 'n8n', 'workato', 'airtable', 'servicenow'],
    workerPath: 'operations workers',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Marketing operations, growth, lifecycle, analytics, and content workflows.',
    families: ['Sales', 'Operations'],
    titleKeywords: ['marketing', 'growth', 'demand generation', 'campaign', 'lifecycle', 'content'],
    tagKeywords: ['hubspot', 'marketo', 'salesforce', 'looker', 'tableau', 'zapier', 'clay'],
    workerPath: 'marketing workers',
  },
  {
    id: 'product',
    label: 'Product',
    description: 'Product management, AI product operations, analytics, and platform roles.',
    families: ['Infrastructure', 'Operations'],
    titleKeywords: ['product manager', 'product operations', 'platform', 'ai product', 'product analyst'],
    tagKeywords: ['openai', 'analytics', 'python', 'sql', 'tableau', 'looker', 'jira'],
    workerPath: 'product workers',
  },
  {
    id: 'hr-people',
    label: 'HR & People Ops',
    description: 'People operations, HR systems, workforce tools, and employee workflows.',
    families: ['Operations'],
    titleKeywords: ['hr', 'people operations', 'talent', 'workforce', 'recruiting', 'human resources'],
    tagKeywords: ['workday', 'rippling', 'greenhouse', 'lever', 'bamboohr', 'ashby'],
    workerPath: 'HR and people ops workers',
  },
  {
    id: 'risk-compliance',
    label: 'Risk & Compliance',
    description: 'Governance, audit, model risk, compliance, and responsible AI roles.',
    families: ['Security', 'Finance'],
    titleKeywords: ['risk', 'compliance', 'governance', 'audit', 'model risk', 'security', 'privacy'],
    tagKeywords: ['governance', 'risk', 'compliance', 'crowdstrike', 'okta', 'soc', 'gdpr', 'python'],
    workerPath: 'risk and compliance workers',
  },
  {
    id: 'data-analytics',
    label: 'Data & Analytics',
    description: 'Analytics, BI, data engineering, transformation, and data systems.',
    families: ['Infrastructure', 'Finance'],
    titleKeywords: ['data', 'analytics', 'analyst', 'business intelligence', 'data engineer', 'dbt', 'snowflake'],
    tagKeywords: ['snowflake', 'databricks', 'dbt', 'sql', 'python', 'tableau', 'power bi', 'looker', 'airflow'],
    workerPath: 'data and analytics workers',
  },
  {
    id: 'software-ai',
    label: 'Software & AI',
    description: 'Software engineering, AI systems, automation, agents, and LLM product work.',
    families: ['Infrastructure', 'Security', 'Operations'],
    titleKeywords: ['software', 'engineer', 'ai', 'automation', 'llm', 'machine learning', 'platform', 'developer'],
    tagKeywords: ['openai', 'langchain', 'python', 'typescript', 'react', 'postgres', 'aws', 'azure', 'gcp'],
    workerPath: 'software and AI workers',
  },
  {
    id: 'consulting-strategy',
    label: 'Consulting & Strategy',
    description: 'Transformation consulting, implementation, strategy, and change management.',
    families: ['Finance', 'Operations', 'Sales'],
    titleKeywords: ['consultant', 'consulting', 'strategy', 'transformation', 'implementation', 'change management'],
    tagKeywords: ['netsuite', 'salesforce', 'workday', 'sap', 'oracle', 'servicenow', 'hubspot'],
    workerPath: 'consulting and strategy workers',
  },
];

export const DEFAULT_MARKET_LENS_ID: MarketLensId = 'all';

export function resolveMarketLensId(value: string | null): MarketLensId {
  return MARKET_LENSES.some((lens) => lens.id === value)
    ? (value as MarketLensId)
    : DEFAULT_MARKET_LENS_ID;
}

export function getMarketLens(id: MarketLensId): MarketLens {
  return MARKET_LENSES.find((lens) => lens.id === id) ?? MARKET_LENSES[0];
}

export function signalMatchesLens(signal: JobSignal, lens: MarketLens): boolean {
  if (lens.id === 'all') return true;

  const title = (signal.role_title_normalized ?? signal.job_title).toLowerCase();
  const description = signal.raw_description?.toLowerCase() ?? '';
  const tags = (signal.tech_stack ?? []).map((tag) => tag.toLowerCase());
  const familyMatch = signal.job_family ? lens.families.includes(signal.job_family) : false;
  const marketFamily = signal.market_role_family?.toLowerCase() ?? '';
  const marketFamilyMatch = lens.label.toLowerCase() === marketFamily;
  const titleMatch = lens.titleKeywords.some((keyword) =>
    title.includes(keyword) || description.includes(keyword),
  );
  const tagMatch = lens.tagKeywords.some((keyword) =>
    tags.some((tag) => tag.includes(keyword)),
  );

  return familyMatch || marketFamilyMatch || titleMatch || tagMatch;
}

export function filterSignalsForLens(signals: JobSignal[], lens: MarketLens): JobSignal[] {
  return signals.filter((signal) => signalMatchesLens(signal, lens));
}
