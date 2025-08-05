/**
 * File Name: config.js
 */
const envFound = require("dotenv").config();

module.exports = {
  port: parseInt(process.env.PORT, 10),
  node_env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET || "mysecretkey",
  jwtEmailVerificationSecret:
    process.env.EMAIL_VERIFICATION_SECRET || "myemailverificationsecretkey",
  url: {
    base_url: process.env.BASE_URL,
    frontend_base_url: process.env.FRONTEND_BASE_URL,
  },
  postgres: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
  },
};
