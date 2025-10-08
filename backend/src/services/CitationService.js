const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");
const { v4: uuidv4 } = require('uuid');

exports.createCitation = async (data, user) => {
  const client = await dbService.getClient();

  try {
    const { date_init, citation_fds, isDraft } = data;
    let status_flag = isDraft ? "draft" : "in_review";

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;
    const isSpecialUnit = profile?.data?.user?.is_special_unit;

    const requiredFields = isSpecialUnit
      ? ["name", "comd"]
      : ["name", "bde", "div", "corps", "comd"];
    const missingFields = requiredFields.filter((f) => !unit?.[f]);
    if (missingFields.length > 0) {
      throw new Error(`Incomplete unit profile. Update: ${missingFields.join(", ")}`);
    }

    const getMasterId = async (table, nameField, value) => {
      if (!value) return null;
      const res = await client.query(
        `SELECT ${table}_id FROM ${table}_master WHERE ${nameField} = $1 AND is_active = true LIMIT 1`,
        [value]
      );
      return res.rows.length ? res.rows[0][`${table}_id`] : null;
    };

    const corps_id = await getMasterId("corps", "corps_name", citation_fds.corps);
    const brigade_id = await getMasterId("brigade", "brigade_name", citation_fds.brigade);
    const division_id = await getMasterId("division", "division_name", citation_fds.division);
    const command_id = await getMasterId("command", "command_name", citation_fds.command);
    const arms_service_id = await getMasterId("arms_service", "arms_service_name", citation_fds.arms_service);

    const paramResult = await client.query(
      `SELECT param_id, per_unit_mark, max_marks
       FROM Parameter_Master
       WHERE award_type = $1`,
      [citation_fds.award_type]
    );

    const paramMap = {};
    paramResult.rows.forEach(p => { paramMap[p.param_id] = p; });

    let isshortlisted = false,
        last_approved_at = null,
        last_approved_by_role = null,
        is_mo_approved = false,
        mo_approved_at = null,
        is_ol_approved = false,
        ol_approved_at = null;

    if (isSpecialUnit && !isDraft) {
      isshortlisted = true;
      last_approved_at = new Date().toISOString();
      last_approved_by_role = "command";
      status_flag = "approved";
      is_mo_approved = true;
      mo_approved_at = new Date().toISOString();
      is_ol_approved = true;
      ol_approved_at = new Date().toISOString();
    }

    const citationInsert = await client.query(
      `INSERT INTO citation_tab (
        unit_id, date_init, status_flag, isshortlisted,
        last_approved_at, last_approved_by_role,
        is_mo_approved, mo_approved_at, is_ol_approved, ol_approved_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING citation_id`,
      [
        user.unit_id,
        date_init,
        status_flag,
        isshortlisted,
        last_approved_at,
        last_approved_by_role,
        is_mo_approved,
        mo_approved_at,
        is_ol_approved,
        ol_approved_at,
      ]
    );

    const applicationId = citationInsert.rows[0].citation_id;

    const fdsInsert = await client.query(
      `INSERT INTO fds (
        application_id, corps_id, brigade_id, command_id, division_id, location, last_date,
        unit_type, award_type, matrix_unit, unit_remarks, arms_service_id,
        cycle_period, accepted_members, applicationGraceMarks, applicationPriority, comments
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING fds_id`,
      [
        applicationId,
        corps_id,
        brigade_id,
        command_id,
        division_id,
        citation_fds.location,
        citation_fds.last_date,
        citation_fds.unit_type,
        citation_fds.award_type,
        citation_fds.matrix_unit,
        citation_fds.unitRemarks,
        arms_service_id,
        citation_fds.cycle_period,
        JSON.stringify(citation_fds.accepted_members || []),
        JSON.stringify(citation_fds.applicationGraceMarks || []),
        JSON.stringify(citation_fds.applicationPriority || []),
        JSON.stringify(citation_fds.comments || []),
      ]
    );

    const fdsId = fdsInsert.rows[0].fds_id;

    if (Array.isArray(citation_fds.awards) && citation_fds.awards.length > 0) {
      for (const award of citation_fds.awards) {
        const awardId = award.award_id || uuidv4();
        await client.query(
          `INSERT INTO fds_awards (fds_id, award_id, award_type, award_year, award_title)
           VALUES ($1,$2,$3,$4,$5)`,
          [fdsId, awardId, award.award_type || null, award.award_year || null, award.award_title || null]
        );
      }
    }

    if (Array.isArray(citation_fds.parameters) && citation_fds.parameters.length > 0) {
      for (const param of citation_fds.parameters) {
        if (!paramMap[param.id]) continue; 
        const marks = Math.min(param.count * paramMap[param.id].per_unit_mark, paramMap[param.id].max_marks);
        await client.query(
          `INSERT INTO fds_parameters (fds_id, param_id, count, marks, upload)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (fds_id, param_id) DO NOTHING`,
          [fdsId, param.id, param.count || 0, marks, JSON.stringify(param.upload || [])]
        );
      }
    }

    await client.query(
      `UPDATE citation_tab SET fds_id = $1 WHERE citation_id = $2`,
      [fdsId, applicationId]
    );

    return ResponseHelper.success(201, "Citation created", {
      ...citationInsert.rows[0],
      fds_id: fdsId,
      application_id: applicationId,
    });

  } catch (err) {
    return ResponseHelper.error(400, err.message);
  } finally {
    client.release();
  }
};

exports.getAllCitations = async () => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "SELECT * FROM Citation_tab ORDER BY citation_id DESC"
    );
    return ResponseHelper.success(200, "Fetched all citations", result.rows);
  } finally {
    client.release();
  }
};

exports.getCitationById = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "SELECT * FROM Citation_tab WHERE citation_id = $1",
      [id]
    );
    return result.rows[0]
      ? ResponseHelper.success(200, "Citation found", result.rows[0])
      : ResponseHelper.error(404, "Citation not found");
  } finally {
    client.release();
  }
};

exports.updateCitation = async (id, data, user) => {
  const client = await dbService.getClient();
  try {
    const allowedFields = [
      "date_init",
      "appre_fds",
      "status_flag",
      "isShortlisted",
      "is_mo_approved",
      "mo_approved_at",
      "is_ol_approved",
      "ol_approved_at",
      "is_hr_review",
      "is_dv_review",
      "is_mp_review",
      "citation_fds"
    ];

    const keys = Object.keys(data).filter((key) => allowedFields.includes(key));
    if (keys.length === 0) {
      return ResponseHelper.error(400, "No valid fields to update");
    }

    // Check for the 'isShortlisted' field and validate user role
    if (keys.includes("isShortlisted")) {
      const allowedRoles = ["command", "headquarter"];
      if (!allowedRoles.includes(user.user_role?.toLowerCase())) {
        return ResponseHelper.error(
          403,
          `Only users with roles ${allowedRoles.join(" or ")} can update isShortlisted`
        );
      }
    }

    // Handle the 'citation_fds' field updates
    if (keys.includes("citation_fds")) {
      const { award_type, parameters } = data.citation_fds;

      const paramResult = await client.query(
        `SELECT param_id,name,subsubcategory, subcategory, category, per_unit_mark, max_marks
         FROM Parameter_Master
         WHERE award_type = $1`,
        [award_type]
      );

      const paramList = paramResult.rows;

      // Find matching parameters from Parameter_Master
      const findMatchedParam = (paramId) => {
        return paramList.find(p => p.param_id === paramId);
      };

      // Update the parameters with the matched data
      const updatedParameters = parameters.map((p) => {
        const matchedParam = findMatchedParam(p.id);
        if (!matchedParam) {
          throw new Error(
            `Parameter "${p.name}" not found in master for award_type "${award_type}"`
          );
        }

        const calculatedMarks = p.count * matchedParam.per_unit_mark;
        const cappedMarks = Math.min(calculatedMarks, matchedParam.max_marks);

        return {
          ...p,
          name: matchedParam.name,
          subcategory: matchedParam.subcategory,
          subsubcategory: matchedParam.subsubcategory,
          category: matchedParam.category,
          marks: cappedMarks,
          info: `1 ${matchedParam.name} = ${matchedParam.per_unit_mark} marks (Max ${matchedParam.max_marks} marks)`
        };
      });

      // Update the citation_fds with updated parameters
      data.citation_fds.parameters = updatedParameters;
    }

    // Prepare the update query for the allowed fields
    const values = keys.map((key) =>
      key === "citation_fds" ? JSON.stringify(data[key]) : data[key]
    );

    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");

    const result = await client.query(
      `UPDATE Citation_tab SET ${setClause} WHERE citation_id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );

    // Return the updated citation or an error message if not found
    return result.rows[0]
      ? ResponseHelper.success(200, "Citation updated", result.rows[0])
      : ResponseHelper.error(404, "Citation not found");
  } catch (err) {
    return ResponseHelper.error(400, err.message);
  } finally {
    client.release();
  }
};


exports.deleteCitation = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "DELETE FROM Citation_tab WHERE citation_id = $1 RETURNING *",
      [id]
    );
    return result.rows[0]
      ? ResponseHelper.success(200, "Citation deleted")
      : ResponseHelper.error(404, "Citation not found");
  } finally {
    client.release();
  }
};
