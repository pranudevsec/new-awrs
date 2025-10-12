const { body } = require("express-validator");
const handleValidationErrors = require("../utils/validationMiddleware");
const MSG = require("../utils/MSG");

exports.validateMember = [
  body("ic_number")
    .notEmpty()
    .withMessage("IC number is required and cannot be blank")
    .matches(/^IC-\d{5}[A-Z]$/)
    .withMessage("IC number must be in format IC-XXXXX[A-Z] where XXXXX are 5 digits and last character is any alphabet"),

  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("member_type")
    .optional()
    .isString()
    .withMessage("Member type must be a string"),

  body("member_id")
    .optional()
    .isString()
    .withMessage("Member ID must be a string"),

  body("is_signature_added")
    .optional()
    .isBoolean()
    .withMessage("is_signature_added must be a boolean"),

  body("sign_digest")
    .optional()
    .isString()
    .withMessage("sign_digest must be a string"),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];

exports.validateMemberUpdate = [
  body("ic_number")
    .notEmpty()
    .withMessage("IC number is required and cannot be blank")
    .matches(/^IC-\d{5}[A-Z]$/)
    .withMessage("IC number must be in format IC-XXXXX[A-Z] where XXXXX are 5 digits and last character is any alphabet"),

  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("member_type")
    .optional()
    .isString()
    .withMessage("Member type must be a string"),

  body("is_signature_added")
    .optional()
    .isBoolean()
    .withMessage("is_signature_added must be a boolean"),

  body("sign_digest")
    .optional()
    .isString()
    .withMessage("sign_digest must be a string"),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];
