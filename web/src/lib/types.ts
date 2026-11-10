export interface TriageQuestion {
  num: number;
  level: 'Easy' | 'Moderate' | 'High' | string;
  format: string;
  text: string;
  answer: string;
  variants?: string[];
}

export interface Alert {
  id: string;
  title: string;
  short_title?: string;
  category: string;
  severity: 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  severity_id?: number;
  provider?: string;
  src_ip: string;
  dest_ip: string;
  src_port?: number;
  dest_port?: number;
  protocol?: string;
  sensor?: string;
  verdict?: string;
  expected_verdict: string;
  mitre_attack?: string[];
  timestamp: string;
  raw_log: string;
  triage_questions?: TriageQuestion[];
}

export type PipelineNodeStatus = 'healthy' | 'warning' | 'critical' | 'active' | 'idle';

export interface PipelineNode {
  id: string;
  label: string;
  role: string;
  description: string;
  input_events: number;
  output_events: number;
  drop_rate: number;
  status: PipelineNodeStatus;
  technology?: string;
  latency_ms?: number;
}

export interface TuningRule {
  id: string;
  rule_id: number;
  name: string;
  component: string;
  before_daily: number;
  after_daily: number;
  reduction_percent: number;
  description: string;
  enabled?: boolean;
}

export interface GuestSession {
  session_id: string;
  created_at: string;
  triaged_alert_ids: string[];
  custom_rule_states: Record<string, boolean>;
  last_active?: string;
}

export type AlertStatus = 'NEW' | 'INVESTIGATING' | 'CLOSED';

export interface EnrichedAlert extends Alert {
  status: AlertStatus;
  country?: string;
  userVerdict?: {
    verdict: string;
    notes?: string;
    root_cause?: string;
    timestamp: string;
  };
}

export interface WorkbenchMetrics {
  total: number;
  triaged: number;
  pending: number;
  critical: number;
}

export interface VerdictSubmission {
  alert_id: string;
  verdict: 'True Positive' | 'False Positive' | 'Inconclusive' | string;
  notes: string;
  root_cause?: string;
  timestamp: string;
  session_id?: string;
}

export interface PlatformMetrics {
  totalAlertsIngestedDaily: number;
  tunedAlertsDaily: number;
  noiseSuppressionPercent: number;
  activeSensors: number;
  confirmedTruePositives: number;
  averagePipelineLatencyMs: number;
}
