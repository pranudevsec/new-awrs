const db = require("../db/army2-connection");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");

exports.createCitation = async (data, user) => {
  try {
    const { date_init, citation_fds, isDraft } = data;
    let status_flag = isDraft === true ? "draft" : "in_review";

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;
    const isSpecialUnit = profile?.data?.user?.is_special_unit === true;
    
    const requiredFields = isSpecialUnit
      ? ["name", "comd"]
      : ["name", "bde", "div", "corps", "comd"];
    
    const missingFields = requiredFields.filter((field) => !unit?.[field]);
    
    if (missingFields.length > 0) {
      throw new Error(
        `Incomplete unit profile. Please update the following fields in unit settings: ${missingFields.join(", ")}`
      );
    }

    const { award_type, parameters } = citation_fds;


    const paramResult = await db.query(
      `SELECT param_id, name, subsubcategory, subcategory, category, per_unit_mark, max_marks, negative
       FROM Parameter_Master
       WHERE award_type = $1`,
      [award_type]
    );

    const paramList = paramResult.rows;

    const findMatchedParam = (paramId) => {
      for (const p of paramList) {
        if (p.param_id === paramId) {
          return p;
        }
      }
      return undefined;
    };


    const updatedParameters = parameters.map((p) => {
      const matchedParam = findMatchedParam(p.id);
      if (!matchedParam) {
        throw new Error(
          `Parameter "${p.name}" not found in master for award_type "${award_type}"`
        );
      }

      const cappedMarks = Math.min(
        p.count * matchedParam.per_unit_mark,
        matchedParam.max_marks
      );

      return {
        id: p.id,
        name: p.name,
        count: p.count,
        marks: cappedMarks,
        negative: matchedParam.negative,
        info: `1 ${matchedParam.name} = ${matchedParam.per_unit_mark} marks (Max ${matchedParam.max_marks} marks)`,
      };
    });

    citation_fds.parameters = updatedParameters;

    let isshortlisted = false;
    let last_approved_at = null;
    let last_approved_by_role = null;
    let is_mo_approved = false;
    let mo_approved_at = null;
    let is_ol_approved = false;
    let ol_approved_at = null;

    if (status_flag === "in_review") {
      isshortlisted = false;
      last_approved_at = new Date();
      last_approved_by_role = "unit";
    }


    const citationQuery = `
      INSERT INTO Citation_tab (
        unit_id, date_init, citation_fds, last_approved_by_role, 
        last_approved_at, status_flag, is_mo_approved, mo_approved_at,
        isfinalized, is_ol_approved, ol_approved_at, isshortlisted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING citation_id
    `;

    const citationResult = await db.query(citationQuery, [
      unit.unit_id,
      date_init,
      JSON.stringify(citation_fds),
      last_approved_by_role,
      last_approved_at,
      status_flag,
      is_mo_approved,
      mo_approved_at,
      false, // isfinalized
      is_ol_approved,
      ol_approved_at,
      isshortlisted
    ]);

    const citationId = citationResult.rows[0].citation_id;


    for (const param of parameters) {
      const matchedParam = findMatchedParam(param.id);
      if (matchedParam) {
        const cappedMarks = Math.min(
          param.count * matchedParam.per_unit_mark,
          matchedParam.max_marks
        );

        await db.query(`
          INSERT INTO Citation_Parameter (
            citation_id, parameter_id, parameter_name, parameter_value,
            parameter_count, parameter_marks, parameter_negative, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          citationId,
          matchedParam.param_id,
          matchedParam.name,
          param.count, // parameter_value
          param.count, // parameter_count
          cappedMarks, // parameter_marks
          matchedParam.negative, // parameter_negative
          'pending' // status
        ]);
      }
    }

    return ResponseHelper.success(201, "Citation created successfully", {
      citation_id: citationId,
      status: status_flag
    });

  } catch (error) {
    console.error("Error creating citation:", error);
    return ResponseHelper.error(500, "Failed to create citation", error.message);
  }
};

exports.updateCitation = async (citationId, data, user) => {
  try {
    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;


    const existingCitation = await db.query(
      "SELECT * FROM Citation_tab WHERE citation_id = $1 AND unit_id = $2",
      [citationId, unit.unit_id]
    );

    if (existingCitation.rows.length === 0) {
      return ResponseHelper.error(404, "Citation not found or access denied");
    }

    const allowedFields = [
      "date_init",
      "citation_fds",
      "unitremarks",
      "status_flag",
      "is_mo_approved",
      "is_ol_approved",
      "isfinalized",
      "isshortlisted"
    ];

    const keys = Object.keys(data).filter(key => allowedFields.includes(key));
    
    if (keys.length === 0) {
      return ResponseHelper.error(400, "No valid fields to update");
    }


    if (keys.includes("citation_fds")) {
      const { award_type, parameters } = data.citation_fds;

      const paramResult = await db.query(
        `SELECT param_id, name, subsubcategory, subcategory, category, per_unit_mark, max_marks
         FROM Parameter_Master
         WHERE award_type = $1`,
        [award_type]
      );

      const paramList = paramResult.rows;


      const findMatchedParam = (paramId) => {
        return paramList.find(p => p.param_id === paramId);
      };


      const updatedParameters = parameters.map((p) => {
        const matchedParam = findMatchedParam(p.id);
        if (!matchedParam) {
          throw new Error(
            `Parameter "${p.name}" not found in master for award_type "${award_type}"`
          );
        }

        const cappedMarks = Math.min(
          p.count * matchedParam.per_unit_mark,
          matchedParam.max_marks
        );

        return {
          id: p.id,
          name: p.name,
          count: p.count,
          marks: cappedMarks,
          negative: matchedParam.negative,
          info: `1 ${matchedParam.name} = ${matchedParam.per_unit_mark} marks (Max ${matchedParam.max_marks} marks)`
        };
      });


      data.citation_fds.parameters = updatedParameters;



      await db.query("DELETE FROM Citation_Parameter WHERE citation_id = $1", [citationId]);


      for (const param of parameters) {
        const matchedParam = findMatchedParam(param.id);
        if (matchedParam) {
          const cappedMarks = Math.min(
            param.count * matchedParam.per_unit_mark,
            matchedParam.max_marks
          );

          await db.query(`
            INSERT INTO Citation_Parameter (
              citation_id, parameter_id, parameter_name, parameter_value,
              parameter_count, parameter_marks, parameter_negative, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            citationId,
            matchedParam.param_id,
            matchedParam.name,
            param.count,
            param.count,
            cappedMarks,
            matchedParam.negative,
            'pending'
          ]);
        }
      }
    }


    const values = keys.map((key) =>
      key === "citation_fds" ? JSON.stringify(data[key]) : data[key]
    );

    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
    const query = `UPDATE Citation_tab SET ${setClause} WHERE citation_id = $${keys.length + 1}`;
    
    await db.query(query, [...values, citationId]);

    return ResponseHelper.success(200, "Citation updated successfully");

  } catch (error) {
    console.error("Error updating citation:", error);
    return ResponseHelper.error(500, "Failed to update citation", error.message);
  }
};

exports.getCitationParameters = async (citationId) => {
  try {
    const result = await db.query(`
      SELECT cp.*, pm.name as parameter_name, pm.category, pm.subcategory, pm.subsubcategory
      FROM Citation_Parameter cp
      JOIN Parameter_Master pm ON cp.parameter_id = pm.param_id
      WHERE cp.citation_id = $1
      ORDER BY cp.citation_param_id
    `, [citationId]);

    return ResponseHelper.success(200, "Citation parameters fetched successfully", result.rows);
  } catch (error) {
    console.error("Error fetching citation parameters:", error);
    return ResponseHelper.error(500, "Failed to fetch citation parameters", error.message);
  }
};
