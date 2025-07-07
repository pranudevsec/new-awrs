/**
 * File Name: authMiddleware.js
 */
const MSG = require("../utils/MSG");
const ResponseHelper = require("../utils/responseHelper");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const { StatusCodes } = require("http-status-codes");

const authMiddleware = async (req, res, next) => {
  try {
    // Extract the JWT token from the request headers
    const token = req.headers.authorization?.split(" ")[1];
    // Check if the token is missing
    if (!token) {
      return res.status(401).json(ResponseHelper.error(401, MSG.UNAUTHORIZED));
    }

    // Verify the JWT token
    jwt.verify(token, config.jwtSecret, async (err, decoded) => {
      if (err) {
        // If token is expired
        if (err.name === "TokenExpiredError") {
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .json(
              ResponseHelper.error(StatusCodes.UNAUTHORIZED, MSG.TOKEN_EXPIRED)
            );
        }

        // For any other errors (e.g., invalid token)
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json(
            ResponseHelper.error(
              StatusCodes.UNAUTHORIZED,
              MSG.INVALID_ACCESS_TOKEN
            )
          );
      }
      // If token is valid, retrieve user data from PostgreSQL
      const queryText = "SELECT * FROM User_tab WHERE username = $1";
      const user = await req.db.query(queryText, [decoded.username]);

      // Check if the user exists
      if (user.rows.length === 0) {
        return res
          .status(401)
          .json(ResponseHelper.error(401, MSG.UNAUTHORIZED));
      }

      // Set user data in request object for further processing
      req.user = user.rows[0];
      next();
    });
  } catch (error) {
      res
      .status(500)
      .json(
        ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message)
      );
  }
};

module.exports = authMiddleware;
