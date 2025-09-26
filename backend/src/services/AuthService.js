const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const ResponseHelper = require("../utils/responseHelper");
const MSG = require("../utils/MSG");
const db = require("../db/postgres-connection");
const pool = require("../db/postgres-connection");

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

    let { user_role, username, password, is_member } = credentials;

    let queryText = "SELECT * FROM User_tab WHERE user_role = $1 AND username = $2";
    let queryParams = [user_role, username];

    // 🚩 If user_role is 'special_unit', treat as 'unit' but check is_special_unit
    if (user_role === "special_unit") {
      user_role = "unit";
      queryText += " AND is_special_unit = TRUE";
      queryParams = [user_role, username];
    }

    // 🚩 If is_member is true, enforce is_member = TRUE
    if (is_member === true) {
      queryText += " AND is_member = TRUE";
    }

    // Step 1: Find user
    const userQuery = await db.query(queryText, queryParams);

    if (userQuery.rows.length === 0) {
      return ResponseHelper.error(404, MSG.USER_NOT_FOUND);
    }

    const user = userQuery.rows[0];

    // 🚩 Double-check: If is_member is true but user.is_member is false, reject
    if (is_member === true && user.is_member !== true) {
      return ResponseHelper.error(401, "Unauthorized: User is not a member");
    }

    // Step 2: Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ResponseHelper.error(401, MSG.INVALID_CREDENTIALS);
    }

    // Step 3: Generate JWT
    const token = jwt.sign(
      { id: user.user_id, username: user.username, user_role: user.user_role },
      config.jwtSecret,
      { expiresIn: "1d" }
    );

    // Step 4: Respond
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

    // Step 1: Fetch user details
    const userResult = await db.query(
      `
      SELECT 
        u.user_id, u.name AS user_name, u.username, u.pers_no, u.rank, u.user_role, u.cw2_type,
        u.unit_id, u.is_special_unit,
        u.is_officer,
        u.is_member,
        u.is_member_added, 
        u.officer_id
      FROM User_tab u
      WHERE u.user_id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return ResponseHelper.error(404, MSG.USER_NOT_FOUND);
    }

    const user = userResult.rows[0];

    let unitData = null;

    // Step 2: Determine correct unit_id for fetching unit data
    let effectiveUnitId = user.unit_id;

    if (!effectiveUnitId && user.is_member && user.officer_id) {
      const officerResult = await db.query(
        `SELECT unit_id FROM User_tab WHERE user_id = $1`,
        [user.officer_id]
      );
      if (officerResult.rows.length > 0) {
        effectiveUnitId = officerResult.rows[0].unit_id;
      }
    }

    // Step 3: Fetch unit details if unit_id found
    if (effectiveUnitId) {
      const unitResult = await db.query(
        `
        SELECT 
          unit_id, sos_no, name, adm_channel, tech_channel, bde, div, corps, comd,
          unit_type, matrix_unit, location, awards, members,start_month,
    start_year,
    end_month,
    end_year
        FROM Unit_tab
        WHERE unit_id = $1
        `,
        [effectiveUnitId]
      );

      if (unitResult.rows.length > 0) {
        const unit = unitResult.rows[0];
        unitData = {
          unit_id: unit.unit_id,
          sos_no: unit.sos_no,
          name: unit.name,
          adm_channel: unit.adm_channel,
          tech_channel: unit.tech_channel,
          bde: unit.bde,
          div: unit.div,
          corps: unit.corps,
          comd: unit.comd,
          unit_type: unit.unit_type,
          matrix_unit: unit.matrix_unit,
          location: unit.location,
          awards: unit.awards,
          members: unit.members,
          start_month: unit.start_month,
          start_year: unit.start_year,
          end_month: unit.end_month,
          end_year: unit.end_year,
        };
      }
    }

    // Step 4: Fetch registered member's username if is_member_added is true
    let memberUsername = null;
    if (user.is_member_added) {
      const memberResult = await db.query(
        `SELECT username FROM User_tab WHERE officer_id = $1 LIMIT 1`,
        [user.user_id]
      );
      if (memberResult.rows.length > 0) {
        memberUsername = memberResult.rows[0].username;
      }
    }

    // Step 5: Return structured response
    return ResponseHelper.success(200, MSG.FOUND_SUCCESS, {
      user: {
        user_id: user.user_id,
        name: user.user_name,
        username: user.username,
        pers_no: user.pers_no,
        rank: user.rank,
        user_role: user.user_role,
        cw2_type: user.cw2_type,
        is_special_unit: user.is_special_unit,
        is_officer: user.is_officer,
        is_member: user.is_member,
        is_member_added: user.is_member_added,
        member_username: memberUsername,
      },
      unit: unitData,
    });
  } catch (error) {
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};
