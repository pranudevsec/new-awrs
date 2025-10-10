const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const ResponseHelper = require("../utils/responseHelper");
const MSG = require("../utils/MSG");
// Using army-2 database connection for normalized structure
const db = require("../db/army2-connection");

exports.register = async ({ rank, name, user_role, username, password }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pers_no = Math.floor(1000000 + Math.random() * 9000000).toString();

    //  Handle cw2_* roles
    let cw2_type = null;
    if (user_role && user_role.startsWith("cw2_")) {
      cw2_type = user_role.split("_")[1];
      user_role = "cw2";
    }

    // Check if username exists
    const userExists = await db.query(
      "SELECT * FROM User_tab WHERE username = $1",
      [username]
    );
    if (userExists.rows.length > 0) {
      return ResponseHelper.error(400, MSG.USER_ALREADY_EXISTS);
    }

    // Get or create Role_Master entry
    let roleId;
    const roleResult = await db.query(
      "SELECT role_id FROM Role_Master WHERE role_name = $1",
      [user_role]
    );

    if (roleResult.rows.length > 0) {
      roleId = roleResult.rows[0].role_id;
    } else {
      const newRoleResult = await db.query(
        "INSERT INTO Role_Master (role_name) VALUES ($1) RETURNING role_id",
        [user_role]
      );
      roleId = newRoleResult.rows[0].role_id;
    }

    //  Insert user
    const insertQuery = `
      INSERT INTO User_tab (pers_no, rank, name, username, password, role_id, cw2_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id, pers_no, rank, name, username, is_active, created_at, role_id, cw2_type
    `;

    const result = await db.query(insertQuery, [
      pers_no,
      rank,
      name,
      username,
      hashedPassword,
      roleId,
      cw2_type,
    ]);

    const userData = result.rows[0];
    const userId = userData.user_id;

    //  Role-specific inserts
    if (user_role === "unit") {
      await db.query(
        `INSERT INTO Unit_tab (name, unit_type, sos_no, location)
         VALUES ($1, $2, $3, $4)`,
        [name, "Regular", pers_no, "Not Specified"]
      );
    } else if (user_role === "brigade") {
      await db.query(
        `INSERT INTO Brigade_Master (brigade_name, brigade_code)
         VALUES ($1, $2)`,
        [name, pers_no.substring(0, 10)]
      );
    } else if (user_role === "division") {
      await db.query(
        `INSERT INTO Division_Master (division_name, division_code)
         VALUES ($1, $2)`,
        [name, pers_no.substring(0, 10)]
      );
    } else if (user_role === "corps") {
      await db.query(
        `INSERT INTO Corps_Master (corps_name, corps_code)
         VALUES ($1, $2)`,
        [name, pers_no.substring(0, 10)]
      );
    } else if (user_role === "command") {
      await db.query(
        `INSERT INTO Command_Master (command_name, command_code)
         VALUES ($1, $2)`,
        [name, pers_no.substring(0, 10)]
      );
    }

    //  Add role name to response
    const roleNameResult = await db.query(
      "SELECT role_name FROM Role_Master WHERE role_id = $1",
      [roleId]
    );

    userData.user_role = roleNameResult.rows[0].role_name;
    userData.cw2_type = cw2_type;

    return ResponseHelper.success(201, MSG.REGISTER_SUCCESS, userData);
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

    // Build query with role reference
    let queryText = `
      SELECT u.*, rm.role_name 
      FROM User_tab u 
      LEFT JOIN Role_Master rm ON u.role_id = rm.role_id 
      WHERE rm.role_name = $1 AND u.username = $2
    `;
    let queryParams = [user_role, username];

    // Handle special_unit case
    if (user_role === "special_unit") {
      user_role = "unit";
      queryText += " AND u.is_special_unit = TRUE";
      queryParams = [user_role, username];
    }

    // Handle member case
    if (is_member === true) {
      queryText += " AND u.is_member = TRUE";
    }

    // Find user with role information
    const userQuery = await db.query(queryText, queryParams);

    if (userQuery.rows.length === 0) {
      return ResponseHelper.error(404, MSG.USER_NOT_FOUND);
    }

    const user = userQuery.rows[0];

    // Double-check member status
    if (is_member === true && user.is_member !== true) {
      return ResponseHelper.error(401, "Unauthorized: User is not a member");
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ResponseHelper.error(401, MSG.INVALID_CREDENTIALS);
    }

    // Generate JWT with role information
    const token = jwt.sign(
      {
        id: user.user_id,
        username: user.username,
        user_role: user.role_name,
        role_id: user.role_id,
      },
      config.jwtSecret,
      { expiresIn: "1d" }
    );

    // Return user data with role information
    return ResponseHelper.success(200, MSG.LOGIN_SUCCESS, {
      user: {
        name: user.name,
        username: user.username,
        rank: user.rank,
        user_role: user.role_name,
        role_id: user.role_id,
        unit_id: user.unit_id,
        is_special_unit: user.is_special_unit,
        is_member: user.is_member,
        is_officer: user.is_officer,
      },
      token,
    });
  } catch (error) {
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};
exports.getProfile = async ({ user_id }) => {
  try {
    // Step 1: Fetch user details
    const userResult = await db.query(
      `
      SELECT 
        u.user_id, u.name AS user_name, u.username, u.pers_no, u.rank, u.cw2_type,
        u.unit_id, u.is_special_unit, u.is_officer, u.is_member, u.is_member_added,
        u.officer_id,
        rm.role_name AS user_role
      FROM User_tab u
      LEFT JOIN role_master rm ON u.role_id = rm.role_id
      WHERE u.user_id = $1
      `,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return ResponseHelper.error(404, "User not found");
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
          u.unit_id, u.sos_no, u.name, u.adm_channel, u.tech_channel, 
          b.brigade_name AS bde, d.division_name AS div, c.corps_name AS corps, cm.command_name AS comd,
          u.unit_type, u.matrix_unit, u.location, u.awards,
          u.start_month, u.start_year, u.end_month, u.end_year
        FROM Unit_tab u
        LEFT JOIN brigade_master b ON u.brigade_id = b.brigade_id
        LEFT JOIN division_master d ON u.division_id = d.division_id
        LEFT JOIN corps_master c ON u.corps_id = c.corps_id
        LEFT JOIN command_master cm ON u.command_id = cm.command_id
        WHERE u.unit_id = $1
        `,
        [effectiveUnitId]
      );

      if (unitResult.rows.length > 0) {
        const unit = unitResult.rows[0];

        // Fetch members from Unit_Members table
        const membersResult = await db.query(
          `
          SELECT member_id AS id, name, rank, ic_number, appointment, member_type, member_order
          FROM Unit_Members
          WHERE unit_id = $1
          ORDER BY member_order ASC NULLS LAST, name ASC
          `,
          [unit.unit_id]
        );

        const members = membersResult.rows.map((m) => ({
          id: m.id,
          name: m.name || "",
          rank: m.rank || "",
          ic_number: m.ic_number || "",
          appointment: m.appointment || "",
          member_type: m.member_type || "",
          member_order:
            m.member_order !== null ? m.member_order.toString() : "",
        }));

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
          awards: unit.awards || [],
          members,
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
    return ResponseHelper.success(200, "Successfully found.", {
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
    return ResponseHelper.error(500, "Internal server error", error.message);
  }
};
