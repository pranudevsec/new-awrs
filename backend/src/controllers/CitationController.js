const CitationService = require("../services/CitationService");
const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");

exports.createCitation = async (req, res) => {
  try {
    const result = await CitationService.createCitation(req.body,req.user);
    res.status(StatusCodes.CREATED).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.getAllCitations = async (req, res) => {
  try {
    const result = await CitationService.getAllCitations();
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.getCitationById = async (req, res) => {
  try {
    const result = await CitationService.getCitationById(req.params.id);
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

exports.updateCitation = async (req, res) => {
  try {
    const result = await CitationService.updateCitation(req.params.id, req.body,req.user);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.deleteCitation = async (req, res) => {
  try {
    const result = await CitationService.deleteCitation(req.params.id);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};
