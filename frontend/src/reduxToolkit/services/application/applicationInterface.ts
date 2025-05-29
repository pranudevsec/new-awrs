// applicationInterface.ts

export interface ApplicationUnit {
    id: number;
    name: string;
    description: string;
  }
  
  export interface FetchApplicationUnitsResponse {
    success: boolean;
    message: string;
    data: ApplicationUnit[];
  }
  
  export interface ApplicationDetail {
    id: number;
    type: string;
    unit_id: number;
    date_init: string;
    fds: any;
    clarifications_count: number;
    total_pending_clarifications: number;
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
    // Add more fields as returned by your API
  }
  
  export interface FetchSubordinatesResponse {
    success: boolean;
    message: string;
    data: Subordinate[];
  }
  