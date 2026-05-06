import type { JobSignal } from '@/lib/types';
import type { MarketLens } from '@/lib/marketLenses';
import {
  filterSignalsForLens,
  getMarketLens,
  MARKET_LENSES,
  resolveMarketLensId,
  type MarketLensId,
} from '@/lib/marketLenses';
import {
  buildMarketBriefing,
  countValues,
  getLessDifferentiatingSignals,
  isCompanyAnalysisEligible,
  getTopCompanies,
  getTopRoles,
  getTopTags,
  normalizeRoleTitle,
  summarizeCompanies,
  summarizeEmergingRoles,
  summarizeIndustrySegments,
  summarizeSkillTools,
  type CompanySignalSummary,
  type IndustrySegmentSummary,
  type RoleSummary,
  type SkillToolSummary,
} from '@/lib/marketInsights';

export interface EvidenceReference {
  id: string;
  company: string;
  title: string;
  href: string;
  createdAt: string;
}

export interface WeeklyMovement {
  label: string;
  currentCount: number;
  previousCount: number;
  delta: number;
}

export interface DateBucket {
  weekStart: string;
  count: number;
}

export interface MarketAggregation {
  lensId: MarketLensId;
  lensLabel: string;
  totalSignals: number;
  latestSignalAt: string | null;
  roleClusters: WeeklyMovement[];
  roleFamilies: WeeklyMovement[];
  skills: WeeklyMovement[];
  tools: WeeklyMovement[];
  companies: WeeklyMovement[];
  industrySegments: IndustrySegmentSummary[];
  transformationCategories: WeeklyMovement[];
  weekBuckets: DateBucket[];
}

export interface WeeklyMarketBriefing {
  lensId: MarketLensId;
  lensLabel: string;
  updatedAt: string | null;
  totalSignals: number;
  executiveSummary: string;
  keyMarketSignals: Array<{
    title: string;
    body: string;
    tone: 'primary' | 'orange' | 'violet';
    evidenceHref: string;
  }>;
  emergingRoles: RoleSummary[];
  risingSkillsTools: SkillToolSummary[];
  tableStakesSkills: SkillToolSummary[];
  losingDifferentiationAlone: string[];
  industryReadout: IndustrySegmentSummary[];
  workerTakeaway: string;
  evidenceReferences: EvidenceReference[];
  aggregation: MarketAggregation;
}

function startOfWeek(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'unknown';

  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - diff);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function splitCurrentAndPrevious(signals: JobSignal[]): { current: JobSignal[]; previous: JobSignal[] } {
  const buckets = [...new Set(signals.map((signal) => startOfWeek(signal.created_at)))]
    .filter((bucket) => bucket !== 'unknown')
    .sort((a, b) => b.localeCompare(a));

  const currentWeek = buckets[0];
  const previousWeek = buckets[1];

  if (!currentWeek) return { current: signals, previous: [] };

  return {
    current: signals.filter((signal) => startOfWeek(signal.created_at) === currentWeek),
    previous: previousWeek ? signals.filter((signal) => startOfWeek(signal.created_at) === previousWeek) : [],
  };
}

function buildMovement(currentValues: string[], previousValues: string[], limit: number): WeeklyMovement[] {
  const previousCounts = new Map(countValues(previousValues).map((item) => [item.label, item.count]));

  return countValues(currentValues)
    .map((item) => {
      const previousCount = previousCounts.get(item.label) ?? 0;
      return {
        label: item.label,
        currentCount: item.count,
        previousCount,
        delta: item.count - previousCount,
      };
    })
    .sort((a, b) => b.delta - a.delta || b.currentCount - a.currentCount || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function inferTransformationCategory(signal: JobSignal): string {
  const text = `${signal.job_title} ${(signal.tech_stack ?? []).join(' ')} ${signal.raw_description ?? ''}`.toLowerCase();
  if (/(risk|governance|compliance|audit|security|privacy|model risk)/.test(text)) return 'AI governance and risk';
  if (/(salesforce|hubspot|crm|revenue|gtm|sales|revops)/.test(text)) return 'Revenue systems automation';
  if (/(netsuite|workday|sap|oracle|finance|erp|fp&a|accounting)/.test(text)) return 'Finance systems modernization';
  if (/(data|analytics|snowflake|dbt|databricks|sql|power bi|tableau)/.test(text)) return 'Data and analytics modernization';
  if (/(openai|ai|llm|automation|workflow|agent|rag)/.test(text)) return 'AI workflow automation';
  return 'Operating model modernization';
}

function evidenceReference(signal: JobSignal): EvidenceReference {
  return {
    id: signal.id,
    company: signal.company_name,
    title: signal.job_title,
    href: `/signals?search=${encodeURIComponent(signal.company_name)}`,
    createdAt: signal.created_at,
  };
}

function evidenceHrefFor(label: string, lens: MarketLens): string {
  const params = new URLSearchParams({ lens: lens.id, search: label });
  return `/signals?${params.toString()}`;
}

export function aggregateMarketSignals(signals: JobSignal[], lens: MarketLens): MarketAggregation {
  const lensSignals = filterSignalsForLens(signals, lens);
  const scopedSignals = lensSignals.length > 0 ? lensSignals : signals;
  const { current, previous } = splitCurrentAndPrevious(scopedSignals);
  const activeCurrent = current.length > 0 ? current : scopedSignals;

  const weekCounts = countValues(scopedSignals.map((signal) => startOfWeek(signal.created_at)))
    .filter((item) => item.label !== 'unknown')
    .map((item) => ({ weekStart: item.label, count: item.count }))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  return {
    lensId: lens.id,
    lensLabel: lens.label,
    totalSignals: scopedSignals.length,
    latestSignalAt: scopedSignals.map((signal) => signal.created_at).sort((a, b) => b.localeCompare(a))[0] ?? null,
    roleClusters: buildMovement(
      activeCurrent.map((signal) => normalizeRoleTitle(signal.job_title)),
      previous.map((signal) => normalizeRoleTitle(signal.job_title)),
      10,
    ),
    roleFamilies: buildMovement(
      activeCurrent.map((signal) => signal.market_role_family ?? signal.job_family ?? 'Other'),
      previous.map((signal) => signal.market_role_family ?? signal.job_family ?? 'Other'),
      10,
    ),
    skills: buildMovement(
      activeCurrent.flatMap((signal) => signal.tech_stack ?? []),
      previous.flatMap((signal) => signal.tech_stack ?? []),
      15,
    ),
    tools: buildMovement(
      activeCurrent.flatMap((signal) => signal.tech_stack ?? []),
      previous.flatMap((signal) => signal.tech_stack ?? []),
      15,
    ),
    companies: buildMovement(
      activeCurrent.map((signal) => signal.company_name),
      previous.map((signal) => signal.company_name),
      12,
    ),
    industrySegments: summarizeIndustrySegments(scopedSignals),
    transformationCategories: buildMovement(
      activeCurrent.map(inferTransformationCategory),
      previous.map(inferTransformationCategory),
      8,
    ),
    weekBuckets: weekCounts,
  };
}

export function buildWeeklyMarketBriefing(signals: JobSignal[], lens: MarketLens): WeeklyMarketBriefing {
  const deterministic = buildMarketBriefing(signals, lens);
  const aggregation = aggregateMarketSignals(signals, lens);
  const scopedSignals = deterministic.lensSignals;
  const emergingRoles = summarizeEmergingRoles(scopedSignals, 6);
  const skillTools = summarizeSkillTools(scopedSignals, 18);
  const risingSkillsTools = skillTools
    .filter((item) => item.category === 'Rising' || item.category === 'AI-adjacent')
    .slice(0, 8);
  const tableStakesSkills = skillTools
    .filter((item) => item.category === 'Table stakes' || item.category === 'Role-specific')
    .slice(0, 8);
  const industries = summarizeIndustrySegments(scopedSignals);
  const topRoles = getTopRoles(scopedSignals, 3).map((item) => item.label);
  const topTools = getTopTags(scopedSignals, 3).map((item) => item.label);
  const companyEligibleSignals = scopedSignals.filter((signal) => isCompanyAnalysisEligible(signal));
  const topCompanies = getTopCompanies(companyEligibleSignals, 3).map((item) => item.label);
  const topCompanySummaries: CompanySignalSummary[] = summarizeCompanies(companyEligibleSignals, 3);

  const roleSignal = topRoles[0] ?? 'AI-enabled role clusters';
  const toolSignal = topTools[0] ?? 'workflow automation';
  const companySignal = topCompanies[0] ?? 'employers in this lens';
  const companyCategory = topCompanySummaries[0]?.transformationCategory ?? 'systems modernization';

  return {
    lensId: lens.id,
    lensLabel: lens.label,
    updatedAt: deterministic.updatedAt,
    totalSignals: scopedSignals.length,
    executiveSummary: deterministic.executiveSummary,
    keyMarketSignals: [
      {
        title: `${roleSignal} is the clearest role signal`,
        body: `${lens.label} postings point toward workers who can pair domain knowledge with implementation, automation, and software fluency.`,
        tone: 'primary',
        evidenceHref: evidenceHrefFor(roleSignal, lens),
      },
      {
        title: `${toolSignal} is moving through the market`,
        body: `The strongest tool and skill mentions suggest practical demand for workers who can connect systems rather than use tools in isolation.`,
        tone: 'orange',
        evidenceHref: evidenceHrefFor(toolSignal, lens),
      },
      {
        title: `${companySignal} points to ${companyCategory.toLowerCase()}`,
        body: `Company-level signals indicate where hiring language is moving from standalone tasks toward broader transformation work.`,
        tone: 'violet',
        evidenceHref: evidenceHrefFor(companySignal, lens),
      },
    ],
    emergingRoles,
    risingSkillsTools,
    tableStakesSkills,
    losingDifferentiationAlone: getLessDifferentiatingSignals(lens),
    industryReadout: industries,
    workerTakeaway: deterministic.workerMeaning,
    evidenceReferences: scopedSignals.slice(0, 8).map(evidenceReference),
    aggregation,
  };
}

export function buildAllLensAggregations(signals: JobSignal[]): MarketAggregation[] {
  return MARKET_LENSES.map((lens) => aggregateMarketSignals(signals, lens));
}

export function resolveLensFromValue(value: string | null): MarketLens {
  return getMarketLens(resolveMarketLensId(value));
}
