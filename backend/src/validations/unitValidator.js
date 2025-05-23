const { body } = require("express-validator");
const handleValidationErrors = require("../utils/validationMiddleware");
const MSG = require("../utils/MSG");

exports.validateCreateUnit = [
  body("sos_no")
    .optional()
    .isLength({ min: 8, max: 8 }).withMessage("sos_no must be exactly 8 characters"),

  body("name")
    .notEmpty().withMessage("name is required")
    .isString().withMessage("name must be a string"),

  body("adm_channel")
    .optional()
    .isString().withMessage("adm_channel must be a string"),

  body("tech_channel")
    .optional()
    .isString().withMessage("tech_channel must be a string"),

  body("bde")
    .optional()
    .isString().withMessage("bde must be a string"),

  body("div")
    .optional()
    .isString().withMessage("div must be a string"),

  body("corps")
    .optional()
    .isString().withMessage("corps must be a string"),

  body("comd")
    .optional()
    .isString().withMessage("comd must be a string"),

  handleValidationErrors({ customMessage: MSG.VALIDATION_ERROR }),
];

exports.validateUpdateUnit = [
  body("sos_no")
    .optional()
    .isLength({ min: 8, max: 8 }).withMessage("sos_no must be exactly 8 characters"),

  body("name")
    .optional()
    .isString().withMessage("name must be a string"),

  body("adm_channel")
    .optional()
    .isString().withMessage("adm_channel must be a string"),

  body("tech_channel")
    .optional()
    .isString().withMessage("tech_channel must be a string"),

  body("bde")
    .optional()
    .isString().withMessage("bde must be a string"),

  body("div")
    .optional()
    .isString().withMessage("div must be a string"),

  body("corps")
    .optional()
    .isString().withMessage("corps must be a string"),

  body("comd")
    .optional()
    .isString().withMessage("comd must be a string"),

  handleValidationErrors({ customMessage: MSG.VALIDATION_ERROR }),
];
