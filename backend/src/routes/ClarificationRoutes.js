const express = require("express");
const router = express.Router();
const ClarificationController = require("../controllers/ClarificationController.js");
const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole.js");

router.use(authMiddleware);

router.post("/", ClarificationController.addClarification);
router.put("/:id", ClarificationController.updateClarification);
router.get("/",  ClarificationController.getAllApplicationsWithClarificationsForUnit);


module.exports = router;
