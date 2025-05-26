const express = require("express");
const router = express.Router();
const ClarificationController = require("../controllers/ClarificationController.js");
const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole.js");
const upload = require("../utils/upload.js");

router.use(authMiddleware);

router.post("/", ClarificationController.addClarification);
router.put("/:id",upload.any(), ClarificationController.updateClarification);
router.get("/",  ClarificationController.getAllApplicationsWithClarificationsForUnit);
router.get("/for-subordinates",  ClarificationController.getAllApplicationsWithClarificationsForSubordinates);


module.exports = router;
