const express = require("express");
const router = express.Router();
const ApplicationController = require("../controllers/ApplicationController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/units",  ApplicationController.getAllApplicationsForUnit);
router.get("/unit-detail",  ApplicationController.getSingleApplicationForUnit);
router.get("/subordinates",  ApplicationController.getApplicationsOfSubordinates);
router.get("/scoreboard",  ApplicationController.getApplicationsScoreboard);
router.put("/:id",  ApplicationController.updateApplicationStatus);


module.exports = router;
