export interface CreateClarificationPayload {
  type: string;
  application_id: number;
  parameter_name: string;
  reviewer_comment: string;
}

export interface ClarificationData {
  clarification_id: number;
  type: string;
  application_id: number;
  parameter_name: string;
  reviewer_comment: string;
  clarification_status: string;
  created_at: string;
}

export interface CreateClarificationResponse {
  success: boolean;
  message: string;
  data: ClarificationData;
}

export interface GetClarificationListResponse {
  success: boolean;
  message: string;
  data: ClarificationData[];
  meta: Meta;
}

export interface UpdateClarificationPayload {
  id: number;
  clarification?: string;
  clarification_status?: string;
  clarification_doc?: File;
}

export interface UpdateClarificationResponse {
  success: boolean;
  message: string;
  data: any;
}
