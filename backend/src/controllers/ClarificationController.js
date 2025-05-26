const ClarificationService = require("../services/ClarificationService");
const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");
const path = require('path');

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
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        if (file.fieldname === 'clarification_doc') {
          data.clarification_doc = path.join('uploads', file.filename);
        }
      });
    }

    const result = await ClarificationService.updateClarification(user, data, id);
    res.status(StatusCodes.OK).send(result);
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update clarification", err.message)
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

exports.getAllApplicationsWithClarificationsForSubordinates = async (req, res) => {
  try {
    const user = req.user;
    const query = req.query;
    const result = await ClarificationService.getAllApplicationsWithClarificationsForSubordinates(user, query);
    res.status(StatusCodes.OK).send(result);
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to add clarification", err.message)
    );
  }
};
