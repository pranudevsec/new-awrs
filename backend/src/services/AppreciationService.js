const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");

// Create Appreciation
exports.createAppre = async (data) => {
  const client = await dbService.getClient();
  try {
    const { unit_id, date_init, appre_fds, status_flag } = data;

    const result = await client.query(
      `INSERT INTO Appre_tab (unit_id, date_init, appre_fds, status_flag)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [unit_id, date_init, JSON.stringify(appre_fds), status_flag]
    );

    return ResponseHelper.success(201, "Appreciation created", result.rows[0]);
  } finally {
    client.release();
  }
};

// Get all Appreciations
exports.getAllAppres = async () => {
  const client = await dbService.getClient();
  try {
    const result = await client.query("SELECT * FROM Appre_tab ORDER BY appreciation_id DESC");
    return ResponseHelper.success(200, "Fetched all appreciations", result.rows);
  } finally {
    client.release();
  }
};

// Get Appreciation by ID
exports.getAppreById = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query("SELECT * FROM Appre_tab WHERE appreciation_id = $1", [id]);
    return result.rows[0]
      ? ResponseHelper.success(200, "Appreciation found", result.rows[0])
      : ResponseHelper.error(404, "Appreciation not found");
  } finally {
    client.release();
  }
};

// Update Appreciation
exports.updateAppre = async (id, data) => {
  const client = await dbService.getClient();
  try {
    const allowedFields = ["unit_id", "date_init", "appre_fds", "status_flag"];
    const keys = Object.keys(data).filter((key) => allowedFields.includes(key));

    if (keys.length === 0) {
      return ResponseHelper.error(400, "No valid fields to update");
    }

    const values = keys.map((key) =>
      key === "appre_fds" ? JSON.stringify(data[key]) : data[key]
    );
    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");

    const result = await client.query(
      `UPDATE Appre_tab SET ${setClause} WHERE appreciation_id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );

    return result.rows[0]
      ? ResponseHelper.success(200, "Appreciation updated", result.rows[0])
      : ResponseHelper.error(404, "Appreciation not found");
  } finally {
    client.release();
  }
};

// Delete Appreciation
exports.deleteAppre = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "DELETE FROM Appre_tab WHERE appreciation_id = $1 RETURNING *",
      [id]
    );
    return result.rows[0]
      ? ResponseHelper.success(200, "Appreciation deleted")
      : ResponseHelper.error(404, "Appreciation not found");
  } finally {
    client.release();
  }
};
