const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");
const { v4: uuidv4 } = require('uuid');

exports.createAppre = async (data, user) => {
  const client = await dbService.getClient();
  try {
    const { date_init, appre_fds, isDraft, is_vcoas } = data;
    let status_flag = isDraft ? "draft" : "in_review";

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;
    const isSpecialUnit = profile?.data?.user?.is_special_unit;

    const requiredFields = isSpecialUnit
      ? ["name", "comd"]
      : ["name", "bde", "div", "corps", "comd"];
    const missingFields = requiredFields.filter((f) => !unit?.[f]);
    if (missingFields.length > 0) {
      throw new Error(`Incomplete unit profile. Please update: ${missingFields.join(", ")}`);
    }

    const getMasterId = async (table, nameField, value) => {
      if (!value) return null;
      const res = await client.query(
        `SELECT ${table}_id FROM ${table}_master WHERE ${nameField} = $1 AND is_active = true LIMIT 1`,
        [value]
      );
      return res.rows.length ? res.rows[0][`${table}_id`] : null;
    };

    const corps_id = await getMasterId("corps", "corps_name", appre_fds.corps);
    const brigade_id = await getMasterId("brigade", "brigade_name", appre_fds.brigade);
    const division_id = await getMasterId("division", "division_name", appre_fds.division);
    const command_id = await getMasterId("command", "command_name", appre_fds.command);
    const arms_service_id = await getMasterId("arms_service", "arms_service_name", appre_fds.arms_service);

    const paramResult = await client.query(
      `SELECT param_id, per_unit_mark, max_marks
       FROM Parameter_Master
       WHERE award_type = $1`,
      [appre_fds.award_type]
    );
    const paramMap = {};
    paramResult.rows.forEach(p => { paramMap[p.param_id] = p; });


    const enrichedParams = (appre_fds.parameters || []).map(p => {
      if (!paramMap[p.id]) throw new Error(`Parameter "${p.name}" not found`);
      const marks = Math.min(p.count * paramMap[p.id].per_unit_mark, paramMap[p.id].max_marks);
      return { ...p, marks };
    });

    // Flags
    let isshortlisted = false, last_approved_at = null, last_approved_by_role = null;
    let is_mo_approved = false, mo_approved_at = null;
    let is_ol_approved = false, ol_approved_at = null;

    if (isSpecialUnit && !isDraft) {
      isshortlisted = true;
      last_approved_at = new Date().toISOString();
      last_approved_by_role = 'command';
      status_flag = "approved";
      is_mo_approved = true; mo_approved_at = new Date().toISOString();
      is_ol_approved = true; ol_approved_at = new Date().toISOString();
    }

    const appreInsert = await client.query(
      `INSERT INTO appre_tab 
       (unit_id, date_init, status_flag, isshortlisted, last_approved_at, last_approved_by_role,
        is_mo_approved, mo_approved_at, is_ol_approved, ol_approved_at, is_vcoas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING appreciation_id`,
      [
        user.unit_id, date_init, status_flag, isshortlisted, last_approved_at, last_approved_by_role,
        is_mo_approved, mo_approved_at, is_ol_approved, ol_approved_at, !!is_vcoas
      ]
    );

    const applicationId = appreInsert.rows[0].appreciation_id;

    const fdsInsert = await client.query(
      `INSERT INTO fds (
        application_id, corps_id, brigade_id, command_id, division_id, location, last_date,
        unit_type, award_type, matrix_unit, unit_remarks, arms_service_id,
        cycle_period, accepted_members, applicationGraceMarks, applicationPriority, comments
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING fds_id`,
      [
        applicationId, corps_id, brigade_id, command_id, division_id,
        appre_fds.location, appre_fds.last_date, appre_fds.unit_type,
        appre_fds.award_type, appre_fds.matrix_unit, appre_fds.unitRemarks,
        arms_service_id, appre_fds.cycle_period,
        JSON.stringify(appre_fds.accepted_members || []),
        JSON.stringify(appre_fds.applicationGraceMarks || []),
        JSON.stringify(appre_fds.applicationPriority || []),
        JSON.stringify(appre_fds.comments || [])
      ]
    );

    const fdsId = fdsInsert.rows[0].fds_id;

    if (Array.isArray(appre_fds.awards) && appre_fds.awards.length > 0) {
      for (const award of appre_fds.awards) {
        const awardId = award.award_id || uuidv4();
        await client.query(
          `INSERT INTO fds_awards (fds_id, award_id, award_type, award_year, award_title)
           VALUES ($1,$2,$3,$4,$5)`,
          [fdsId, awardId, award.award_type || null, award.award_year || null, award.award_title || null]
        );
      }
    }

    for (const param of enrichedParams) {
      await client.query(
        `INSERT INTO fds_parameters (fds_id, param_id, count, marks, upload)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (fds_id, param_id) DO NOTHING`,
        [fdsId, param.id, param.count || 0, param.marks || 0, JSON.stringify(param.upload || [])]
      );
    }

    await client.query(
      `UPDATE appre_tab SET fds_id = $1 WHERE appreciation_id = $2`,
      [fdsId, applicationId]
    );

    return ResponseHelper.success(201, "Appreciation created", {
      ...appreInsert.rows[0],
      fds_id: fdsId,
      application_id: applicationId
    });

  } catch (err) {
    return ResponseHelper.error(400, err.message);
  } finally {
    client.release();
  }
};

// Get all Appreciations
exports.getAllAppres = async () => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "SELECT * FROM Appre_tab ORDER BY appreciation_id DESC"
    );
    return ResponseHelper.success(
      200,
      "Fetched all appreciations",
      result.rows
    );
  } finally {
    client.release();
  }
};

// Get Appreciation by ID
exports.getAppreById = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "SELECT * FROM Appre_tab WHERE appreciation_id = $1",
      [id]
    );
    return result.rows[0]
      ? ResponseHelper.success(200, "Appreciation found", result.rows[0])
      : ResponseHelper.error(404, "Appreciation not found");
  } finally {
    client.release();
  }
};

// Update Appreciation
exports.updateAppre = async (id, data,user) => {
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
      "is_mp_review"
    ];    
    const keys = Object.keys(data).filter((key) => allowedFields.includes(key));

    if (keys.length === 0) {
      return ResponseHelper.error(400, "No valid fields to update");
    }
      if (keys.includes("isShortlisted")) {
        const allowedRoles = ["command", "headquarter"];
        if (!allowedRoles.includes(user.user_role?.toLowerCase())) {
          return ResponseHelper.error(
            403,
            `Only users with roles ${allowedRoles.join(" or ")} can update isShortlisted`
          );
        }
      }
      
    if (data.appre_fds) {
      const { award_type, parameters } = data.appre_fds;

      const paramResult = await client.query(
        `SELECT name, subsubcategory, subcategory, category, per_unit_mark, max_marks, negative
         FROM Parameter_Master
         WHERE award_type = $1`,
        [award_type]
      );

      const paramList = paramResult.rows;

      const findMatchedParam = (frontendName) => {
        if (!frontendName) return undefined;
        const cleanedName = frontendName.trim();
      
        for (const p of paramList) {
          if (
            (p.name && p.name.trim() === cleanedName) ||
            (p.subsubcategory && p.subsubcategory.trim() === cleanedName) ||
            (p.subcategory && p.subcategory.trim() === cleanedName) ||
            (p.category && p.category.trim() === cleanedName)
          ) {
            return p;
          }
        }
        return undefined;
      };      

      const enrichedParams = parameters.map((p) => {
        const matchedParam = findMatchedParam(p.name);
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
          negative: matchedParam.negative,
          info: `1 ${matchedParam.name} = ${matchedParam.per_unit_mark} marks (Max ${matchedParam.max_marks} marks)`,
        };
      });

      data.appre_fds = {
        ...data.appre_fds,
        parameters: enrichedParams,
      };
    }

    const values = keys.map((key) =>
      key === "appre_fds" ? JSON.stringify(data[key]) : data[key]
    );
    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");

    const result = await client.query(
      `UPDATE Appre_tab SET ${setClause} WHERE appreciation_id = $${
        keys.length + 1
      } RETURNING *`,
      [...values, id]
    );

    return result.rows[0]
      ? ResponseHelper.success(200, "Appreciation updated", result.rows[0])
      : ResponseHelper.error(404, "Appreciation not found");
  } catch (err) {
    return ResponseHelper.error(400, err.message);
  } finally {
    client.release();
  }
};

// Delete Appreciation
exports.deleteAppre = async (id) => {
  const client = await dbService.getClient();
  try {
    const result = await client.query(
      "DELETE FROM Appre_tab WHERE appreciation_id = $1 RETURNING *",
      [id]
    );
    return result.rows[0]
      ? ResponseHelper.success(200, "Appreciation deleted")
      : ResponseHelper.error(404, "Appreciation not found");
  } finally {
    client.release();
  }
};
