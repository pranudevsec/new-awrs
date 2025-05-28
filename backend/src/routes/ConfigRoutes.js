const express = require("express");
const router = express.Router();
const ConfigController = require("../controllers/ConfigController.js");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateCreateConfig, validateUpdateConfig } = require("../validations/configValidator.js");
const checkRole = require("../middlewares/checkRole.js");

router.use(authMiddleware);

router.get("/", ConfigController.getConfig);
router.put("/",checkRole(["admin"]),validateUpdateConfig, ConfigController.updateConfig);

module.exports = router;
