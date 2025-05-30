export interface ClarificationInfo {
  last_clarification_id?: number;
  last_clarification_status?: string;
  last_clarification_handled_by?: string;
}

export interface Parameter extends ClarificationInfo {
  info: string;
  name: string;
  count: number;
  marks: number;
  upload: string;
}

export interface Fds {
  command: string;
  last_date: string;
  award_type: string;
  parameters: Parameter[];
  cycle_period: string;
}

export interface Application {
  id: number;
  type: string;
  unit_id: number;
  date_init: string;
  fds: Fds;
  status_flag: string;
  last_approved_by_role: string;
  last_approved_at: string;
  isshortlisted: boolean;
  total_marks: number;
}

export interface CommandPanelResponse {
  statusCode: number;
  message: string;
  success: boolean;
  data: Application[];
  meta: Meta;
}
