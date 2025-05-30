const ParameterService = require("../services/ParameterService");
const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");

exports.createParameter = async (req, res) => {
  try {
    const result = await ParameterService.createParameter(req.body);
    res.status(StatusCodes.CREATED).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.getAllParameters = async (req, res) => {
    try {
      const result = await ParameterService.getAllParameters(req.query);
      res.status(StatusCodes.OK).send(result);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
      );
    }
  };
  

exports.getParameterById = async (req, res) => {
  try {
    const result = await ParameterService.getParameterById(req.params.id);
    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).send(
        ResponseHelper.error(StatusCodes.NOT_FOUND, "Parameter not found")
      );
    }
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.updateParameter = async (req, res) => {
  try {
    const result = await ParameterService.updateParameter(req.params.id, req.body);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.deleteParameter = async (req, res) => {
  try {
    const result = await ParameterService.deleteParameter(req.params.id);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};
