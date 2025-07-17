const dbService = require("../utils/postgres/dbService");
exports.addSignatureLogs = async (
  id,
  status,
  level,
  member = null,
) => {
  const client = await dbService.getClient();

  try {
console.log( id,
  status,
  level,
  member)
    } catch (err) {
    console.error("Error updating status:", err);
    throw new Error(err.message);
  } finally {
    client.release();
  }
};