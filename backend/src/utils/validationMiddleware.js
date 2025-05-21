// validationMiddleware.js
const { validationResult } = require("express-validator");
const ResponseHelper = require("./responseHelper");

const handleValidationErrors = (options = {}) => {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg || options.customMessage;
      return res.status(400).json(ResponseHelper.error(400, errorMessage));
    }
    next();
  };
};

module.exports = handleValidationErrors;

