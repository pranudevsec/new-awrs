const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const { randomUUID } = require('crypto');

exports.createUnit = async (data) => {
  const client = await dbService.getClient();
  try {
    const { sos_no, name, adm_channel, tech_channel, bde, div, corps, comd } = data;

    const result = await client.query(
      `INSERT INTO Unit_tab (sos_no, name, adm_channel, tech_channel, bde, div, corps, comd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [sos_no, name, adm_channel, tech_channel, bde, div, corps, comd]
    );

    return ResponseHelper.success(201, "Unit created successfully", result.rows[0]);
  } finally {
    client.release();
  }
};

exports.getAllUnits = async () => {
  const client = await dbService.getClient();
  try {
    const result = await client.query("SELECT * FROM Unit_tab ORDER BY unit_id DESC");
    return ResponseHelper.success(200, "Fetched all units", result.rows);
  } finally {
    client.release();
  }
};

exports.getUnitById = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query("SELECT * FROM Unit_tab WHERE unit_id = $1", [id]);

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
    const allowedFields = ["sos_no", "name", "adm_channel", "tech_channel", "bde", "div", "corps", "comd"];
    const keys = Object.keys(data).filter((key) => allowedFields.includes(key));

    if (keys.length === 0) {
      return ResponseHelper.error(400, "No valid fields to update");
    }

    const values = keys.map((key) => data[key]);
    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");

    const result = await client.query(
      `UPDATE Unit_tab SET ${setClause} WHERE unit_id = $${keys.length + 1} RETURNING *`,
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
    const result = await client.query("DELETE FROM Unit_tab WHERE unit_id = $1 RETURNING *", [id]);

    return result.rows[0]
      ? ResponseHelper.success(200, "Unit deleted successfully")
      : ResponseHelper.error(404, "Unit not found");
  } finally {
    client.release();
  }
};

exports.createOrUpdateUnitForUser = async (userId, data) => {
  const client = await dbService.getClient();

  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT unit_id FROM User_tab WHERE user_id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      throw new Error("User not found");
    }

    const currentUnitId = userRes.rows[0].unit_id;
    let unitResult;

    if (!currentUnitId) {
      const {
        sos_no, name, adm_channel, tech_channel, bde, div, corps, comd,
        unit_type, matrix_unit, location,
        members = [],
        awards = []
    } = data;

      const processedMembers = members.map(member => ({
        id: member.id || randomUUID(),
        ...member
      }));
      const processedAwards = awards.map(award => ({
        award_id: award.award_id || randomUUID(),
        ...award
    }));
      const insertUnitQuery = `
      INSERT INTO Unit_tab (
          sos_no, name, adm_channel, tech_channel, bde, div, corps, comd,
          unit_type, matrix_unit, location,
          members, awards
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING unit_id
  `;
  
  const insertRes = await client.query(insertUnitQuery, [
      sos_no, name, adm_channel, tech_channel, bde, div, corps, comd,
      unit_type, matrix_unit, location,
      JSON.stringify(processedMembers),
      JSON.stringify(processedAwards)
  ]);

      const newUnitId = insertRes.rows[0].unit_id;

      await client.query(
        'UPDATE User_tab SET unit_id = $1 WHERE user_id = $2',
        [newUnitId, userId]
      );

      unitResult = insertRes.rows[0];

    } else {
      const allowedFields = [
        "sos_no", "name", "adm_channel", "tech_channel", "bde", "div", "corps",
        "comd", "unit_type", "matrix_unit", "location"
    ];

      const updateFields = [];
      const values = [];
      let index = 1;

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateFields.push(`${field} = $${index}`);
          values.push(data[field]);
          index++;
        }
      }

      if (data.members && Array.isArray(data.members)) {
        const currentMembersRes = await client.query(
          'SELECT members FROM Unit_tab WHERE unit_id = $1',
          [currentUnitId]
        );
        const existingMembers = currentMembersRes.rows[0].members || [];

        let updatedMembers = [...existingMembers];

        for (const member of data.members) {
          if (member.member_type === 'presiding_officer') {
            const existingIndex = updatedMembers.findIndex(m => m.member_type === 'presiding_officer');

            if (existingIndex !== -1) {
              updatedMembers[existingIndex] = {
                ...updatedMembers[existingIndex],
                ...member,
                id: updatedMembers[existingIndex].id || member.id || randomUUID(),
              };
            } else {
              updatedMembers.push({
                id: member.id || randomUUID(),
                ...member
              });
            }
          } else {
            if (member.id) {
              const existingIndex = updatedMembers.findIndex(m => m.id === member.id);
              if (existingIndex !== -1) {
                updatedMembers[existingIndex] = {
                  ...updatedMembers[existingIndex],
                  ...member
                };
              } else {
                updatedMembers.push({
                  id: member.id,
                  ...member
                });
              }
            } else {
              updatedMembers.push({
                id: randomUUID(),
                ...member
              });
            }
          }
        }

        updateFields.push(`members = $${index}`);
        values.push(JSON.stringify(updatedMembers));
        index++;
      }
      if (data.awards && Array.isArray(data.awards)) {
        const currentAwardsRes = await client.query(
            'SELECT awards FROM Unit_tab WHERE unit_id = $1',
            [currentUnitId]
        );
        const existingAwards = currentAwardsRes.rows[0].awards || [];
    
        // Create a map of incoming award_ids
        const incomingAwardIds = new Set(
            data.awards
                .filter(a => a.award_id)
                .map(a => a.award_id)
        );
    
        // Filter out awards in DB that are not present in incoming data (remove them)
        let updatedAwards = existingAwards.filter(
            a => a.award_id && incomingAwardIds.has(a.award_id)
        );
    
        for (const award of data.awards) {
            if (award.award_id) {
                const existingIndex = updatedAwards.findIndex(a => a.award_id === award.award_id);
                if (existingIndex !== -1) {
                    updatedAwards[existingIndex] = {
                        ...updatedAwards[existingIndex],
                        ...award
                    };
                } else {
                    // Edge case: award_id provided but not in DB, add it
                    updatedAwards.push({
                        award_id: award.award_id,
                        ...award
                    });
                }
            } else {
                updatedAwards.push({
                    award_id: randomUUID(),
                    ...award
                });
            }
        }
    
        updateFields.push(`awards = $${index}`);
        values.push(JSON.stringify(updatedAwards));
        index++;
    }
    
    
      if (updateFields.length === 0) {
        throw new Error("No valid fields provided for update");
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const updateQuery = `
        UPDATE Unit_tab
        SET ${updateFields.join(", ")}
        WHERE unit_id = $${index}
        RETURNING unit_id
      `;

      values.push(currentUnitId);

      const updateRes = await client.query(updateQuery, values);
      unitResult = updateRes.rows[0];
    }

    await client.query('COMMIT');
    return ResponseHelper.success(200, "Unit processed successfully", unitResult);

  } catch (error) {
    await client.query('ROLLBACK');
    return ResponseHelper.error(500, "Failed to create or update unit", error.message);
  } finally {
    client.release();
  }
};
