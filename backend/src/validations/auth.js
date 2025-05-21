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
  // Validate name
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  // Validate username
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[\w-]+$/)
    .withMessage("Username should not contain spaces or special characters")
    .customSanitizer((value) => (value ? value.toLowerCase() : value)),
  // Validate email
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail(),

  // Validate password
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  // Validate user_type
  body("user_type")
    .notEmpty()
    .withMessage("User type is required")
    .isIn(["admin", "user", "vc"])
    .withMessage("Invalid user type"),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];
