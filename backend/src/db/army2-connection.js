const { Pool } = require("pg");
const config = require("../config/config");

const army2Pool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database, // Use army-2 database
  ssl: config.postgres.ssl,
  // Connection pool configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  allowExitOnIdle: true // Allow the pool to exit when all clients are idle
});

let isConnected = false;

army2Pool.on("connect", () => {
  if (!isConnected) {
    isConnected = true;
  }
});

army2Pool.on("error", (err) => {
  console.error("army-2 database connection error:", err);
});

module.exports = army2Pool;
