const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const ResponseHelper = require("../utils/responseHelper");
const MSG = require("../utils/MSG");
const db = require("../db/postgres-connection");

exports.register = async ({ rank, name, user_role, username, password }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const pers_no = Math.floor(1000000 + Math.random() * 9000000).toString();

    const userExists = await db.query(
      "SELECT * FROM User_tab WHERE username = $1",
      [username]
    );

    if (userExists.rows.length > 0) {
      return ResponseHelper.error(400, MSG.USER_ALREADY_EXISTS);
    }

    const insertQuery = `
      INSERT INTO User_tab (pers_no, rank, name, user_role, username, password)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, pers_no, rank, name, user_role, username, is_active, created_at
    `;

    const result = await db.query(insertQuery, [
      pers_no,
      rank,
      name,
      user_role,
      username,
      hashedPassword
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

exports.getProfile = async ({ user_id }) => {
  try {
    const userId = user_id;

    const result = await db.query(
      `
      SELECT 
        u.user_id, u.name AS user_name, u.username, u.pers_no, u.rank, u.user_role, u.cw2_type,
        u.unit_id,
        ut.sos_no, ut.name AS unit_name, ut.adm_channel, ut.tech_channel, ut.bde, ut.div, ut.corps, ut.comd,
        ut.unit_type, ut.matrix_unit, ut.location,
        ut.goc_award, ut.coas_award, ut.goc_award_year, ut.coas_award_year
      FROM User_tab u
      LEFT JOIN Unit_tab ut ON u.unit_id = ut.unit_id
      WHERE u.user_id = $1
      `,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return ResponseHelper.error(404, MSG.USER_NOT_FOUND);
    }

    const user = result.rows[0];

    return ResponseHelper.success(200, MSG.FOUND_SUCCESS, {
      user: {
        user_id: user.user_id,
        name: user.user_name,
        username: user.username,
        pers_no: user.pers_no,
        rank: user.rank,
        user_role: user.user_role,
        cw2_type: user.cw2_type,
      },
      unit: user.unit_id
        ? {
            unit_id: user.unit_id,
            sos_no: user.sos_no,
            name: user.unit_name,
            adm_channel: user.adm_channel,
            tech_channel: user.tech_channel,
            bde: user.bde,
            div: user.div,
            corps: user.corps,
            comd: user.comd,
            unit_type: user.unit_type,
            matrix_unit: user.matrix_unit,
            location: user.location,
            goc_award: user.goc_award,
            coas_award: user.coas_award,
            goc_award_year: user.goc_award_year,
            coas_award_year: user.coas_award_year,
          }
        : null,
    });
  } catch (error) {
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};
