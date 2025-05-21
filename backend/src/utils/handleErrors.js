// handleErrors.js

module.exports = function handleErrors(asyncFunction) {
  return async function (...args) {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      if (args.length > 2 && typeof args[2] === "function") {
        const next = args[2];
        // Move to the next error handler
        return next(error);
      }
      throw new Error(error.message);
    }
  };
};
