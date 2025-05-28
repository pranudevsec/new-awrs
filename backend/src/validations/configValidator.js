const { body } = require("express-validator");
const handleValidationErrors = require("../utils/validationMiddleware");
const MSG = require("../utils/MSG");

const baseValidations = {
  deadline: body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid date"),

  docu_path_base: body("docu_path_base")
    .optional()
    .isString()
    .withMessage("docu_path_base must be a string")
    .isLength({ min: 1 })
    .withMessage("docu_path_base cannot be empty"),

  cycle_period: body("cycle_period")
    .optional()
    .isArray({ min: 1 })
    .withMessage("cycle_period must be a non-empty array"),
};

// 🔧 Create Config (all fields required)
exports.validateCreateConfig = [
  body("deadline")
    .notEmpty()
    .withMessage("deadline is required")
    .isISO8601()
    .withMessage("Deadline must be a valid ISO8601 date"),

  body("docu_path_base")
    .notEmpty()
    .withMessage("docu_path_base is required")
    .isString()
    .withMessage("docu_path_base must be a string"),

  body("cycle_period")
    .notEmpty()
    .withMessage("cycle_period is required")
    .isArray({ min: 1 })
    .withMessage("cycle_period must be a non-empty array"),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];

// 🛠️ Update Config (all fields optional)
exports.validateUpdateConfig = [
  baseValidations.deadline,
  baseValidations.docu_path_base,
  baseValidations.cycle_period,

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];
