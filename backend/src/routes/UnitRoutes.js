const express = require("express");
const router = express.Router();
const UnitController = require("../controllers/UnitController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateCreateUnit, validateUpdateUnit } = require("../validations/unitValidator");

router.use(authMiddleware);

router.post("/",validateCreateUnit, UnitController.createUnit);
router.get("/", UnitController.getAllUnits);
router.get("/:id", UnitController.getUnitById);
router.put("/:id",validateUpdateUnit, UnitController.updateUnit);
router.delete("/:id", UnitController.deleteUnit);
router.post("/add-unit-profile", UnitController.createOrUpdateUnit);

module.exports = router;
