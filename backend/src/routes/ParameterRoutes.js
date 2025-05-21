const express = require("express");
const router = express.Router();
const ParameterController = require("../controllers/ParameterController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateCreateParameter, validateUpdateParameter } = require("../validations/parameterValidator");

router.use(authMiddleware);

router.post("/",validateCreateParameter, ParameterController.createParameter);
router.get("/", ParameterController.getAllParameters);
router.get("/:id", ParameterController.getParameterById);
router.put("/:id",validateUpdateParameter, ParameterController.updateParameter);
router.delete("/:id", ParameterController.deleteParameter);

module.exports = router;
