// sanitizeReqBody.js

function sanitizeReqBody(req, res, next) {
  const { body, query } = req;

  // Sanitize request body
  for (const key in body) {
    if (typeof body[key] === "string") {
      body[key] = body[key].replace(/s{2,}/g, " ").trim();
    }
  }

  // Parse query fields
  for (const key in query) {
    if (typeof query[key] === "string") {
      query[key] = query[key].replace(/s{2,}/g, " ").trim();
      // Parse number fields
      if (/^d+$/.test(query[key])) {
        query[key] = parseInt(query[key], 10);
      }
      // Parse boolean fields
      if (query[key] === "true" || query[key] === "false") {
        query[key] = query[key] === "true";
      }
    }
    if (query[key] === "") {
      delete query[key];
    }
  }

  next();
}

module.exports = sanitizeReqBody;
