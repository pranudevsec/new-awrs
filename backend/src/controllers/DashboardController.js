const DashboardService = require("../services/DashboardService");
const ResponseHelper = require("../utils/responseHelper");
const { StatusCodes } = require("http-status-codes");

exports.getDashboardStats = async (req, res) => {
    try {
      const result = await DashboardService.getDashboardStats(req.user);
      res.status(StatusCodes.OK).send(result);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, "Internal Server Error", error.message));
    }
  };

  exports.getUnitScores = async (req, res) => {
    try {
      const user = req.user;
      const result = await DashboardService.getUnitScores(user);
      return res.status(200).json(ResponseHelper.success(200, "Unit scores fetched", result));
    } catch (err) {
      return res.status(500).json(ResponseHelper.error(500, "Failed to fetch unit scores", err.message));
    }
  };

  exports.getHomeCounts = async (req, res) => {
    try {
      const user = req.user;
      const result = await DashboardService.getHomeCounts(user);
      return res.status(200).json(ResponseHelper.success(200, "Home counts fetched", result));
    } catch (err) {
      return res.status(500).json(ResponseHelper.error(500, "Failed to fetch unit scores", err.message));
    }
  };