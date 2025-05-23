const ApplicationService = require("../services/ApplicationService");
const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");

exports.getAllApplicationsForUnit = async (req, res) => {
  try {
    const result = await ApplicationService.getAllApplicationsForUnit(req.user, req.query);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};
exports.getApplicationsOfSubordinates = async (req, res) => {
    try {
      const result = await ApplicationService.getApplicationsOfSubordinates(req.user, req.query);
      res.status(StatusCodes.OK).send(result);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
      );
    }
  };
  