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
      return res.status(401).json(ResponseHelper.error(401, MSG.UNAUTHORIZED));
    }

    // Verify the JWT token
    jwt.verify(token, config.jwtSecret, async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .json(ResponseHelper.error(StatusCodes.UNAUTHORIZED, MSG.TOKEN_EXPIRED));
        }

        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json(ResponseHelper.error(StatusCodes.UNAUTHORIZED, MSG.INVALID_ACCESS_TOKEN));
      }

      // Fetch user from User_tab
      const userQuery = "SELECT * FROM User_tab WHERE username = $1";
      const userResult = await req.db.query(userQuery, [decoded.username]);

      if (userResult.rows.length === 0) {
        return res.status(401).json(ResponseHelper.error(401, MSG.UNAUTHORIZED));
      }

      const user = userResult.rows[0];

      // Fetch role name from Role_Master based on role_id
      if (user.role_id) {
        const roleQuery = "SELECT role_name FROM Role_Master WHERE role_id = $1 LIMIT 1";
        const roleResult = await req.db.query(roleQuery, [user.role_id]);

        if (roleResult.rows.length > 0) {
          user.user_role = roleResult.rows[0].role_name.toLowerCase(); // store as user_role
        } else {
          user.user_role = null;
        }
      } else {
        user.user_role = null;
      }

      // Attach user to request
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json(
      ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

module.exports = authMiddleware;
