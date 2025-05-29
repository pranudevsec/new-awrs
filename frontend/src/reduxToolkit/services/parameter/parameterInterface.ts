export interface Parameter {
  param_id: string;
  comd: string;
  award_type: string;
  applicability: string;
  category: string;
  name: string;
  description: string;
  negative: boolean | null;
  per_unit_mark: string;
  max_marks: string;
  proof_reqd: boolean | null;
  weightage: string;
  param_sequence: string;
  param_mark: string;
}

export interface ParameterResponse {
  statusCode: number;
  message: string;
  success: boolean;
  data: Parameter[];
}

export interface ParameterRequest {
  award_type: string;
  applicability: string;
  name: string;
  category: string;
  description: string;
  negative: boolean | null;
  per_unit_mark: string;
  max_marks: string;
  proof_reqd: boolean | null;
  weightage: string;
  param_sequence: string;
  param_mark: string;
}
