const express = require("express");
const router = express.Router();
const MasterController = require("../controllers/MasterController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/brigades", MasterController.getBrigades);
router.get("/corps", MasterController.getCorps);
router.get("/commands", MasterController.getCommands);
router.get("/divisions", MasterController.getDivisions);
router.get("/arms-services", MasterController.getArmsServices);
router.get("/roles", MasterController.getRoles);
router.get("/deployments", MasterController.getDeployments);
router.get("/units", MasterController.getUnits);

module.exports = router;
