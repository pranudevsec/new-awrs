const { Pool } = require("pg");
const config = require("../config/config");

const pool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
  ssl: config.postgres.ssl,
  // Connection pool configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  allowExitOnIdle: true // Allow the pool to exit when all clients are idle
});

let isConnected = false;

pool.on("connect", () => {
  if (!isConnected) {
    isConnected = true;
  }
});

module.exports = pool;
