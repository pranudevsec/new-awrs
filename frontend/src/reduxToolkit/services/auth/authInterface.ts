export interface User {
  name: string;
  username: string;
  rank: string;
  user_role: string;
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
