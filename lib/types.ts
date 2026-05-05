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
}

export interface WeeklySnapshot {
  id: string;
  company_id: string;
  week_start: string;
  signal_count: number;
  avg_intent_score: number | null;
  dominant_family: string | null;
}
