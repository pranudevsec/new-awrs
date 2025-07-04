const express = require("express");
const router = express.Router();
const AppreController = require("../controllers/AppreciationController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateCreateAppreciation, validateUpdateAppreciation } = require("../validations/appreciationValidator");
const checkRole = require("../middlewares/checkRole");

router.use(authMiddleware);

router.post("/",checkRole(["unit"]), validateCreateAppreciation, AppreController.createAppre);
router.get("/", AppreController.getAllAppres);
router.get("/:id", AppreController.getAppreById);
router.put("/:id",checkRole(["unit","command","headquarter","cw2"]), validateUpdateAppreciation, AppreController.updateAppre);
router.delete("/:id", AppreController.deleteAppre);

module.exports = router;
