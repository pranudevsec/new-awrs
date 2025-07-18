const ApplicationService = require("../services/ApplicationService");
const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");
const SignatureLogService = require("../services/SignatureLogsService");

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
      const { type, status,member ,withdrawRequested,withdraw_status,level} = req.body;
      const id=req.params.id;

      if (status) {
        if (!['approved', 'rejected', "shortlisted_approved"].includes(status)) {
          return res.status(StatusCodes.BAD_REQUEST).send(
            ResponseHelper.error(StatusCodes.BAD_REQUEST, "Invalid status value")
          );
        }
      }
      const result = await ApplicationService.updateApplicationStatus(id, type, status, req.user,member,withdrawRequested,withdraw_status);
      if(member){
        await SignatureLogService.addSignatureLogs(id,status,level,member);
      }
  
      res.status(StatusCodes.OK).send(
        ResponseHelper.success(StatusCodes.OK, "Application status updated", result)
      );
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
      );
    }
  };
  
  exports.approveApplications = async (req, res) => {
    try {
      const { type, status = "approved", ids } = req.body;
  
      const allowedStatuses = ["approved", "rejected", "shortlisted_approved"];
      if (!allowedStatuses.includes(status)) {
        return res.status(StatusCodes.BAD_REQUEST).send(
          ResponseHelper.error(StatusCodes.BAD_REQUEST, "Invalid status value")
        );
      }
  
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).send(
          ResponseHelper.error(StatusCodes.BAD_REQUEST, "No application IDs provided")
        );
      }
  
      const results = [];
  
      for (const id of ids) {
        try {
          const result = await ApplicationService.updateApplicationStatus(id, type, status, req.user);
          results.push({ id, success: true, result });
        } catch (err) {
          results.push({ id, success: false, error: err.message });
        }
      }
  
      return res.status(StatusCodes.OK).send(
        ResponseHelper.success(StatusCodes.OK, "Application approved", results)
      );
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
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
  
  exports.addApplicationSignature = async (req, res) => {
    try {
      const result = await ApplicationService.addApplicationSignature(req.user, req.body);
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
  exports.getApplicationsHistory = async (req, res) => {
    try {
      const result = await ApplicationService.getApplicationsHistory(req.user, req.query);
      res.status(StatusCodes.OK).send(result);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
      );
    }
  };
  exports.getAllApplications = async (req, res) => {
    try {
      const result = await ApplicationService.getAllApplications(req.user, req.query);
      res.status(StatusCodes.OK).send(result);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message)
      );
    }
  };