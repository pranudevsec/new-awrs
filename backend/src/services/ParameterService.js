const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");

// Create Parameter
exports.createParameter = async (data) => {
  const client = await dbService.getClient();
  try {
    const {
      comd,
      award_type,
      applicability,
      name,
      description,
      negative,
      max_marks,
      proof_reqd,
      weightage,
      param_sequence,
      param_mark,
      category
    } = data;

    const result = await client.query(
      `INSERT INTO Parameter_Master 
      (comd, award_type, applicability, name, description, negative, max_marks, 
       proof_reqd, weightage, param_sequence, param_mark, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 , $12)
       RETURNING *`,
      [
        comd,
        award_type,
        applicability,
        name,
        description,
        negative,
        max_marks,
        proof_reqd,
        weightage,
        param_sequence,
        param_mark,
        category
      ]
    );

    return ResponseHelper.success(201, "Parameter created", result.rows[0]);
  } finally {
    client.release();
  }
};

// Get All Parameters
exports.getAllParameters = async (query) => {
  const client = await dbService.getClient();
  try {
    const { awardType, search,matrix_unit,comd,unit_type, page = 1, limit = 10 } = query;
    console.log( matrix_unit);
    let award_type = awardType;
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    // Build dynamic query
    const filters = [];
    const values = [];
    const orConditions = [];

    if (award_type) {
      values.push(award_type);
      filters.push(`award_type = $${values.length}`);
    }
    if (comd) {
      values.push(comd);
      filters.push(`comd = $${values.length}`);
    }
    if (unit_type) {
      values.push(unit_type);
      orConditions.push(`arms_service = $${values.length}`);
      orConditions.push(`arms_service = 'ALL'`); 
    }
    if (matrix_unit) {
    const matrixUnits = matrix_unit.split(',').map(u => u.trim()).filter(Boolean);
    matrixUnits.forEach(unit => {
      values.push(unit);
      orConditions.push(`arms_service = $${values.length}`);
    });
  }
    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      filters.push(`LOWER(name) LIKE $${values.length}`);
    }
    if (orConditions.length > 0) {
      filters.push(`(${orConditions.join(" OR ")})`);
    }
    
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    

    // Count total
    const countQuery = `SELECT COUNT(*) FROM Parameter_Master ${whereClause}`;
    const countResult = await client.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);

    // Fetch paginated data
    const dataQuery = `
      SELECT * FROM Parameter_Master 
      ${whereClause}
      ORDER BY param_id DESC 
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    values.push(limitInt, offset);
    const dataResult = await client.query(dataQuery, values);

    const pagination = {
      totalItems,
      totalPages: Math.ceil(totalItems / limitInt),
      currentPage: pageInt,
      itemsPerPage: limitInt,
    };

    return ResponseHelper.success(200, "Fetched parameters", dataResult.rows,pagination);
  } catch (err) {
    console.error("Error in getAllParameters:", err.message);
    return ResponseHelper.error(500, "Failed to fetch parameters", err.message);
  } finally {
    client.release();
  }
};


// Get Parameter by ID
exports.getParameterById = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "SELECT * FROM Parameter_Master WHERE param_id = $1",
      [id]
    );
    return result.rows[0]
      ? ResponseHelper.success(200, "Fetched parameter", result.rows[0])
      : ResponseHelper.error(404, "Parameter not found");
  } finally {
    client.release();
  }
};

// Update Parameter
exports.updateParameter = async (id, data) => {
    const client = await dbService.getClient();
    try {
      const allowedFields = [
        "comd", "award_type", "applicability", "name", "description",
        "negative", "max_marks", "proof_reqd", "weightage", "param_sequence", "param_mark"
      ];
  
      // Filter only provided fields
      const keys = Object.keys(data).filter((key) => allowedFields.includes(key));
      if (keys.length === 0) {
        return ResponseHelper.error(400, "No valid fields provided to update");
      }
  
      const values = keys.map((key) => data[key]);
      const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");
  
      const result = await client.query(
        `UPDATE Parameter_Master SET ${setClause} WHERE param_id = $${keys.length + 1} RETURNING *`,
        [...values, id]
      );
  
      return result.rows[0]
        ? ResponseHelper.success(200, "Parameter updated", result.rows[0])
        : ResponseHelper.error(404, "Parameter not found");
    } finally {
      client.release();
    }
  };  
  
// Delete Parameter
exports.deleteParameter = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "DELETE FROM Parameter_Master WHERE param_id = $1 RETURNING *",
      [id]
    );
    return result.rows[0]
      ? ResponseHelper.success(200, "Parameter deleted")
      : ResponseHelper.error(404, "Parameter not found");
  } finally {
    client.release();
  }
};
