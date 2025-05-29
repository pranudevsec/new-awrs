const { body } = require("express-validator");
const handleValidationErrors = require("../utils/validationMiddleware");
const MSG = require("../utils/MSG");
exports.validateCreateAppreciation = [
  body("date_init")
    .notEmpty().withMessage("date_init is required")
    .isISO8601().withMessage("date_init must be a valid date (YYYY-MM-DD)"),

    body("status_flag")
    .optional(),

  body("appre_fds")
    .notEmpty().withMessage("appre_fds is required")
    .isObject().withMessage("appre_fds must be a valid JSON object")
    .custom((value) => {
      if (!value.award_type || value.award_type !== "appreciation") {
        throw new Error("appre_fds.award_type must be 'appreciation'");
      }
      if (!value.cycle_period || typeof value.cycle_period !== "string") {
        throw new Error("Cycle Period is required");
      }
      if (value.last_date && isNaN(Date.parse(value.last_date))) {
        throw new Error("appre_fds.last_date must be a valid date string");
      }
      value.parameters.forEach((param, index) => {
        if (param.name && typeof param.name !== "string") {
          throw new Error(`parameters[${index}].name must be a string`);
        }
        if (param.count !== undefined && (typeof param.count !== "number" || param.count < 0)) {
          throw new Error(`parameters[${index}].count must be a non-negative number`);
        }
        if (param.marks !== undefined && (typeof param.marks !== "number" || param.marks < 0)) { 
          throw new Error(`parameters[${index}].marks must be a non-negative number`);
        }
      });
      return true;
    }),

  handleValidationErrors({ customMessage: MSG.VALIDATION_ERROR }),
];

exports.validateUpdateAppreciation = [
  body("date_init")
    .optional()
    .isISO8601().withMessage("date_init must be a valid date (YYYY-MM-DD)"),

  body("status_flag")
    .optional()
    .isIn(["pending", "submitted", "reviewed", "approved", "rejected"])
    .withMessage("status_flag must be one of 'pending', 'submitted', 'reviewed', 'approved', 'rejected'"),

  body("appre_fds")
    .optional()
    .isObject().withMessage("appre_fds must be a valid JSON object")
    .custom((value) => {
      if (value.award_type && value.award_type !== "appreciation") {
        throw new Error("appre_fds.award_type must be 'appreciation'");
      }
      if (value.cycle_period && typeof value.cycle_period !== "string") {
        throw new Error("Cycle Period is required");
      }
      if (value.details) {
        if (!Array.isArray(value.details)) {
          throw new Error("appre_fds.details must be an array");
        }
        value.details.forEach((item, index) => {
          if (item.title && typeof item.title !== "string") {
            throw new Error(`details[${index}].title must be a string`);
          }
          if (item.description && typeof item.description !== "string") {
            throw new Error(`details[${index}].description must be a string`);
          }
          if (item.document && typeof item.document !== "string") {
            throw new Error(`details[${index}].document must be a file path string`);
          }
        });
      }
      return true;
    }),

  handleValidationErrors({ customMessage: MSG.VALIDATION_ERROR }),
];
