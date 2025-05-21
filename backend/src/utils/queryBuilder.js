const buildWhereClause = (filters = {}, partialMatchKeys = []) => {
  const conditions = [];
  const values = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      if (partialMatchKeys.includes(key)) {
        conditions.push(`${key} ILIKE $${values.length + 1}`);
        values.push(`%${value}%`);
      } else {
        conditions.push(`${key} = $${values.length + 1}`);
        values.push(value);
      }
    }
  });

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
};

const buildMultiFieldSearchClause = (search = "", fields = []) => {
  const values = [];
  let clause = "";

  if (search && fields.length) {
    const conditions = fields.map((field, idx) => {
      values.push(`%${search}%`);
      return `${field} ILIKE $${idx + 1}`;
    });
    clause = `WHERE (${conditions.join(" OR ")})`;
  }

  return { whereClause: clause, values };
};

const buildOrderClause = (sortBy = "id", order = "DESC") => {
  return `ORDER BY ${sortBy} ${order}`;
};

const buildPaginationClause = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return `LIMIT ${limit} OFFSET ${offset}`;
};

module.exports = {
  buildWhereClause,
  buildMultiFieldSearchClause,
  buildOrderClause,
  buildPaginationClause,
};
