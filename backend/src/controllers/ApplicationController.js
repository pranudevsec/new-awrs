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
  
  exports.updateApplicationStatus = async (req, res) => {
    try {
      const { type, status } = req.body;
      const id=req.params.id;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(StatusCodes.BAD_REQUEST).send(
          ResponseHelper.error(StatusCodes.BAD_REQUEST, "Invalid status value")
        );
      }
  
      const result = await ApplicationService.updateApplicationStatus(id, type, status, req.user);
  
      res.status(StatusCodes.OK).send(
        ResponseHelper.success(StatusCodes.OK, "Application status updated", result)
      );
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
      );
    }
  };
  
  