export interface ApplicationUnit {
  id: number;
  name: string;
  description: string;
  fds?: any;
  type: string;
  arm_service: string;
  role: string;
  clarifications_count?: number; // Added for sidebar and list usage
}

export interface FetchApplicationUnitsResponse {
  success: boolean;
  message: string;
  data: ApplicationUnit[];
  meta: Meta;
}

export interface ApplicationDetail {
  id: number;
  type: string;
  unit_id: number;
  date_init: string;
  fds: any;
  remarks: any;
  clarifications_count: number;
  total_pending_clarifications: number;
  unit_name: string;
  is_mo_approved: boolean;
  mo_approved_at: string | null;

  is_ol_approved: boolean;
  ol_approved_at: string | null;
  is_hr_review: boolean;
  is_dv_review: boolean;
  is_mp_review: boolean;
}

export interface FetchApplicationUnitDetailResponse {
  success: boolean;
  message: string;
  data: ApplicationDetail;
}

export interface Subordinate {
  id: number;
  name: string;
  username: string;
  email?: string;
}

export interface FetchSubordinatesResponse {
  success: boolean;
  message: string;
  data: Subordinate[];
}

export interface UpdateApplicationParams {
  id?: number;
  type?: string;
  status?: string;
  iscdr?: boolean;
  is_mo_approved?: boolean;
  is_ol_approved?: boolean;
  withdrawRequested?: boolean;
  withdraw_status?: string;
  is_mo_ol_member?: boolean;
  member?: any;
  level?: string;
}
export interface UpdateApplicationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ApproveMarksParam {
  type: string;
  remark?: string;
  application_id: number;
  applicationPriorityPoints?: number;
  parameters: {
    id: string;
    approved_count: string | number;
    approved_marks: string | number;
  }[];
}

export interface ApproveMarksResponse {
  success: boolean;
  message: string;
}

export interface AddCommentParam {
  type: "citation" | "appreciation";
  application_id: number;
  parameters: {
    name: string;
    comment: string;
  }[];
}

export interface AddCommentResponse {
  success: boolean;
  message: string;
}

export interface ApproveApplicationsParams {
  type: string;
  status?: string;
  id?: string | number;
  ids?: (string | number)[];
}

export interface ApproveApplicationsResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface TokenValidationParam {
  inputPersID: string;
}

export interface TokenValidationResponse {
  vaildId: boolean;
  Remark?: string;
  Expired?: boolean;
  Status: string;
}

export interface DashboardStats {
  totalPendingApplications: number;
  approved: number;
  rejected: number;
  acceptedApplications: number;
  clarificationRaised: number;
}

export interface FetchDashboardStatsResponse {
  success: boolean;
  message: string;
  data: DashboardStats;
}
