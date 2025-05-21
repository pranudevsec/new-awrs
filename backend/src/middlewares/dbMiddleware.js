// dbMiddleware.js
const db = require("../db/postgres-connection");

const dbMiddleware = (req, res, next) => {
  req.db = db;
  next();
};

module.exports = dbMiddleware;
