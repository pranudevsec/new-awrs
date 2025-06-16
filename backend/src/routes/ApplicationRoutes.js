const express = require("express");
const router = express.Router();
const ApplicationController = require("../controllers/ApplicationController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../utils/upload");

router.use(authMiddleware);

router.get("/units",  ApplicationController.getAllApplicationsForUnit);
router.get("/headquarter",  ApplicationController.getAllApplicationsForHQ);
router.get("/unit-detail",  ApplicationController.getSingleApplicationForUnit);
router.get("/subordinates",  ApplicationController.getApplicationsOfSubordinates);
router.get("/scoreboard",  ApplicationController.getApplicationsScoreboard);
router.put("/:id",  ApplicationController.updateApplicationStatus);
router.put("/approve/applications",  ApplicationController.approveApplications);
router.post("/approve-marks", ApplicationController.approveApplicationMarks);
router.post("/add-comment", ApplicationController.addApplicationComment);
router.post("/upload-doc",upload.any(),  ApplicationController.uploadDoc);

module.exports = router;
