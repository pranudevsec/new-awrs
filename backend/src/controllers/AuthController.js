// AuthController.js
const AuthService = require("../services/AuthService.js");
// Utility modules for handling responses and status codes
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
