const express = require("express");
const router = express.Router();
const ConfigController = require("../controllers/ConfigController.js");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateCreateConfig, validateUpdateConfig } = require("../validations/configValidator.js");

router.use(authMiddleware);

router.get("/", ConfigController.getConfig);
router.put("/",validateUpdateConfig, ConfigController.updateConfig);

module.exports = router;
