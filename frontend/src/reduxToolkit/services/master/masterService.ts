import Axios from "../../helper/axios";

export interface MasterItem {
  id: number;
  name: string;
  code?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface BrigadeItem extends MasterItem {
  brigade_id: number;
  brigade_name: string;
  brigade_code: string;
  command_id?: number;
}

export interface CorpsItem extends MasterItem {
  corps_id: number;
  corps_name: string;
  corps_code: string;
  command_id?: number;
}

export interface CommandItem extends MasterItem {
  command_id: number;
  command_name: string;
  command_code: string;
}

export interface DivisionItem extends MasterItem {
  division_id: number;
  division_name: string;
  division_code: string;
  command_id?: number;
}

export interface ArmsServiceItem extends MasterItem {
  arms_service_id: number;
  arms_service_name: string;
  arms_service_code: string;
}

export interface RoleItem extends MasterItem {
  role_id: number;
  role_name: string;
  role_code: string;
}

export interface DeploymentItem extends MasterItem {
  deployment_id: number;
  deployment_name: string;
  deployment_code: string;
}

export interface UnitItem extends MasterItem {
  unit_id: number;
  name: string;
  unit_type: string;
  sos_no: string;
  location: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
}

// Master API calls
export const getBrigades = async (): Promise<BrigadeItem[]> => {
  const response = await Axios.get("/api/master/brigades");
  return response.data.data;
};

export const getCorps = async (): Promise<CorpsItem[]> => {
  const response = await Axios.get("/api/master/corps");
  return response.data.data;
};

export const getCommands = async (): Promise<CommandItem[]> => {
  const response = await Axios.get("/api/master/commands");
  return response.data.data;
};

export const getDivisions = async (): Promise<DivisionItem[]> => {
  const response = await Axios.get("/api/master/divisions");
  return response.data.data;
};

export const getArmsServices = async (): Promise<ArmsServiceItem[]> => {
  const response = await Axios.get("/api/master/arms-services");
  return response.data.data;
};

export const getRoles = async (): Promise<RoleItem[]> => {
  const response = await Axios.get("/api/master/roles");
  return response.data.data;
};

export const getDeployments = async (): Promise<DeploymentItem[]> => {
  const response = await Axios.get("/api/master/deployments");
  return response.data.data;
};

export const getUnits = async (): Promise<UnitItem[]> => {
  const response = await Axios.get("/api/master/units");
  return response.data.data;
};

// Convert master data to options format
export const convertToOptions = (items: MasterItem[], nameField: string, valueField: string) => {
  return items.map(item => ({
    value: item[valueField as keyof MasterItem] as string,
    label: item[nameField as keyof MasterItem] as string
  }));
};

// Specific converters for each master type
export const convertBrigadesToOptions = (brigades: BrigadeItem[]) => {
  return brigades.map(brigade => ({
    value: brigade.brigade_name,
    label: brigade.brigade_name
  }));
};

export const convertCorpsToOptions = (corps: CorpsItem[]) => {
  return corps.map(corps => ({
    value: corps.corps_name,
    label: corps.corps_name
  }));
};

export const convertCommandsToOptions = (commands: CommandItem[]) => {
  return commands.map(command => ({
    value: command.command_name,
    label: command.command_name
  }));
};

export const convertDivisionsToOptions = (divisions: DivisionItem[]) => {
  return divisions.map(division => ({
    value: division.division_name,
    label: division.division_name
  }));
};

export const convertArmsServicesToOptions = (armsServices: ArmsServiceItem[]) => {
  return armsServices.map(armsService => ({
    value: armsService.arms_service_name,
    label: armsService.arms_service_name
  }));
};

export const convertRolesToOptions = (roles: RoleItem[]) => {
  return roles.map(role => ({
    value: role.role_name,
    label: role.role_name
  }));
};

export const convertDeploymentsToOptions = (deployments: DeploymentItem[]) => {
  return deployments.map(deployment => ({
    value: deployment.deployment_name,
    label: deployment.deployment_name
  }));
};

export const convertUnitsToOptions = (units: UnitItem[]) => {
  return units.map(unit => ({
    value: unit.name,
    label: unit.name
  }));
};
