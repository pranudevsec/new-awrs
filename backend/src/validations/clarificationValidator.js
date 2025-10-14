const { body } = require("express-validator");
const handleValidationErrors = require("../utils/validationMiddleware");
const MSG = require("../utils/MSG");

const countWords = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const validateWordCount = (text, maxWords = 200) => {
  const wordCount = countWords(text);
  if (wordCount > maxWords) {
    throw new Error(`Text must not exceed ${maxWords} words. Current word count: ${wordCount}`);
  }
  return true;
};

exports.validateCreateClarification = [
  body("type")
    .notEmpty().withMessage("type is required")
    .isIn(["citation", "appreciation"]).withMessage("type must be 'citation' or 'appreciation'"),

  body("application_id")
    .notEmpty().withMessage("application_id is required")
    .isInt({ min: 1 }).withMessage("application_id must be a positive integer"),

  body("parameter_name")
    .notEmpty().withMessage("parameter_name is required")
    .isString().withMessage("parameter_name must be a string"),

  body("parameter_id")
    .notEmpty().withMessage("parameter_id is required")
    .isString().withMessage("parameter_id must be a string"),

  body("reviewer_comment")
    .optional()
    .isString().withMessage("reviewer_comment must be a string")
    .custom((value) => {
      if (value && value.trim()) {
        return validateWordCount(value, 200);
      }
      return true;
    }),

  body("clarification")
    .optional()
    .isString().withMessage("clarification must be a string")
    .custom((value) => {
      if (value && value.trim()) {
        return validateWordCount(value, 200);
      }
      return true;
    }),

  body("clarification_doc")
    .optional()
    .isString().withMessage("clarification_doc must be a string"),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];

exports.validateUpdateClarification = [
  body("clarification")
    .optional()
    .isString().withMessage("clarification must be a string")
    .custom((value) => {
      if (value && value.trim()) {
        return validateWordCount(value, 200);
      }
      return true;
    }),

  body("clarification_doc")
    .optional()
    .isString().withMessage("clarification_doc must be a string"),

  body("clarification_status")
    .optional()
    .isIn(["pending", "clarified", "rejected"]).withMessage("clarification_status must be 'pending', 'clarified', or 'rejected'"),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];
