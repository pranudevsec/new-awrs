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
    } = data;

    const result = await client.query(
      `INSERT INTO Parameter_Master 
      (comd, award_type, applicability, name, description, negative, max_marks, 
       proof_reqd, weightage, param_sequence, param_mark)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      ]
    );

    return ResponseHelper.success(201, "Parameter created", result.rows[0]);
  } finally {
    client.release();
  }
};

// Get All Parameters
exports.getAllParameters = async (awardType) => {
    const client = await dbService.getClient();
    try {
      let result;
      if (awardType) {
        result = await client.query(
          "SELECT * FROM Parameter_Master WHERE award_type = $1 ORDER BY param_id DESC",
          [awardType]
        );
      } else {
        result = await client.query(
          "SELECT * FROM Parameter_Master ORDER BY param_id DESC"
        );
      }
  
      return ResponseHelper.success(200, "Fetched parameters", result.rows);
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
