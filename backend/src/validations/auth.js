const { body } = require("express-validator");
const MSG = require("../utils/MSG");
const handleValidationErrors = require("../utils/validationMiddleware");
exports.validateLogin = [
  body("user_role").notEmpty().withMessage("User Role is required"),
  body("username").notEmpty().withMessage("Username is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];

exports.validateRegister = [
  body("rank")
    .notEmpty()
    .withMessage("Rank is required"),

  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters"),

  body("user_role")
    .notEmpty()
    .withMessage("User Role is required"),

  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ max: 50 })
    .withMessage("Username must not exceed 50 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];