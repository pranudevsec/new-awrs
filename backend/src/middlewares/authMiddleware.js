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
    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ResponseHelper.error(StatusCodes.UNAUTHORIZED, MSG.UNAUTHORIZED));
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Fetch user from User_tab and join Role_Master to get role_name
    const userQuery = `
      SELECT u.*, r.role_name
      FROM User_tab u
      LEFT JOIN Role_Master r ON u.role_id = r.role_id
      WHERE u.username = $1
      LIMIT 1
    `;
    const userResult = await req.db.query(userQuery, [decoded.username]);

    if (userResult.rows.length === 0) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ResponseHelper.error(StatusCodes.UNAUTHORIZED, MSG.UNAUTHORIZED));
    }

    const user = userResult.rows[0];

    // Attach user_role field
    user.user_role = user.role_name ? user.role_name.toLowerCase() : null;

    // Remove role_name to avoid redundancy
    delete user.role_name;

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ResponseHelper.error(StatusCodes.UNAUTHORIZED, MSG.TOKEN_EXPIRED));
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(ResponseHelper.error(StatusCodes.UNAUTHORIZED, MSG.INVALID_ACCESS_TOKEN));
    }

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ResponseHelper.error(StatusCodes.INTERNAL_SERVER_ERROR, MSG.INTERNAL_SERVER_ERROR, error.message));
  }
};

module.exports = authMiddleware;
