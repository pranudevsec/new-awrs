const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");
const db = require("../db/army2-connection");

exports.getBrigades = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT brigade_id, brigade_name, brigade_code, command_id, is_active, created_at
      FROM Brigade_Master 
      WHERE is_active = true 
      ORDER BY brigade_name ASC
    `);
    
    res.status(StatusCodes.OK).send(
      ResponseHelper.success(StatusCodes.OK, "Brigades fetched successfully", result.rows)
    );
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch brigades", error.message)
    );
  }
};

exports.getCorps = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT corps_id, corps_name, corps_code, command_id, is_active, created_at
      FROM Corps_Master 
      WHERE is_active = true 
      ORDER BY corps_name ASC
    `);
    
    res.status(StatusCodes.OK).send(
      ResponseHelper.success(StatusCodes.OK, "Corps fetched successfully", result.rows)
    );
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch corps", error.message)
    );
  }
};

exports.getCommands = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT command_id, command_name, command_code, is_active, created_at
      FROM Command_Master 
      WHERE is_active = true 
      ORDER BY command_name ASC
    `);
    
    res.status(StatusCodes.OK).send(
      ResponseHelper.success(StatusCodes.OK, "Commands fetched successfully", result.rows)
    );
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch commands", error.message)
    );
  }
};

exports.getDivisions = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT division_id, division_name, division_code, command_id, is_active, created_at
      FROM Division_Master 
      WHERE is_active = true 
      ORDER BY division_name ASC
    `);
    
    res.status(StatusCodes.OK).send(
      ResponseHelper.success(StatusCodes.OK, "Divisions fetched successfully", result.rows)
    );
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch divisions", error.message)
    );
  }
};

exports.getArmsServices = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT arms_service_id, arms_service_name, arms_service_code, is_active, created_at
      FROM Arms_Service_Master 
      WHERE is_active = true 
      ORDER BY arms_service_name ASC
    `);
    
    res.status(StatusCodes.OK).send(
      ResponseHelper.success(StatusCodes.OK, "Arms Services fetched successfully", result.rows)
    );
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch arms services", error.message)
    );
  }
};

exports.getRoles = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT role_id, role_name, role_code, is_active, created_at
      FROM Role_Master 
      WHERE is_active = true 
      ORDER BY role_name ASC
    `);
    
    res.status(StatusCodes.OK).send(
      ResponseHelper.success(StatusCodes.OK, "Roles fetched successfully", result.rows)
    );
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch roles", error.message)
    );
  }
};

exports.getDeployments = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT deployment_id, deployment_name, deployment_code, is_active, created_at
      FROM Deployment_Master 
      WHERE is_active = true 
      ORDER BY deployment_name ASC
    `);
    
    res.status(StatusCodes.OK).send(
      ResponseHelper.success(StatusCodes.OK, "Deployments fetched successfully", result.rows)
    );
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch deployments", error.message)
    );
  }
};

exports.getUnits = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT unit_id, name, unit_type, sos_no, location, start_month, start_year, end_month, end_year, created_at
      FROM Unit_tab 
      ORDER BY name ASC
    `);
    
    res.status(StatusCodes.OK).send(
      ResponseHelper.success(StatusCodes.OK, "Units fetched successfully", result.rows)
    );
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch units", error.message)
    );
  }
};
