const { Pool } = require("pg");
const config = require("../config/config");

// Database connection for army-2 (normalized database)
const army2Pool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database, // Use army-2 database
  ssl: config.postgres.ssl
});

let isConnected = false;

army2Pool.on("connect", () => {
  if (!isConnected) {
    console.log("Connected to army-2 (normalized) PostgreSQL database successfully!");
    isConnected = true;
  }
});

army2Pool.on("error", (err) => {
  console.error("army-2 database connection error:", err);
});

module.exports = army2Pool;
