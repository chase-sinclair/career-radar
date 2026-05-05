import type { JobSignal } from '@/lib/types';
import type { MarketLens } from '@/lib/marketLenses';
import { filterSignalsForLens } from '@/lib/marketLenses';

export interface MarketSignalCard {
  title: string;
  body: string;
  tone: 'primary' | 'orange' | 'violet';
}

export interface IndustryReadout {
  segment: string;
  signal: string;
}

export interface CountItem {
  label: string;
  count: number;
}

export interface CompanySignalSummary {
  company: string;
  count: number;
  topRole: string;
  topTools: string[];
  latestSignal: string | null;
}

export interface MarketBriefing {
  lensSignals: JobSignal[];
  updatedAt: string | null;
  executiveSummary: string;
  emerging: string[];
  rising: string[];
  watch: string[];
  keySignals: MarketSignalCard[];
  rolesToWatch: string[];
  skillsMovingUp: string[];
  losingDifferentiation: string[];
  industryReadout: IndustryReadout[];
  workerMeaning: string;
}

const ROLE_STOP_WORDS = [
  'senior',
  'sr.',
  'sr',
  'lead',
  'principal',
  'manager',
  'director',
  'associate',
  'specialist',
  'consultant',
  'analyst',
  'remote',
  'hybrid',
];

const LESS_DIFFERENTIATING_BY_LENS: Record<string, string[]> = {
  all: ['Prompt engineering alone', 'Excel-only analysis', 'Generic dashboarding', 'Manual CRM administration'],
  finance: ['Excel-only analysis', 'Manual reconciliations', 'ERP exposure without automation', 'Static reporting'],
  'sales-gtm': ['Manual CRM administration', 'Generic prospecting', 'Pipeline reporting alone', 'Basic email sequencing'],
  operations: ['Manual process coordination', 'Spreadsheet trackers', 'Tool administration alone', 'Unintegrated workflows'],
  marketing: ['AI content prompting alone', 'Campaign execution without analytics', 'Basic email automation', 'Generic dashboarding'],
  product: ['Roadmaps without AI fluency', 'Basic user-story writing', 'Prompting without evaluation', 'Feature shipping without instrumentation'],
  'hr-people': ['Manual HR coordination', 'ATS administration alone', 'Spreadsheet workforce planning', 'Policy work without systems fluency'],
  'risk-compliance': ['Manual checklist compliance', 'Policy review without AI governance', 'Basic audit support', 'Risk reporting without data fluency'],
  'data-analytics': ['Dashboarding alone', 'Generic SQL reporting', 'Excel-only analysis', 'Ad hoc analysis without automation'],
  'software-ai': ['Prompt engineering alone', 'Generic Python', 'Prototype-only AI work', 'Framework familiarity without production patterns'],
  'consulting-strategy': ['Slide strategy without implementation', 'Tool selection without workflow design', 'Generic transformation language', 'Manual implementation tracking'],
};

function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeRoleTitle(title: string): string {
  const cleaned = title
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[|,/-].*$/g, ' ')
    .replace(/\b(remote|hybrid|onsite|full.?time|contract)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned
    .split(' ')
    .filter((word) => !ROLE_STOP_WORDS.includes(word.toLowerCase()));

  return titleCase(words.slice(0, 4).join(' ') || cleaned);
}

export function countValues(values: string[]): CountItem[] {
  const counts = values.reduce<Record<string, number>>((acc, rawValue) => {
    const value = rawValue.trim();
    if (!value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getTopRoles(signals: JobSignal[], limit = 5): CountItem[] {
  return countValues(signals.map((signal) => normalizeRoleTitle(signal.job_title)))
    .filter((item) => item.label.length > 3)
    .slice(0, limit);
}

export function getTopTags(signals: JobSignal[], limit = 8): CountItem[] {
  return countValues(signals.flatMap((signal) => signal.tech_stack ?? []))
    .slice(0, limit);
}

export function getTopCompanies(signals: JobSignal[], limit = 5): CountItem[] {
  return countValues(signals.map((signal) => signal.company_name))
    .slice(0, limit);
}

export function summarizeCompanies(signals: JobSignal[], limit = 10): CompanySignalSummary[] {
  const grouped = signals.reduce<Record<string, JobSignal[]>>((acc, signal) => {
    acc[signal.company_name] = [...(acc[signal.company_name] ?? []), signal];
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([company, rows]) => ({
      company,
      count: rows.length,
      topRole: getTopRoles(rows, 1)[0]?.label ?? 'Role cluster forming',
      topTools: getTopTags(rows, 4).map((item) => item.label),
      latestSignal: rows.map((row) => row.created_at).sort((a, b) => b.localeCompare(a))[0] ?? null,
    }))
    .sort((a, b) => b.count - a.count || a.company.localeCompare(b.company))
    .slice(0, limit);
}

function inferIndustryReadout(signals: JobSignal[]): IndustryReadout[] {
  const tags = getTopTags(signals).map((item) => item.label).join(', ') || 'workflow and systems fluency';

  return [
    { segment: 'Startups', signal: `Builders who can connect tools and move quickly (${tags.split(', ')[0] ?? 'automation'})` },
    { segment: 'Banks', signal: 'Governance, risk control, data modernization, and systems reliability' },
    { segment: 'Top Tech', signal: 'AI infrastructure, evaluation, platform reliability, and productization' },
  ];
}

function inferKeySignals(lens: MarketLens, roles: string[], skills: string[], companies: string[]): MarketSignalCard[] {
  const firstRole = roles[0] ?? 'AI-enabled workflow roles';
  const secondRole = roles[1] ?? 'systems-oriented operators';
  const firstSkill = skills[0] ?? 'workflow automation';
  const secondSkill = skills[1] ?? 'AI fluency';
  const company = companies[0] ?? 'larger employers';

  return [
    {
      title: `${firstRole} roles are gaining traction`,
      body: `${lens.label} postings increasingly reward workers who can connect tools, systems, data, and operating workflows.`,
      tone: 'primary',
    },
    {
      title: `${company} is signaling role change`,
      body: `Hiring patterns point toward ${firstSkill} and stronger systems fluency, not isolated task execution.`,
      tone: 'orange',
    },
    {
      title: `${secondRole} now includes broader tool fluency`,
      body: `${secondSkill} is showing up as part of a larger bundle of workflow, judgment, and implementation skills.`,
      tone: 'violet',
    },
  ];
}

export function buildMarketBriefing(signals: JobSignal[], lens: MarketLens): MarketBriefing {
  const lensSignals = filterSignalsForLens(signals, lens);
  const scopedSignals = lensSignals.length > 0 ? lensSignals : signals;
  const roles = getTopRoles(scopedSignals).map((item) => item.label);
  const skills = getTopTags(scopedSignals).map((item) => item.label);
  const companies = getTopCompanies(scopedSignals).map((item) => item.label);
  const lessDifferentiating = LESS_DIFFERENTIATING_BY_LENS[lens.id] ?? LESS_DIFFERENTIATING_BY_LENS.all;
  const updatedAt = scopedSignals
    .map((signal) => signal.created_at)
    .sort((a, b) => b.localeCompare(a))[0] ?? null;

  const executiveSummary =
    `${lens.label} signals show demand moving toward workers who can combine domain knowledge with tools, systems, and automation. ` +
    `${roles[0] ?? 'Emerging role clusters'} and ${roles[1] ?? 'systems-oriented roles'} are appearing as practical examples, while ` +
    `${skills[0] ?? 'workflow automation'} and ${skills[1] ?? 'AI fluency'} are becoming part of the expected toolkit.`;

  return {
    lensSignals: scopedSignals,
    updatedAt,
    executiveSummary,
    emerging: roles.slice(0, 2),
    rising: skills.slice(0, 3),
    watch: lessDifferentiating.slice(0, 1),
    keySignals: inferKeySignals(lens, roles, skills, companies),
    rolesToWatch: roles.slice(0, 4),
    skillsMovingUp: skills.slice(0, 5),
    losingDifferentiation: lessDifferentiating.slice(0, 4),
    industryReadout: inferIndustryReadout(scopedSignals),
    workerMeaning:
      `${lens.label} workers should treat AI as a role-expansion signal. The strongest pattern is not replacement; it is the market rewarding people who pair field knowledge with modern tools, automation, and systems judgment.`,
  };
}

export function formatBriefingDate(value: string | null): string {
  if (!value) return 'No recent signal';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
