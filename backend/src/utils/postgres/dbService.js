const pool = require("../../db/postgres-connection");
const ResponseHelper = require("../../utils/responseHelper");
const MSG = require("../../utils/MSG");

const dbService = {
  async getClient() {
    const client = await pool.connect();
    // Add error handling for connection issues
    client.on('error', (err) => {
      console.error('Database client error:', err);
    });
    return client;
  },
  async create(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

    const query = `
      INSERT INTO ${table} (${keys.join(", ")})
      VALUES (${placeholders})
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return ResponseHelper.success(201, MSG.CREATE_SUCCESS, result.rows[0]);
  },

  async getAll(table) {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`);
    return ResponseHelper.success(200, MSG.FOUND_SUCCESS, result.rows);
  },

  async getById(table, id) {
    const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [
      id,
    ]);
    if (result.rowCount === 0) throw new Error(`${table} record not found`);
    return ResponseHelper.success(200, MSG.FOUND_SUCCESS, result.rows[0]);
  },

  async update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setString = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const query = `
      UPDATE ${table}
      SET ${setString}
      WHERE id = $${keys.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, [...values, id]);
    return ResponseHelper.success(200, MSG.UPDATE_SUCCESS, result.rows[0]);
  },

  async remove(table, id) {
    const result = await pool.query(
      `DELETE FROM ${table} WHERE id = $1 RETURNING *`,
      [id]
    );
    return ResponseHelper.success(200, MSG.DELETE_SUCCESS, result.rows[0]);
  },

  async findOne(table, whereClause) {
    const keys = Object.keys(whereClause);
    const values = Object.values(whereClause);
    const condition = keys.map((key, i) => `${key} = $${i + 1}`).join(" AND ");

    const query = `SELECT * FROM ${table} WHERE ${condition} LIMIT 1;`;
    const result = await pool.query(query, values);

    if (result.rowCount === 0) return null;
    return result.rows[0];
  },

  async query(query, params = []) {
    const result = await pool.query(query, params);
    return result;
  },

  // Utility function to safely execute queries with proper connection cleanup
  async executeWithClient(callback) {
    const client = await this.getClient();
    try {
      const result = await callback(client);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release(); // Always release the connection back to the pool
    }
  },
};

module.exports = dbService;
