// parameterInterface.ts

export interface Parameter {
    id: number;
    name: string;
    value: string;
    category: string;
  }
  
  export interface ParameterResponse {
    statusCode: number;
    message: string;
    success: boolean;
    data: Parameter[]; 
  }
  