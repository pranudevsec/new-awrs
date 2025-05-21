// errorHandler.js

const mongoose = require("mongoose");

function errorHandler(err, req, res, next) {
  // Set a default status code and error message
  let statusCode = 500; // Internal server error
  let errorMessage = err.message;
  let errorOrigin;
  // Check for specific error types and set the status code accordingly
  if (err instanceof SyntaxError) {
    statusCode = 400; // Bad request
  } else if (err instanceof TypeError) {
    statusCode = 422; // Unprocessable entity
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422; // Unprocessable entity
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400; // Bad request
  }

  // Send an error response to the client
  res.status(statusCode).json({
    statusCode: statusCode,
    message: errorMessage,
    success: false,
    errorOrigin,
  });
}

module.exports = errorHandler;
