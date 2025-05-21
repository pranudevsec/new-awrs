const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const ResponseHelper = require("../utils/responseHelper");
const MSG = require("../utils/MSG");
const db = require("../db/postgres-connection");

exports.register = async ({ name, username, email, password, user_type }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const userExists = await db.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return ResponseHelper.error(400, MSG.USER_ALREADY_EXISTS);
    }

    const insertQuery = `
      INSERT INTO users (name, username, email, password, user_type)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, email, user_type
    `;
    const result = await db.query(insertQuery, [
      name,
      username,
      email,
      hashedPassword,
      user_type,
    ]);

    return ResponseHelper.success(201, MSG.REGISTER_SUCCESS, result.rows[0]);
  } catch (error) {
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};

exports.login = async (credentials) => {
  try {
    if (!credentials) {
      return ResponseHelper.error(400, "Missing credentials");
    }

    const { user_role, username, password } = credentials;

    // Step 1: Find the user by role and username
    const userQuery = await db.query(
      "SELECT * FROM User_tab WHERE user_role = $1 AND username = $2",
      [user_role, username]
    );

    if (userQuery.rows.length === 0) {
      return ResponseHelper.error(404, MSG.USER_NOT_FOUND);
    }

    const user = userQuery.rows[0];

    // Step 2: Compare the password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ResponseHelper.error(401, MSG.INVALID_CREDENTIALS);
    }

    // Step 3: Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, username: user.username, user_role: user.user_role },
      config.jwtSecret,
      { expiresIn: "1d" }
    );

    // Step 4: Respond with user data and token
    const { name, user_role: role, rank } = user;

    return ResponseHelper.success(200, MSG.LOGIN_SUCCESS, {
      user: { name, username, rank, user_role: role },
      token,
    });
  } catch (error) {
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};

exports.getProfile = async (req) => {
  try {
    const { name, username, email } = req.user;

    return ResponseHelper.success(200, MSG.FOUND_SUCCESS, {
      name,
      username,
      email,
    });
  } catch (error) {
    return ResponseHelper.error(404, MSG.USER_NOT_FOUND, error.message);
  }
};
