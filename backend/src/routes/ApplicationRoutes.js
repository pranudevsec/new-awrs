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
router.post("/add-signature", ApplicationController.addApplicationSignature);
router.post("/add-comment", ApplicationController.addApplicationComment);
router.post("/upload-doc",upload.any(),  ApplicationController.uploadDoc);
router.get("/history",  ApplicationController.getApplicationsHistory);
router.get("/all",  ApplicationController.getAllApplications);
router.get("/all-app-list",  ApplicationController.getAllApplicationsList);
router.get("/all-app-pending",  ApplicationController.getAllApplicationsPending);
router.get("/all-app-reject",  ApplicationController.getAllApplicationsRejected);
router.get("/all-app-approve",  ApplicationController.getAllApplicationsApproved);
router.get("/all-app-final",  ApplicationController.getAllApplicationsFinalised);
router.get("/all-app-count",  ApplicationController.getAllApplicationsStatusCount);
router.get("/graph",  ApplicationController.getAllApplicationsGraph);
router.post("/finalized",  ApplicationController.applicationFinalize);

module.exports = router;
