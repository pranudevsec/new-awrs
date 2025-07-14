export interface Config {
  deadline: string;
  docu_path_base: string;
  cycle_period: string[];
  current_cycle_period: string;
}

export interface ConfigResponse {
  statusCode: number;
  message: string;
  success: boolean;
  data: Config;
}

export interface UpdateConfigRequest {
  deadline?: string;
  docu_path_base?: string;
  cycle_period?: string[];
  current_cycle_period?: string;
}
