const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");

// Get the first config record
exports.getFirstConfig = async () => {
  const client = await dbService.getClient();
  try {
    const result = await client.query("SELECT * FROM Config_tab ORDER BY config_id ASC LIMIT 1");
    return result.rows[0]
      ? ResponseHelper.success(200, "Fetched config", result.rows[0])
      : ResponseHelper.error(404, "Config not found");
  } finally {
    client.release();
  }
};

// Update the first config record
exports.updateFirstConfig = async (data) => {
  const client = await dbService.getClient();
  try {
    const { deadline, docu_path_base } = data;

    // Get the first config record
    const existing = await client.query("SELECT config_id FROM Config_tab ORDER BY config_id ASC LIMIT 1");
    if (existing.rows.length === 0) {
      return ResponseHelper.error(404, "Config not found");
    }

    const configId = existing.rows[0].config_id;

    const result = await client.query(
      `UPDATE Config_tab 
       SET deadline = $1, docu_path_base = $2 
       WHERE config_id = $3 RETURNING *`,
      [deadline, docu_path_base, configId]
    );

    return ResponseHelper.success(200, "Config updated", result.rows[0]);
  } finally {
    client.release();
  }
};
