const AppreService = require("../services/AppreciationService");
const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");

exports.createAppre = async (req, res) => {
  try {
    const result = await AppreService.createAppre(req.body,req.user);
    res.status(StatusCodes.CREATED).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.getAllAppres = async (req, res) => {
  try {
    const result = await AppreService.getAllAppres();
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.getAppreById = async (req, res) => {
  try {
    const result = await AppreService.getAppreById(req.params.id);
    if (!result.success) {
      return res.status(StatusCodes.NOT_FOUND).send(result);
    }
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.updateAppre = async (req, res) => {
  try {
    const result = await AppreService.updateAppre(req.params.id, req.body,req.user);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.deleteAppre = async (req, res) => {
  try {
    const result = await AppreService.deleteAppre(req.params.id);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};
