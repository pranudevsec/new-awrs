const UnitService = require("../services/UnitService");
const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");

exports.createUnit = async (req, res) => {
  try {
    const result = await UnitService.createUnit(req.body);
    res.status(StatusCodes.CREATED).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.getAllUnits = async (req, res) => {
  try {
    const result = await UnitService.getAllUnits();
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.getUnitById = async (req, res) => {
  try {
    const result = await UnitService.getUnitById(req.params.id);
    res.status(result.statusCode).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const result = await UnitService.updateUnit(req.params.id, req.body);
    res.status(result.statusCode).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const result = await UnitService.deleteUnit(req.params.id);
    res.status(result.statusCode).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.createOrUpdateUnit = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const data = req.body;
    const result = await UnitService.createOrUpdateUnitForUser(userId, data,req.user);

    res.status(result.statusCode || StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal Server Error",
        error.message
      )
    );
  }
};
