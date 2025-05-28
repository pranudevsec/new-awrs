// appreciationInterface.ts

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
  }
  
  export interface CreateAppreciationResponse {
    success: boolean;
    message: string;
    data?: any; 
  }
  