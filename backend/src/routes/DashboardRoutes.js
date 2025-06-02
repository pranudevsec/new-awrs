const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/DashboardController.js");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/stats", DashboardController.getDashboardStats);
router.get('/unit-scores',  DashboardController.getUnitScores);
router.get('/home-counts',  DashboardController.getHomeCounts);

module.exports = router;
