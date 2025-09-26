const { body } = require("express-validator");
const handleValidationErrors = require("../utils/validationMiddleware");
const MSG = require("../utils/MSG");

/**
 * Validates approved marks against original marks and parameter max marks
 * Uses the same Math.min logic as the existing citation/appreciation validation
 * @param {Object} param - The parameter object containing original marks and max marks
 * @param {string|number} approvedMarks - The approved marks value
 * @returns {boolean} - True if valid, throws error if invalid
 */
const validateApprovedMarksAgainstLimits = (param, approvedMarks) => {
  const approved = Number(approvedMarks) || 0;
  const original = Number(param.marks) || 0;
  const maxMarks = Number(param.max_marks) || 0;

  // Check if approved marks is a valid number
  if (isNaN(approved) || approved < 0) {
    throw new Error('Approved marks must be a valid non-negative number');
  }

  // Use the same logic as citation/appreciation: Math.min(original, max_marks)
  const effectiveMax = Math.min(original, maxMarks);
  
  // Check if approved marks exceed the effective maximum
  if (approved > effectiveMax) {
    throw new Error(`Approved marks (${approved}) cannot exceed the effective maximum (${effectiveMax})`);
  }

  return true;
};

exports.validateApprovedMarksUpdate = [
  body("parameters")
    .optional()
    .isArray()
    .withMessage("parameters must be an array")
    .custom((parameters) => {
      if (!Array.isArray(parameters)) return true;
      
      parameters.forEach((param, index) => {
        if (param.approved_marks !== undefined) {
          // Validate approved marks against limits using same logic as citation/appreciation
          validateApprovedMarksAgainstLimits(param, param.approved_marks);
        }
      });
      
      return true;
    }),

  body("approved_marks")
    .optional()
    .custom((value, { req }) => {
      // If approved_marks is provided directly (not in parameters array)
      if (value !== undefined) {
        // This would need the original parameter data to validate
        // For now, just validate it's a valid number
        const approved = Number(value);
        if (isNaN(approved) || approved < 0) {
          throw new Error('Approved marks must be a valid non-negative number');
        }
      }
      return true;
    }),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];

/**
 * Middleware to validate approved marks for a specific parameter
 * Requires the original parameter data to be available in req.originalParameter
 * Uses the same Math.min logic as citation/appreciation validation
 */
exports.validateSingleApprovedMark = [
  body("approved_marks")
    .notEmpty()
    .withMessage("approved_marks is required")
    .custom((value, { req }) => {
      const originalParam = req.originalParameter;
      if (!originalParam) {
        throw new Error('Original parameter data is required for validation');
      }
      
      return validateApprovedMarksAgainstLimits(originalParam, value);
    }),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];
