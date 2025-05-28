export interface CitationParameter {
    name: string;
    count: number;
    marks: number;
    upload: string; 
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
  }
  
  export interface CreateCitationResponse {
    success: boolean;
    message: string;
    data?: any;
  }
  