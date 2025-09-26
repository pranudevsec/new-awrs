export interface User {
  name: string;
  username: string;
  rank: string;
  user_role: string;
  is_special_unit: boolean;
}

export interface LoginResponseData {
  token: string;
  user: User;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  success: boolean;
  data: LoginResponseData;
}

export interface LoginRequest {
  user_role: string;
  username: string;
  password: string;
}

export interface SignUpResponse {
  statusCode: number;
  message: string;
  success: boolean;
  data: LoginResponseData;
}

export interface SignUpRequest {
  rank: string;
  name: string;
  user_role: string;
  username: string;
  password: string;
}

export interface ProfileUser {
  user_id: number;
  name: string;
  username: string;
  pers_no: string;
  rank: string;
  user_role: string;
  cw2_type: string;
  is_special_unit: boolean;
  is_member?: boolean;
  is_officer?: boolean;
  officer_id?: string | number | null;
  member_username?: string;
  is_member_added?: boolean;
}

export interface ProfileUnit {
  unit_id: number;
  sos_no: string | null;
  name: string;
  adm_channel: string | null;
  tech_channel: string | null;
  bde: string | null;
  div: string;
  corps: string;
  comd: string;
  unit_type?: string | null;
  matrix_unit?: any;
  location?: string | null;
  members?: any;
  awards?: any;
  start_month?: string | null;
  start_year?: string | null;
  end_month?: string | null;
  end_year?: string | null;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: ProfileUser;
    unit: ProfileUnit;
  };
}
export interface UpdateUnitProfileRequest {
  name?: string;
  adm_channel?: string | null;
  tech_channel?: string | null;
  bde?: string | null;
  div?: string | null;
  corps?: string | null;
  comd?: string | null;
  unit_type?: string | null;
  matrix_unit?: any;
  location?: string | null;
  members?: any;
  awards?: any;
  memberUsername?: any;
  memberPassword?: any;
  start_month?: string | null;
  start_year?: string | null;
  end_month?: string | null;
  end_year?: string | null;
}

export interface UpdateUnitProfileResponse {
  statusCode: number;
  success: boolean;
  message: string;
}
