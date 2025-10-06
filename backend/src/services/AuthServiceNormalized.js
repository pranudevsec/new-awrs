const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const ResponseHelper = require("../utils/responseHelper");
const MSG = require("../utils/MSG");
const army2Db = require("../db/army2-connection");

// ============================================
// NORMALIZED AUTH SERVICE FOR ARMY-2 DATABASE
// ============================================

exports.register = async ({ rank, name, user_role, username, password, unit_id, cw2_type, is_special_unit, is_member, officer_id, is_officer, is_member_added }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pers_no = Math.floor(1000000 + Math.random() * 9000000).toString();

    // Check if user already exists
    const userExists = await army2Db.query(
      "SELECT * FROM User_tab WHERE username = $1",
      [username]
    );

    if (userExists.rows.length > 0) {
      return ResponseHelper.error(400, MSG.USER_ALREADY_EXISTS);
    }

    // Get or create role reference
    let roleId;
    const roleResult = await army2Db.query(
      "SELECT role_id FROM Role_Master WHERE role_name = $1",
      [user_role]
    );

    if (roleResult.rows.length > 0) {
      roleId = roleResult.rows[0].role_id;
    } else {
      // Create new role if it doesn't exist
      const newRoleResult = await army2Db.query(
        "INSERT INTO Role_Master (role_name) VALUES ($1) RETURNING role_id",
        [user_role]
      );
      roleId = newRoleResult.rows[0].role_id;
    }

    // Insert user with normalized structure
    const insertQuery = `
      INSERT INTO User_tab (
        pers_no, rank, name, username, password, unit_id, cw2_type, 
        is_special_unit, is_member, officer_id, is_officer, is_member_added, role_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING user_id, pers_no, rank, name, username, is_active, created_at, role_id
    `;

    const result = await army2Db.query(insertQuery, [
      pers_no,
      rank,
      name,
      username,
      hashedPassword,
      unit_id || null,
      cw2_type || null,
      is_special_unit || false,
      is_member || false,
      officer_id || null,
      is_officer || false,
      is_member_added || false,
      roleId
    ]);

    // Get role name for response
    const roleNameResult = await army2Db.query(
      "SELECT role_name FROM Role_Master WHERE role_id = $1",
      [roleId]
    );

    const userData = result.rows[0];
    userData.user_role = roleNameResult.rows[0].role_name;

    return ResponseHelper.success(201, MSG.REGISTER_SUCCESS, userData);
  } catch (error) {
    console.error("Registration error:", error);
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
    const userQuery = await army2Db.query(queryText, queryParams);

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
    console.error("Login error:", error);
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
    
    const result = await army2Db.query(query, [user_id]);
    
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
    console.error("Get profile error:", error);
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};

// ============================================
// HELPER FUNCTIONS FOR NORMALIZED STRUCTURE
// ============================================

// Get all available roles
exports.getRoles = async () => {
  try {
    const result = await army2Db.query(
      "SELECT role_id, role_name, role_code, is_active FROM Role_Master WHERE is_active = TRUE ORDER BY role_name"
    );
    
    return ResponseHelper.success(200, "Roles retrieved successfully", result.rows);
  } catch (error) {
    console.error("Get roles error:", error);
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};

// Get users by role
exports.getUsersByRole = async (role_name) => {
  try {
    const query = `
      SELECT u.*, rm.role_name 
      FROM User_tab u 
      LEFT JOIN Role_Master rm ON u.role_id = rm.role_id 
      WHERE rm.role_name = $1 AND u.is_active = TRUE
      ORDER BY u.name
    `;
    
    const result = await army2Db.query(query, [role_name]);
    
    return ResponseHelper.success(200, `Users with role ${role_name} retrieved successfully`, result.rows);
  } catch (error) {
    console.error("Get users by role error:", error);
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};

// Update user role
exports.updateUserRole = async (user_id, new_role_name) => {
  try {
    // Get role_id for new role
    const roleResult = await army2Db.query(
      "SELECT role_id FROM Role_Master WHERE role_name = $1",
      [new_role_name]
    );

    if (roleResult.rows.length === 0) {
      return ResponseHelper.error(404, "Role not found");
    }

    const roleId = roleResult.rows[0].role_id;

    // Update user role
    const updateResult = await army2Db.query(
      "UPDATE User_tab SET role_id = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *",
      [roleId, user_id]
    );

    if (updateResult.rows.length === 0) {
      return ResponseHelper.error(404, "User not found");
    }

    return ResponseHelper.success(200, "User role updated successfully", {
      user_id: updateResult.rows[0].user_id,
      new_role: new_role_name,
      role_id: roleId
    });
  } catch (error) {
    console.error("Update user role error:", error);
    return ResponseHelper.error(500, MSG.INTERNAL_SERVER_ERROR, error.message);
  }
};
