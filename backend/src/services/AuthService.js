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

    const userExists = await db.query(
      "SELECT * FROM User_tab WHERE username = $1",
      [username]
    );

    if (userExists.rows.length > 0) {
      return ResponseHelper.error(400, MSG.USER_ALREADY_EXISTS);
    }

    // Get or create role reference
    let roleId;
    const roleResult = await db.query(
      "SELECT role_id FROM Role_Master WHERE role_name = $1",
      [user_role]
    );

    if (roleResult.rows.length > 0) {
      roleId = roleResult.rows[0].role_id;
    } else {
      // Create new role if it doesn't exist
      const newRoleResult = await db.query(
        "INSERT INTO Role_Master (role_name) VALUES ($1) RETURNING role_id",
        [user_role]
      );
      roleId = newRoleResult.rows[0].role_id;
    }

    const insertQuery = `
      INSERT INTO User_tab (pers_no, rank, name, username, password, role_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, pers_no, rank, name, username, is_active, created_at, role_id
    `;

    const result = await db.query(insertQuery, [
      pers_no,
      rank,
      name,
      username,
      hashedPassword,
      roleId
    ]);

    const userData = result.rows[0];
    const userId = userData.user_id;

    // Create entry in role-specific tables based on user_role
    if (user_role === 'unit') {
      // Create entry in Unit_tab
      await db.query(`
        INSERT INTO Unit_tab (name, unit_type, sos_no, location)
        VALUES ($1, $2, $3, $4)
      `, [
        name, // name
        'Regular', // unit_type
        pers_no, // sos_no (using pers_no as sos_no)
        'Not Specified' // location
      ]);
    } else if (user_role === 'brigade') {
      // Create entry in Brigade_Master
      await db.query(`
        INSERT INTO Brigade_Master (brigade_name, brigade_code)
        VALUES ($1, $2)
      `, [
        name, // brigade_name
        pers_no.substring(0, 10) // brigade_code (truncated to 10 chars)
      ]);
    } else if (user_role === 'division') {
      // Create entry in Division_Master
      await db.query(`
        INSERT INTO Division_Master (division_name, division_code)
        VALUES ($1, $2)
      `, [
        name, // division_name
        pers_no.substring(0, 10) // division_code (truncated to 10 chars)
      ]);
    } else if (user_role === 'corps') {
      // Create entry in Corps_Master
      await db.query(`
        INSERT INTO Corps_Master (corps_name, corps_code)
        VALUES ($1, $2)
      `, [
        name, // corps_name
        pers_no.substring(0, 10) // corps_code (truncated to 10 chars)
      ]);
    } else if (user_role === 'command') {
      // Create entry in Command_Master
      await db.query(`
        INSERT INTO Command_Master (command_name, command_code)
        VALUES ($1, $2)
      `, [
        name, // command_name
        pers_no.substring(0, 10) // command_code (truncated to 10 chars)
      ]);
    }

    // Get role name for response
    const roleNameResult = await db.query(
      "SELECT role_name FROM Role_Master WHERE role_id = $1",
      [roleId]
    );

    userData.user_role = roleNameResult.rows[0].role_name;

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
        role_id: user.role_id
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
        is_officer: user.is_officer
      },
      token,
    });
  } catch (error) {
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};

exports.getProfile = async ({ user_id }) => {
  try {
    const query = `
      SELECT u.*, rm.role_name 
      FROM User_tab u 
      LEFT JOIN Role_Master rm ON u.role_id = rm.role_id 
      WHERE u.user_id = $1
    `;
    
    const result = await db.query(query, [user_id]);
    
    if (result.rows.length === 0) {
      return ResponseHelper.error(404, "User not found");
    }

    const user = result.rows[0];
    
    // Return profile with role information
    return ResponseHelper.success(200, "Profile retrieved successfully", {
      user_id: user.user_id,
      pers_no: user.pers_no,
      rank: user.rank,
      name: user.name,
      username: user.username,
      user_role: user.role_name,
      role_id: user.role_id,
      unit_id: user.unit_id,
      cw2_type: user.cw2_type,
      is_special_unit: user.is_special_unit,
      is_member: user.is_member,
      is_officer: user.is_officer,
      is_member_added: user.is_member_added,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error) {
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};