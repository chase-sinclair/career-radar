export interface ScoreComponent {
  score: number;
  max: number;
  reason: string;
}

export interface ScoreComponents {
  implementation_signal: ScoreComponent;
  tool_specificity: ScoreComponent;
  buying_window: ScoreComponent;
  recency: ScoreComponent;
}

export type JobFamily =
  | 'Finance'
  | 'Infrastructure'
  | 'Security'
  | 'Sales'
  | 'Operations'
  | 'Other';

export type SeniorityLabel = 'EXEC' | 'SR' | 'IC';

export type MarketRoleFamily =
  | 'Finance'
  | 'Sales & GTM'
  | 'Operations'
  | 'Marketing'
  | 'Product'
  | 'HR & People Ops'
  | 'Risk & Compliance'
  | 'Data & Analytics'
  | 'Software & AI'
  | 'Consulting & Strategy'
  | 'Other';

export type MarketSeniority =
  | 'Executive'
  | 'Senior'
  | 'Manager'
  | 'IC'
  | 'Early Career'
  | 'Unknown';

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employee_range: string | null;
  created_at: string;
}

export interface JobSignal {
  id: string;
  external_job_id: string;
  company_id: string | null;
  company_name: string;
  job_title: string;
  raw_description: string | null;
  job_url: string | null;
  job_family: JobFamily | null;
  tech_stack: string[];
  intent_score: number | null;
  score_components?: ScoreComponents | null;
  computed_score?: number;
  seniority_label?: SeniorityLabel | null;
  sales_hook: string | null;
  is_hot_lead: boolean;
  posted_at: string | null;
  created_at: string;
  market_role_family?: MarketRoleFamily | null;
  market_seniority?: MarketSeniority | null;
  role_title_normalized?: string | null;
  role_cluster?: string | null;
  company_type?: string | null;
  market_insight?: string | null;
  evidence_snippets?: string[];
  prompt_version?: string | null;
  validation_status?: string | null;
}

export interface WeeklySnapshot {
  id: string;
  company_id: string;
  week_start: string;
  signal_count: number;
  avg_intent_score: number | null;
  dominant_family: string | null;
}
