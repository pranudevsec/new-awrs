const dbService = require("../utils/postgres/dbService");
exports.addSignatureLogs = async (
  id,
  status,
  level,
  member = null,
) => {
  const client = await dbService.getClient();

  try {
      await client.query(
              `INSERT INTO signature_logs
      (application_id,ic_number,member_level,status_flag,sign_digest)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id,
        member.ic_number,
        level,
        status || 'approved',
        member.sign_digest
      ])
    } catch (err) {
  } finally {
    client.release();
  }
};