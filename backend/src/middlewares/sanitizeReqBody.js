
function sanitizeReqBody(req, res, next) {
  const { body, query } = req;


  for (const key in body) {
    if (typeof body[key] === "string") {
      body[key] = body[key].replace(/s{2,}/g, " ").trim();
    }
  }


  for (const key in query) {
    if (typeof query[key] === "string") {
      query[key] = query[key].replace(/s{2,}/g, " ").trim();

      if (/^d+$/.test(query[key])) {
        query[key] = parseInt(query[key], 10);
      }

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
