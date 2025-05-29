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
    const { deadline, docu_path_base, cycle_period, current_cycle_period } = data;

    const existing = await client.query(
      "SELECT config_id FROM Config_tab ORDER BY config_id ASC LIMIT 1"
    );

    let result;

    if (existing.rows.length > 0) {
      const configId = existing.rows[0].config_id;

      result = await client.query(
        `UPDATE Config_tab 
         SET deadline = $1, docu_path_base = $2, cycle_period = $3, current_cycle_period = $4
         WHERE config_id = $5 
         RETURNING *`,
        [deadline, docu_path_base, cycle_period, current_cycle_period, configId]
      );
    } else {
      result = await client.query(
        `INSERT INTO Config_tab (deadline, docu_path_base, cycle_period, current_cycle_period)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [deadline, docu_path_base, cycle_period, current_cycle_period]
      );
    }

    return ResponseHelper.success(200, "Config saved", result.rows[0]);
  } catch (error) {
    console.error("Error updating or inserting config:", error);
    return ResponseHelper.error(500, "Internal server error");
  } finally {
    client.release();
  }
};
