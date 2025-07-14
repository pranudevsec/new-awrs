export interface CitationParameter {
  id?: number;
  name: string;
  count: number;
  marks: number;
  upload: any;
}

export interface CitationData {
  award_type: string;
  cycle_period: string;
  last_date: string;
  parameters: CitationParameter[];
}

export interface CreateCitationRequest {
  date_init: string;
  citation_fds: CitationData;
  isDraft?: boolean;
}

export interface CreateCitationResponse {
  success: boolean;
  message: string;
  data?: any;
}
export interface UpdateCitationRequest {
  id: any;
  isShortlisted?: any;
}

export interface UpdateCitationResponse {
  success: boolean;
  message: string;
  data?: any;
}
