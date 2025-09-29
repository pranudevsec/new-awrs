const { Pool } = require("pg");
const config = require("../config/config");

const pool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
  ssl: config.postgres.ssl
});

let isConnected = false;

pool.on("connect", () => {
  if (!isConnected) {
    console.log("Connected to PostgreSQL database successfully!");
    isConnected = true;
  }
});

module.exports = pool;
