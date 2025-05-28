const { body } = require("express-validator");
const handleValidationErrors = require("../utils/validationMiddleware");
const MSG = require("../utils/MSG");

exports.validateCreateCitation = [
  body("date_init")
    .notEmpty().withMessage("date_init is required")
    .isISO8601().withMessage("date_init must be a valid date (YYYY-MM-DD)"),

  body("status_flag")
   .optional(),

  body("citation_fds")
    .notEmpty().withMessage("citation_fds is required")
    .isObject().withMessage("citation_fds must be a valid JSON object")
    .custom((value) => {
      if (!value.award_type || !["citation", "appreciation"].includes(value.award_type)) {
        throw new Error("citation_fds.award_type must be 'citation' or 'appreciation'");
      }
      if (!value.cycle_period || typeof value.cycle_period !== "string") {
        throw new Error("citation_fds.cycle_period must be a string");
      }
      if (!value.last_date || isNaN(Date.parse(value.last_date))) {
        throw new Error("citation_fds.last_date must be a valid date string");
      }
      if (!Array.isArray(value.parameters)) {
        throw new Error("citation_fds.parameters must be an array");
      }
      value.parameters.forEach((param, index) => {
        if (!param.name || typeof param.name !== "string") {
          throw new Error(`parameters[${index}].name is required and must be a string`);
        }
        if (typeof param.count !== "number" || param.count < 0) {
          throw new Error(`parameters[${index}].count must be a non-negative number`);
        }
        if (typeof param.marks !== "number" || param.marks < 0) {
          throw new Error(`parameters[${index}].marks must be a non-negative number`);
        }
      });
      return true;
    }),

  handleValidationErrors({
    customMessage: MSG.VALIDATION_ERROR,
  }),
];

exports.validateUpdateCitation = [
    body("date_init")
      .optional()
      .isISO8601().withMessage("date_init must be a valid date (YYYY-MM-DD)"),
  
    body("status_flag")
      .optional()
      .isIn(["pending", "submitted", "reviewed", "approved", "rejected"])
      .withMessage("status_flag must be one of 'pending', 'submitted', 'reviewed', 'approved', 'rejected'"),
  
    body("citation_fds")
      .optional()
      .isObject().withMessage("citation_fds must be a valid JSON object")
      .custom((value) => {
        if (value.award_type && !["citation", "appreciation"].includes(value.award_type)) {
          throw new Error("citation_fds.award_type must be 'citation' or 'appreciation'");
        }
        if (value.cycle_period && typeof value.cycle_period !== "string") {
          throw new Error("citation_fds.cycle_period must be a string");
        }
        if (value.last_date && isNaN(Date.parse(value.last_date))) {
          throw new Error("citation_fds.last_date must be a valid date string");
        }
        if (value.parameters) {
          if (!Array.isArray(value.parameters)) {
            throw new Error("citation_fds.parameters must be an array");
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
          
        }
        return true;
      }),
  
    handleValidationErrors({
      customMessage: MSG.VALIDATION_ERROR,
    }),
  ];

  