
const mongoose = require("mongoose");

function errorHandler(err, req, res, next) {

  let statusCode = 500; // Internal server error
  let errorMessage = err.message;
  let errorOrigin;

  if (err instanceof SyntaxError) {
    statusCode = 400; // Bad request
  } else if (err instanceof TypeError) {
    statusCode = 422; // Unprocessable entity
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422; // Unprocessable entity
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400; // Bad request
  }


  res.status(statusCode).json({
    statusCode: statusCode,
    message: errorMessage,
    success: false,
    errorOrigin,
  });
}

module.exports = errorHandler;
