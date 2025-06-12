const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");

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
      } = data;

      const insertUnitQuery = `
        INSERT INTO Unit_tab (
          sos_no, name, adm_channel, tech_channel, bde, div, corps, comd,
          unit_type, matrix_unit, location
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING unit_id
      `;

      const insertRes = await client.query(insertUnitQuery, [
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
      ]);

      const newUnitId = insertRes.rows[0].unit_id;

      await client.query(
        'UPDATE User_tab SET unit_id = $1 WHERE user_id = $2',
        [newUnitId, userId]
      );

      unitResult = insertRes.rows[0];

    } else {
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
        "location"
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

      values.push(currentUnitId); // last value for WHERE clause

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
