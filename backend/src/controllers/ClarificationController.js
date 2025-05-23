const ClarificationService = require("../services/ClarificationService");
const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");

exports.addClarification = async (req, res) => {
  try {
    const user = req.user;
    const data = req.body;
    const result = await ClarificationService.addClarification(user, data);
    res.status(StatusCodes.OK).send(result);
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to add clarification", err.message)
    );
  }
};

exports.updateClarification = async (req, res) => {
  try {
    const user = req.user;
    const id = req.params.id;
    const data = req.body;
    const result = await ClarificationService.updateClarification(user, data,id);
    res.status(StatusCodes.OK).send(result);
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to add clarification", err.message)
    );
  }
};

exports.getAllApplicationsWithClarificationsForUnit = async (req, res) => {
  try {
    const user = req.user;
    const query = req.query;
    const result = await ClarificationService.getAllApplicationsWithClarificationsForUnit(user, query);
    res.status(StatusCodes.OK).send(result);
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to add clarification", err.message)
    );
  }
};
