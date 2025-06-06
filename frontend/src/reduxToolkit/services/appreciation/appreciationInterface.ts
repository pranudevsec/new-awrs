export interface AppreciationParameter {
  name: string;
  count: number;
  marks: number;
  upload: string;
}

export interface AppreciationFormData {
  award_type: string;
  cycle_period: string;
  last_date: string;
  parameters: AppreciationParameter[];
}

export interface CreateAppreciationPayload {
  date_init: string;
  appre_fds: AppreciationFormData;
  isDraft?:boolean;
}

export interface CreateAppreciationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface UpdateAppreciationRequest {
  id: number;
  appre_fds: AppreciationFormData;
  date_init?: string;
  isDraft?: boolean;
}

export interface UpdateAppreciationResponse {
  success: boolean;
  message: string;
  data?: any;
}