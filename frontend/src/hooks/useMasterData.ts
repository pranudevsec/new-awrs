import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../reduxToolkit/hooks';
import {
  fetchBrigades,
  fetchCorps,
  fetchCommands,
  fetchDivisions,
  fetchArmsServices,
  fetchRoles,
  fetchDeployments,
  fetchUnits,
  fetchAllMasterData
} from '../reduxToolkit/slices/master/masterSlice';
import {
  convertBrigadesToOptions,
  convertCorpsToOptions,
  convertCommandsToOptions,
  convertDivisionsToOptions,
  convertArmsServicesToOptions,
  convertRolesToOptions,
  convertDeploymentsToOptions,
  convertUnitsToOptions
} from '../reduxToolkit/services/master/masterService';

export const useMasterData = () => {
  const dispatch = useAppDispatch();
  const masterState = useAppSelector((state) => state.master);

  // Fetch all master data on mount
  useEffect(() => {
    dispatch(fetchAllMasterData());
  }, [dispatch]);

  // Convert master data to options format
  const brigadeOptions = convertBrigadesToOptions(masterState.brigades);
  const corpsOptions = convertCorpsToOptions(masterState.corps);
  const commandOptions = convertCommandsToOptions(masterState.commands);
  const divisionOptions = convertDivisionsToOptions(masterState.divisions);
  const armsServiceOptions = convertArmsServicesToOptions(masterState.armsServices);
  const roleOptions = convertRolesToOptions(masterState.roles);
  const deploymentOptions = convertDeploymentsToOptions(masterState.deployments);
  const unitOptions = convertUnitsToOptions(masterState.units);

  return {
    // Raw data
    brigades: masterState.brigades,
    corps: masterState.corps,
    commands: masterState.commands,
    divisions: masterState.divisions,
    armsServices: masterState.armsServices,
    roles: masterState.roles,
    deployments: masterState.deployments,
    units: masterState.units,
    
    // Options format
    brigadeOptions,
    corpsOptions,
    commandOptions,
    divisionOptions,
    armsServiceOptions,
    roleOptions,
    deploymentOptions,
    unitOptions,
    
    // State
    loading: masterState.loading,
    error: masterState.error
  };
};

// Individual hooks for specific master data
export const useBrigades = () => {
  const dispatch = useAppDispatch();
  const brigades = useAppSelector((state) => state.master.brigades);
  const loading = useAppSelector((state) => state.master.loading);
  const error = useAppSelector((state) => state.master.error);

  useEffect(() => {
    if (brigades.length === 0) {
      dispatch(fetchBrigades());
    }
  }, [dispatch, brigades.length]);

  return {
    brigades,
    brigadeOptions: convertBrigadesToOptions(brigades),
    loading,
    error
  };
};

export const useCorps = () => {
  const dispatch = useAppDispatch();
  const corps = useAppSelector((state) => state.master.corps);
  const loading = useAppSelector((state) => state.master.loading);
  const error = useAppSelector((state) => state.master.error);

  useEffect(() => {
    if (corps.length === 0) {
      dispatch(fetchCorps());
    }
  }, [dispatch, corps.length]);

  return {
    corps,
    corpsOptions: convertCorpsToOptions(corps),
    loading,
    error
  };
};

export const useCommands = () => {
  const dispatch = useAppDispatch();
  const commands = useAppSelector((state) => state.master.commands);
  const loading = useAppSelector((state) => state.master.loading);
  const error = useAppSelector((state) => state.master.error);

  useEffect(() => {
    if (commands.length === 0) {
      dispatch(fetchCommands());
    }
  }, [dispatch, commands.length]);

  return {
    commands,
    commandOptions: convertCommandsToOptions(commands),
    loading,
    error
  };
};

export const useDivisions = () => {
  const dispatch = useAppDispatch();
  const divisions = useAppSelector((state) => state.master.divisions);
  const loading = useAppSelector((state) => state.master.loading);
  const error = useAppSelector((state) => state.master.error);

  useEffect(() => {
    if (divisions.length === 0) {
      dispatch(fetchDivisions());
    }
  }, [dispatch, divisions.length]);

  return {
    divisions,
    divisionOptions: convertDivisionsToOptions(divisions),
    loading,
    error
  };
};

export const useArmsServices = () => {
  const dispatch = useAppDispatch();
  const armsServices = useAppSelector((state) => state.master.armsServices);
  const loading = useAppSelector((state) => state.master.loading);
  const error = useAppSelector((state) => state.master.error);

  useEffect(() => {
    if (armsServices.length === 0) {
      dispatch(fetchArmsServices());
    }
  }, [dispatch, armsServices.length]);

  return {
    armsServices,
    armsServiceOptions: convertArmsServicesToOptions(armsServices),
    loading,
    error
  };
};

export const useRoles = () => {
  const dispatch = useAppDispatch();
  const roles = useAppSelector((state) => state.master.roles);
  const loading = useAppSelector((state) => state.master.loading);
  const error = useAppSelector((state) => state.master.error);

  useEffect(() => {
    if (roles.length === 0) {
      dispatch(fetchRoles());
    }
  }, [dispatch, roles.length]);

  return {
    roles,
    roleOptions: convertRolesToOptions(roles),
    loading,
    error
  };
};

export const useDeployments = () => {
  const dispatch = useAppDispatch();
  const deployments = useAppSelector((state) => state.master.deployments);
  const loading = useAppSelector((state) => state.master.loading);
  const error = useAppSelector((state) => state.master.error);

  useEffect(() => {
    if (deployments.length === 0) {
      dispatch(fetchDeployments());
    }
  }, [dispatch, deployments.length]);

  return {
    deployments,
    deploymentOptions: convertDeploymentsToOptions(deployments),
    loading,
    error
  };
};

export const useUnits = () => {
  const dispatch = useAppDispatch();
  const units = useAppSelector((state) => state.master.units);
  const loading = useAppSelector((state) => state.master.loading);
  const error = useAppSelector((state) => state.master.error);

  useEffect(() => {
    if (units.length === 0) {
      dispatch(fetchUnits());
    }
  }, [dispatch, units.length]);

  return {
    units,
    unitOptions: convertUnitsToOptions(units),
    loading,
    error
  };
};
