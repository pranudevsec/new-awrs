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

exports.getAllApplicationsForHQ = async (req, res) => {
  try {
    const result = await ApplicationService.getAllApplicationsForHQ(req.user, req.query);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
    );
  }
};

exports.getSingleApplicationForUnit = async (req, res) => {
  try {
    const result = await ApplicationService.getSingleApplicationForUnit(req.user, req.query);
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

exports.getApplicationsScoreboard = async (req, res) => {
    try {
      const result = await ApplicationService.getApplicationsScoreboard(req.user, req.query);
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
  
      if (!['approved', 'rejected',"shortlisted_approved"].includes(status)) {
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
  
  exports.approveApplicationMarks = async (req, res) => {
    try {
      const result = await ApplicationService.approveApplicationMarks(req.user, req.body);
      res.status(StatusCodes.OK).send(result);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
      );
    }
  };
  
  exports.addApplicationComment = async (req, res) => {
    try {
      const result = await ApplicationService.addApplicationComment(req.user, req.body);
      res.status(StatusCodes.OK).send(result);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
      );
    }
  };
  exports.uploadDoc = async (req, res) => {
    try {
      if (req.files && Array.isArray(req.files)) {
        const fileUrls = req.files.map((file) => ({
          field: file.fieldname,
          urlPath: `/uploads/${file.filename}`
        }));
        
        return res.status(StatusCodes.OK).send(fileUrls);
      }
  
      res.status(StatusCodes.BAD_REQUEST).send(
        ResponseHelper.error(StatusCodes.BAD_REQUEST, "No files uploaded")
      );
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
      );
    }
  };
