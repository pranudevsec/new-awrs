// AuthControllerNormalized.js - For normalized army-2 database
const AuthService = require("../services/AuthService.js");
const MSG = require("../utils/MSG.js");
const ResponseHelper = require("../utils/responseHelper.js");
const { StatusCodes } = require("http-status-codes");

exports.register = async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    return res.status(result.statusCode).send(result);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        ResponseHelper.error(
          StatusCodes.INTERNAL_SERVER_ERROR,
          MSG.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
  }
};

exports.login = async (req, res) => {
  try {
    const result = await AuthService.login(req.body);
    return res.status(result.statusCode).send(result);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        ResponseHelper.error(
          StatusCodes.INTERNAL_SERVER_ERROR,
          MSG.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await AuthService.getProfile(req.user);
    return res.status(result?.statusCode || StatusCodes.OK).send(result);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        ResponseHelper.error(
          StatusCodes.INTERNAL_SERVER_ERROR,
          MSG.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
  }
};

// New endpoints for normalized structure
exports.getRoles = async (req, res) => {
  try {
    const result = await AuthService.getRoles();
    return res.status(result.statusCode).send(result);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        ResponseHelper.error(
          StatusCodes.INTERNAL_SERVER_ERROR,
          MSG.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
  }
};

exports.getUsersByRole = async (req, res) => {
  try {
    const { role_name } = req.params;
    const result = await AuthService.getUsersByRole(role_name);
    return res.status(result.statusCode).send(result);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        ResponseHelper.error(
          StatusCodes.INTERNAL_SERVER_ERROR,
          MSG.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { new_role_name } = req.body;
    const result = await AuthService.updateUserRole(user_id, new_role_name);
    return res.status(result.statusCode).send(result);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        ResponseHelper.error(
          StatusCodes.INTERNAL_SERVER_ERROR,
          MSG.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
  }
};
