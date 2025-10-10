const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");

// Create Parameter
exports.createParameter = async (data) => {
  const client = await dbService.getClient();
  try {
    const {
      comd,           // command name
      arms_service,   // arms_service name
      deployment,     // deployment name (or ID if you have it)
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
      per_unit_mark,
      category,
      subcategory,
      subsubcategory
    } = data;

    // 1. Get command_id
    let command_id = null;
    if (comd) {
      const cmdRes = await client.query(
        `SELECT command_id FROM Command_Master WHERE LOWER(command_name) = LOWER($1)`,
        [comd]
      );
      if (cmdRes.rows.length > 0) command_id = cmdRes.rows[0].command_id;
      else throw new Error(`Command not found: ${comd}`);
    }

    // 2. Get arms_service_id
    let arms_service_id = null;
    if (arms_service) {
      const amsRes = await client.query(
        `SELECT arms_service_id FROM Arms_Service_Master WHERE LOWER(arms_service_name) = LOWER($1)`,
        [arms_service]
      );
      if (amsRes.rows.length > 0) arms_service_id = amsRes.rows[0].arms_service_id;
      else throw new Error(`Arms Service not found: ${arms_service}`);
    }

    // 3. Get deployment_id (optional)
    let deployment_id = null;
    if (deployment) {
      const depRes = await client.query(
        `SELECT deployment_id FROM Deployment_Master WHERE LOWER(name) = LOWER($1)`,
        [deployment]
      );
      if (depRes.rows.length > 0) deployment_id = depRes.rows[0].deployment_id;
      else throw new Error(`Deployment not found: ${deployment}`);
    }

    // 4. Insert into Parameter_Master
    const result = await client.query(
      `INSERT INTO Parameter_Master 
      (award_type, applicability, category, subcategory, subsubcategory, name, description, 
       negative, per_unit_mark, max_marks, proof_reqd, weightage, param_sequence, param_mark, 
       command_id, arms_service_id, deployment_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        award_type,
        applicability,
        category || null,
        subcategory || null,
        subsubcategory || null,
        name,
        description,
        negative,
        per_unit_mark || 1,
        max_marks,
        proof_reqd,
        weightage,
        param_sequence,
        param_mark,
        command_id,
        arms_service_id,
        deployment_id
      ]
    );

    return ResponseHelper.success(201, "Parameter created", result.rows[0]);
  } catch (err) {
    return ResponseHelper.error(500, "Failed to create parameter", err.message);
  } finally {
    client.release();
  }
};

// Get All Parameters
exports.getAllParameters = async (query) => {
  const client = await dbService.getClient();
  try {
    const {
      awardType,
      search,
      matrix_unit,
      comd,
      unit_type,
      page = 1,
      limit = 10
    } = query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    const filters = [];
    const values = [];
    const orConditions = [];

    const joins = [];
    const selectExtras = [];

    // awardType filter
    if (awardType) {
      values.push(awardType);
      filters.push(`pm.award_type = $${values.length}`);
    }

    // command filter
    if (comd) {
      joins.push("JOIN Command_Master cm ON pm.command_id = cm.command_id");
      values.push(comd);
      filters.push(`LOWER(cm.command_name) = LOWER($${values.length})`);
      selectExtras.push("cm.command_name");
    }

    // arms_service filter
    if (unit_type || matrix_unit) {
      joins.push("JOIN Arms_Service_Master ams ON pm.arms_service_id = ams.arms_service_id");

      if (unit_type) {
        values.push(unit_type);
        orConditions.push(`TRIM(LOWER(ams.arms_service_name)) = TRIM(LOWER($${values.length}))`);
      }

      if (matrix_unit) {
        const units = matrix_unit.split(',').map(u => u.trim()).filter(Boolean);
        units.forEach(unit => {
          values.push(unit);
          orConditions.push(`TRIM(LOWER(ams.arms_service_name)) = TRIM(LOWER($${values.length}))`);
        });
      }

      // always include 'ALL'
      orConditions.push(`TRIM(LOWER(ams.arms_service_name)) = 'all'`);
      selectExtras.push("ams.arms_service_name");
    }

    // Add OR conditions
    if (orConditions.length > 0) {
      filters.push(`(${orConditions.join(" OR ")})`);
    }

    // search filter
    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      filters.push(`LOWER(pm.name) LIKE $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // COUNT query
    const countQuery = `
      SELECT COUNT(*) 
      FROM Parameter_Master pm
      ${joins.join(" ")}
      ${whereClause}
    `;
    const countResult = await client.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);

    // DATA query
    const selectClause = ["pm.*", ...selectExtras].join(", ");
    const dataQuery = `
      SELECT ${selectClause}
      FROM Parameter_Master pm
      ${joins.join(" ")}
      ${whereClause}
      ORDER BY pm.param_id DESC
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

    return ResponseHelper.success(200, "Fetched parameters", dataResult.rows, pagination);
  } catch (err) {
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
      "comd",
      "award_type",
      "applicability",
      "name",
      "description",
      "negative",
      "max_marks",
      "proof_reqd",
      "weightage",
      "param_sequence",
      "param_mark",
    ];

    // Filter only provided fields
    const keys = Object.keys(data).filter((key) => allowedFields.includes(key));
    if (keys.length === 0) {
      return ResponseHelper.error(400, "No valid fields provided to update");
    }

    const values = keys.map((key) => data[key]);
    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");

    const result = await client.query(
      `UPDATE Parameter_Master SET ${setClause} WHERE param_id = $${
        keys.length + 1
      } RETURNING *`,
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
