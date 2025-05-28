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
  