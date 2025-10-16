const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

exports.createUnit = async (data) => {
  const client = await dbService.getClient();
  try {
    const { sos_no, name, adm_channel, tech_channel, bde, div, corps, comd } =
      data;

    const result = await client.query(
      `INSERT INTO Unit_tab (sos_no, name, adm_channel, tech_channel, bde, div, corps, comd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [sos_no, name, adm_channel, tech_channel, bde, div, corps, comd]
    );

    return ResponseHelper.success(
      201,
      "Unit created successfully",
      result.rows[0]
    );
  } finally {
    client.release();
  }
};

exports.getAllUnits = async () => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "SELECT * FROM Unit_tab ORDER BY unit_id DESC"
    );
    return ResponseHelper.success(200, "Fetched all units", result.rows);
  } finally {
    client.release();
  }
};

exports.getUnitById = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "SELECT * FROM Unit_tab WHERE unit_id = $1",
      [id]
    );

    return result.rows[0]
      ? ResponseHelper.success(200, "Unit found", result.rows[0])
      : ResponseHelper.error(404, "Unit not found");
  } finally {
    client.release();
  }
};

exports.updateUnit = async (id, data) => {
  const client = await dbService.getClient();
  try {
    const allowedFields = [
      "sos_no",
      "name",
      "adm_channel",
      "tech_channel",
      "bde",
      "div",
      "corps",
      "comd",
    ];
    const keys = Object.keys(data).filter((key) => allowedFields.includes(key));

    if (keys.length === 0) {
      return ResponseHelper.error(400, "No valid fields to update");
    }

    const values = keys.map((key) => data[key]);
    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");

    const result = await client.query(
      `UPDATE Unit_tab SET ${setClause} WHERE unit_id = $${
        keys.length + 1
      } RETURNING *`,
      [...values, id]
    );

    return result.rows[0]
      ? ResponseHelper.success(200, "Unit updated", result.rows[0])
      : ResponseHelper.error(404, "Unit not found");
  } finally {
    client.release();
  }
};

exports.deleteUnit = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "DELETE FROM Unit_tab WHERE unit_id = $1 RETURNING *",
      [id]
    );

    return result.rows[0]
      ? ResponseHelper.success(200, "Unit deleted successfully")
      : ResponseHelper.error(404, "Unit not found");
  } finally {
    client.release();
  }
};

exports.createOrUpdateUnitForUser = async (userId, data, user) => {
  const client = await dbService.getClient();
  try {
    await client.query("BEGIN");

    const {
      name,
      adm_channel,
      tech_channel,
      unit_type,
      matrix_unit,
      location,
      awards,
      start_month,
      start_year,
      end_month,
      end_year,
      bde,
      div,
      corps,
      comd,
      memberUsername,
      memberPassword,
      members,
    } = data;

    // Early branch: create member user
    if (memberUsername && memberPassword) {
      const memberResult = await createMemberUser(client, user, memberUsername, memberPassword);
      await client.query("COMMIT");
      return ResponseHelper.success(200, "Member user created successfully", memberResult);
    }

    // Resolve FK ids
    const { brigade_id, division_id, corps_id, command_id } = await resolveForeignKeyIds(client, { bde, div, corps, comd });

    // Insert or update unit
    const currentUnitId = await getCurrentUnitId(client, userId);
    const values = buildUnitValues({
      name,
      adm_channel,
      tech_channel,
      unit_type,
      matrix_unit,
      location,
      awards,
      start_month,
      start_year,
      end_month,
      end_year,
      brigade_id,
      division_id,
      corps_id,
      command_id,
    });

    const unitResult = await upsertUnit(client, currentUnitId, values, userId);

    // Handle members if provided
    if (Array.isArray(members) && members.length > 0) {
      const validMembers = filterValidMembers(members);
      if (members.length > 0 && validMembers.length === 0) {
        throw new Error(
          `All member data is incomplete. All fields (Name, Rank, IC Number, Appointment) are required and cannot be blank.`
        );
      }

      if (validMembers.length === 0) {
        return ResponseHelper.success(200, "Unit profile updated successfully", { unit: unitResult, members: [] });
      }

      await upsertMembers(client, unitResult.unit_id, validMembers);
    }

    await client.query("COMMIT");
    return ResponseHelper.success(200, "Unit processed successfully", unitResult);
  } catch (error) {
    await client.query("ROLLBACK");
    return ResponseHelper.error(500, "Failed to create or update unit", error.message);
  } finally {
    client.release();
  }
};

async function getRoleId(client, roleCode) {
  const res = await client.query(
    `SELECT role_id FROM role_master WHERE role_name = $1 LIMIT 1`,
    [roleCode]
  );
  if (res.rows.length === 0) throw new Error(`Role ${roleCode} not found`);
  return res.rows[0].role_id;
}

async function createMemberUser(client, user, username, password) {
  const existingUser = await client.query(
    "SELECT user_id FROM user_tab WHERE username = $1",
    [username]
  );
  if (existingUser.rows.length > 0) throw new Error("Username already exists");

  const hashedPassword = await bcrypt.hash(password, 10);


  const memberRoleId = await getRoleId(client, user.user_role); 

  const res = await client.query(
    `INSERT INTO user_tab (
      pers_no, rank, name, role_id, username, password, officer_id, is_member
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id`,
    [
      user.pers_no,
      user.rank,
      user.name,
      memberRoleId,
      username,
      hashedPassword,
      user.user_id,
      true,
    ]
  );

  await client.query(
    "UPDATE user_tab SET is_member_added = true WHERE user_id = $1",
    [user.user_id]
  );

  return { newUserId: res.rows[0].user_id };
}

async function getCurrentUnitId(client, userId) {
  const res = await client.query(
    "SELECT unit_id FROM User_tab WHERE user_id = $1",
    [userId]
  );
  if (res.rows.length === 0) throw new Error("User not found");
  return res.rows[0].unit_id;
}

// --------------- Helper functions (extracted to reduce complexity) ---------------
async function getOrCreateId(client, table, column, value, idCol) {
  if (!value) return null;
  const selectRes = await client.query(
    `SELECT ${idCol} FROM ${table} WHERE ${column} = $1 LIMIT 1`,
    [value]
  );
  if (selectRes.rows.length) return selectRes.rows[0][idCol];
  const insertRes = await client.query(
    `INSERT INTO ${table} (${column}) VALUES ($1) RETURNING ${idCol}`,
    [value]
  );
  return insertRes.rows[0][idCol];
}

async function resolveForeignKeyIds(client, { bde, div, corps, comd }) {
  const [brigade_id, division_id, corps_id] = await Promise.all([
    getOrCreateId(client, "brigade_master", "brigade_name", bde, "brigade_id"),
    getOrCreateId(client, "division_master", "division_name", div, "division_id"),
    getOrCreateId(client, "corps_master", "corps_name", corps, "corps_id"),
  ]);

  let command_id = null;
  if (comd) {
    const res = await client.query(
      `SELECT command_id FROM command_master WHERE command_name = $1 LIMIT 1`,
      [comd]
    );
    if (res.rows.length) command_id = res.rows[0].command_id;
  }

  return { brigade_id, division_id, corps_id, command_id };
}

function buildUnitValues(fields) {
  const {
    name,
    adm_channel,
    tech_channel,
    unit_type,
    matrix_unit,
    location,
    awards,
    start_month,
    start_year,
    end_month,
    end_year,
    brigade_id,
    division_id,
    corps_id,
    command_id,
  } = fields;

  return [
    name,
    adm_channel || "",
    tech_channel || "",
    unit_type || "",
    Array.isArray(matrix_unit) ? JSON.stringify(matrix_unit) : matrix_unit,
    location || "",
    Array.isArray(awards) ? JSON.stringify(awards) : "[]",
    start_month || "",
    start_year || "",
    end_month || "",
    end_year || "",
    brigade_id,
    division_id,
    corps_id,
    command_id,
  ];
}

async function upsertUnit(client, currentUnitId, values, userId) {
  if (!currentUnitId) {
    const insertQuery = `
      INSERT INTO unit_tab 
        (name, adm_channel, tech_channel, unit_type, matrix_unit, location, awards,
         start_month, start_year, end_month, end_year,
         brigade_id, division_id, corps_id, command_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
    `;
    const res = await client.query(insertQuery, values);
    const unit = res.rows[0];
    await client.query(`UPDATE user_tab SET unit_id = $1 WHERE user_id = $2`, [unit.unit_id, userId]);
    return unit;
  }

  const updateQuery = `
    UPDATE unit_tab
    SET 
      name = $1,
      adm_channel = $2,
      tech_channel = $3,
      unit_type = $4,
      matrix_unit = $5,
      location = $6,
      awards = $7,
      start_month = $8,
      start_year = $9,
      end_month = $10,
      end_year = $11,
      brigade_id = $12,
      division_id = $13,
      corps_id = $14,
      command_id = $15
    WHERE unit_id = $16
    RETURNING *
  `;
  const res = await client.query(updateQuery, [...values, currentUnitId]);
  if (res.rowCount === 0) {
    // The user has a unit_id pointing to a non-existent unit. Create a new one and re-link.
    const insertQuery = `
      INSERT INTO unit_tab 
        (name, adm_channel, tech_channel, unit_type, matrix_unit, location, awards,
         start_month, start_year, end_month, end_year,
         brigade_id, division_id, corps_id, command_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
    `;
    const ins = await client.query(insertQuery, values);
    const unit = ins.rows[0];
    await client.query(`UPDATE user_tab SET unit_id = $1 WHERE user_id = $2`, [unit.unit_id, userId]);
    return unit;
  }
  return res.rows[0];
}

function filterValidMembers(members) {
  return members.filter((m) =>
    m.name && m.name.trim() !== "" &&
    m.rank && m.rank.trim() !== "" &&
    m.ic_number && m.ic_number.trim() !== "" &&
    m.appointment && m.appointment.trim() !== ""
  );
}

async function upsertMembers(client, unitId, members) {
  for (const m of members) {
    if (!(m.name && m.rank && m.ic_number && m.appointment)) {
      throw new Error(
        `Member data is incomplete. All fields (Name, Rank, IC Number, Appointment) are required and cannot be blank.`
      );
    }
    if (m.ic_number && !/^IC-\d{5}[A-Z]$/.test(m.ic_number)) {
      throw new Error(
        `Invalid IC number format: ${m.ic_number}. Must be in format IC-XXXXX[A-Z] where XXXXX are 5 digits and last character is any alphabet.`
      );
    }

    if (m.id) {
      await client.query(
        `UPDATE unit_members
         SET name=$1, rank=$2, ic_number=$3, appointment=$4, member_order=$5, updated_at=CURRENT_TIMESTAMP
         WHERE member_id=$6 AND unit_id=$7 AND member_type=$8`,
        [
          m.name.trim(),
          m.rank.trim(),
          m.ic_number.trim(),
          m.appointment.trim(),
          m.member_order || "",
          m.id,
          unitId,
          m.member_type,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO unit_members
          (unit_id, name, rank, ic_number, appointment, member_type, member_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          unitId,
          m.name.trim(),
          m.rank.trim(),
          m.ic_number.trim(),
          m.appointment.trim(),
          m.member_type,
          m.member_order || "",
        ]
      );
    }
  }
}

