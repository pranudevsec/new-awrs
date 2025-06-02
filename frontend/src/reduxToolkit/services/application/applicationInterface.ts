export interface ApplicationUnit {
  id: number;
  name: string;
  description: string;
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
  clarifications_count: number;
  total_pending_clarifications: number;
  unit_name: string;
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
  status: string;
}
export interface UpdateApplicationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ApproveMarksParam {
  type: string;
  application_id: number;
  parameters: {
    name: string;
    approved_marks: string | number;
  }[];
}

export interface ApproveMarksResponse {
  success: boolean;
  message: string;
}
