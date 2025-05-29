const { body } = require("express-validator");
const handleValidationErrors = require("../utils/validationMiddleware");
const MSG = require("../utils/MSG");

const baseValidations = {
  comd: body("comd")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("command must be exactly 3 characters"),

  award_type: body("award_type")
    .optional()
    .isIn(["citation", "appreciation"])
    .withMessage("Award Type must be either 'citation' or 'appreciation'"),

  applicability: body("applicability")
    .optional()
    .isLength({ min: 1, max: 25 })
    .withMessage("Applicability must be between 1 to 4 characters"),

  name: body("name")
    .optional()
    .isLength({ min: 1, max: 25 })
    .withMessage("Name must be between 1 to 25 characters"),

  description: body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  negative: body("negative")
    .optional()
    .isBoolean()
    .withMessage("Negative must be a boolean"),

  max_marks: body("max_marks")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Max marks must be a non-negative integer"),

  proof_reqd: body("proof_reqd")
    .optional()
    .isBoolean()
    .withMessage("proof_reqd must be a boolean"),

  weightage: body("weightage")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Weightage must be a non-negative integer"),

  param_sequence: body("param_sequence")
    .optional()
    .isInt({ min: 0 })
    .withMessage("param_sequence must be a non-negative integer"),

  param_mark: body("param_mark")
    .optional()
    .isInt({ min: 0 })
    .withMessage("param_mark must be a non-negative integer"),
};

exports.validateCreateParameter = [
    body("comd")
    .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage("comd must be exactly 3 characters"),
  
    body("award_type")
      .notEmpty()
      .withMessage("award_type is required")
      .isIn(["citation", "appreciation"])
      .withMessage("Award Type must be either 'citation' or 'appreciation'"),
  
    body("applicability")
      .notEmpty()
      .withMessage("applicability is required")
      .isLength({ min: 1, max: 25 })
      .withMessage("Applicability must be between 1 to 4 characters"),
  
    body("name")
      .notEmpty()
      .withMessage("name is required")
      .isLength({ min: 1, max: 25 })
      .withMessage("Name must be between 1 to 25 characters"),
  
    body("description")
      .notEmpty()
      .withMessage("description is required")
      .isString()
      .withMessage("Description must be a string"),
  
    body("negative")
      .notEmpty()
      .withMessage("negative is required")
      .isBoolean()
      .withMessage("Negative must be a boolean"),
  
    body("max_marks")
      .notEmpty()
      .withMessage("max_marks is required")
      .isInt({ min: 0 })
      .withMessage("Max marks must be a non-negative integer"),
  
    body("proof_reqd")
      .notEmpty()
      .withMessage("proof_reqd is required")
      .isBoolean()
      .withMessage("proof_reqd must be a boolean"),
  
    body("weightage")
      .notEmpty()
      .withMessage("weightage is required")
      .isInt({ min: 0 })
      .withMessage("Weightage must be a non-negative integer"),
  
    body("param_sequence")
      .notEmpty()
      .withMessage("param_sequence is required")
      .isInt({ min: 0 })
      .withMessage("param_sequence must be a non-negative integer"),
  
    body("param_mark")
      .notEmpty()
      .withMessage("param_mark is required")
      .isInt({ min: 0 })
      .withMessage("param_mark must be a non-negative integer"),
  
    handleValidationErrors({
      customMessage: MSG.VALIDATION_ERROR,
    }),
  ];
// 🛠️ Update Validations (All Optional)
exports.validateUpdateParameter = [
  baseValidations.comd,
  baseValidations.award_type,
  baseValidations.applicability,
  baseValidations.name,
  baseValidations.description,
  baseValidations.negative,
  baseValidations.max_marks,
  baseValidations.proof_reqd,
  baseValidations.weightage,
  baseValidations.param_sequence,
  baseValidations.param_mark,

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];

