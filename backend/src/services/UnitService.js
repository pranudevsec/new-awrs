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

    const { memberUsername, memberPassword } = data;

    if (memberUsername && memberPassword) {
      const result = await createMemberUser(
        client,
        user,
        memberUsername,
        memberPassword
      );
      await client.query("COMMIT");
      return ResponseHelper.success(
        200,
        "Member user created successfully",
        result
      );
    }

    const currentUnitId = await getCurrentUnitId(client, userId);
    let unitResult;

    if (!currentUnitId) {
      unitResult = await createUnitAndLinkToUser(client, data, userId);
    } else {
      unitResult = await updateUnitDetails(client, currentUnitId, data);
    }

    await client.query("COMMIT");
    return ResponseHelper.success(
      200,
      "Unit processed successfully",
      unitResult
    );
  } catch (error) {
    await client.query("ROLLBACK");
    return ResponseHelper.error(
      500,
      "Failed to create or update unit",
      error.message
    );
  } finally {
    client.release();
  }
};

// START HELPER OF createOrUpdateUnitForUser
async function createMemberUser(client, user, username, password) {
  const existingUser = await client.query(
    "SELECT user_id FROM User_tab WHERE username = $1",
    [username]
  );
  if (existingUser.rows.length > 0) throw new Error("Username already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const res = await client.query(
    `INSERT INTO User_tab (
      pers_no, rank, name, user_role, username, password, officer_id, is_member
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id`,
    [
      user.pers_no,
      user.rank,
      user.name,
      user.user_role,
      username,
      hashedPassword,
      user.user_id,
      true,
    ]
  );

  await client.query(
    "UPDATE User_tab SET is_member_added = true WHERE user_id = $1",
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

async function createUnitAndLinkToUser(client, data, userId) {
  const {
    sos_no,
    name,
    adm_channel,
    tech_channel,
    bde,
    div,
    corps,
    comd,
    unit_type,
    matrix_unit,
    location,
    members = [],
    awards = [],
    start_month,
    start_year,
    end_month,
    end_year,
  } = data;

  const processedMembers = members.map((m) => ({
    id: m.id || randomUUID(),
    ...m,
  }));
  const processedAwards = awards.map((a) => ({
    award_id: a.award_id || randomUUID(),
    ...a,
  }));

  const res = await client.query(
    `INSERT INTO Unit_tab (
      sos_no, name, adm_channel, tech_channel, bde, div, corps, comd,
      unit_type, matrix_unit, location, members, awards,
      start_month, start_year, end_month, end_year
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) 
    RETURNING unit_id`,
    [
      sos_no,
      name,
      adm_channel,
      tech_channel,
      bde,
      div,
      corps,
      comd,
      unit_type,
      matrix_unit,
      location,
      JSON.stringify(processedMembers),
      JSON.stringify(processedAwards),
      start_month,
      start_year,
      end_month,
      end_year,
    ]
  );

  const newUnitId = res.rows[0].unit_id;
  await client.query("UPDATE User_tab SET unit_id = $1 WHERE user_id = $2", [
    newUnitId,
    userId,
  ]);

  return { unit_id: newUnitId };
}

async function updateUnitDetails(client, unitId, data) {
  const allowedFields = [
    "sos_no",
    "name",
    "adm_channel",
    "tech_channel",
    "bde",
    "div",
    "corps",
    "comd",
    "unit_type",
    "matrix_unit",
    "location",
    "start_month",
    "start_year",
    "end_month",
    "end_year",
  ];

  const updateFields = [];
  const values = [];
  let idx = 1;

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updateFields.push(`${field} = $${idx}`);
      values.push(data[field]);
      idx++;
    }
  });

  if (data.members) {
    const updatedMembers = await processMembersUpdate(
      client,
      unitId,
      data.members
    );
    updateFields.push(`members = $${idx}`);
    values.push(JSON.stringify(updatedMembers));
    idx++;
  }

  if (data.awards) {
    const updatedAwards = await processAwardsUpdate(
      client,
      unitId,
      data.awards
    );
    updateFields.push(`awards = $${idx}`);
    values.push(JSON.stringify(updatedAwards));
    idx++;
  }

  if (updateFields.length === 0)
    throw new Error("No valid fields provided for update");

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(unitId);

  const res = await client.query(
    `UPDATE Unit_tab SET ${updateFields.join(
      ", "
    )} WHERE unit_id = $${idx} RETURNING unit_id`,
    values
  );

  return { unit_id: res.rows[0].unit_id };
}

async function processMembersUpdate(client, unitId, incomingMembers) {
  const res = await client.query(
    "SELECT members FROM Unit_tab WHERE unit_id = $1",
    [unitId]
  );
  const existingMembers = res.rows[0]?.members || [];
  const updatedMembers = [...existingMembers];

  for (const member of incomingMembers) {
    const memberId = member.id || randomUUID();
    if (member.member_type === "presiding_officer") {
      const idx = updatedMembers.findIndex(
        (m) => m.member_type === "presiding_officer"
      );
      if (idx !== -1) {
        updatedMembers[idx] = {
          ...updatedMembers[idx],
          ...member,
          id: updatedMembers[idx].id || memberId,
        };
      } else {
        updatedMembers.push({ ...member, id: memberId });
      }
    } else {
      const idx = updatedMembers.findIndex((m) => m.id === member.id);
      if (idx !== -1) {
        updatedMembers[idx] = { ...updatedMembers[idx], ...member };
      } else {
        updatedMembers.push({ ...member, id: memberId });
      }
    }
  }
  return updatedMembers;
}

async function processAwardsUpdate(client, unitId, incomingAwards) {
  const res = await client.query(
    "SELECT awards FROM Unit_tab WHERE unit_id = $1",
    [unitId]
  );
  const existingAwards = res.rows[0]?.awards || [];

  const incomingAwardIds = new Set(
    incomingAwards.filter((a) => a.award_id).map((a) => a.award_id)
  );
  let updatedAwards = existingAwards.filter(
    (a) => a.award_id && incomingAwardIds.has(a.award_id)
  );

  for (const award of incomingAwards) {
    const awardId = award.award_id || randomUUID();
    const idx = updatedAwards.findIndex((a) => a.award_id === award.award_id);
    if (idx !== -1) {
      updatedAwards[idx] = { ...updatedAwards[idx], ...award };
    } else {
      updatedAwards.push({ ...award, award_id: awardId });
    }
  }
  return updatedAwards;
}
// END HELPER OF createOrUpdateUnitForUser
