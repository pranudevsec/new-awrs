const db = require("../db/army2-connection");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");

exports.createAppreciation = async (data, user) => {
  try {
    const { date_init, appre_fds, isDraft } = data;
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

    const { award_type, parameters } = appre_fds;


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

    appre_fds.parameters = updatedParameters;

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


    const appreciationQuery = `
      INSERT INTO Appre_tab (
        unit_id, date_init, appre_fds, last_approved_by_role, 
        last_approved_at, status_flag, is_mo_approved, mo_approved_at,
        isfinalized, is_ol_approved, ol_approved_at, isshortlisted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING appreciation_id
    `;

    const appreciationResult = await db.query(appreciationQuery, [
      unit.unit_id,
      date_init,
      JSON.stringify(appre_fds),
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

    const appreciationId = appreciationResult.rows[0].appreciation_id;


    for (const param of parameters) {
      const matchedParam = findMatchedParam(param.id);
      if (matchedParam) {
        const cappedMarks = Math.min(
          param.count * matchedParam.per_unit_mark,
          matchedParam.max_marks
        );

        await db.query(`
          INSERT INTO Appreciation_Parameter (
            appreciation_id, parameter_id, parameter_name, parameter_value,
            parameter_count, parameter_marks, parameter_negative, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          appreciationId,
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

    return ResponseHelper.success(201, "Appreciation created successfully", {
      appreciation_id: appreciationId,
      status: status_flag
    });

  } catch (error) {
    console.error("Error creating appreciation:", error);
    return ResponseHelper.error(500, "Failed to create appreciation", error.message);
  }
};

exports.updateAppreciation = async (appreciationId, data, user) => {
  try {
    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;


    const existingAppreciation = await db.query(
      "SELECT * FROM Appre_tab WHERE appreciation_id = $1 AND unit_id = $2",
      [appreciationId, unit.unit_id]
    );

    if (existingAppreciation.rows.length === 0) {
      return ResponseHelper.error(404, "Appreciation not found or access denied");
    }

    const allowedFields = [
      "date_init",
      "appre_fds",
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


    if (keys.includes("appre_fds")) {
      const { award_type, parameters } = data.appre_fds;

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


      data.appre_fds.parameters = updatedParameters;



      await db.query("DELETE FROM Appreciation_Parameter WHERE appreciation_id = $1", [appreciationId]);


      for (const param of parameters) {
        const matchedParam = findMatchedParam(param.id);
        if (matchedParam) {
          const cappedMarks = Math.min(
            param.count * matchedParam.per_unit_mark,
            matchedParam.max_marks
          );

          await db.query(`
            INSERT INTO Appreciation_Parameter (
              appreciation_id, parameter_id, parameter_name, parameter_value,
              parameter_count, parameter_marks, parameter_negative, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            appreciationId,
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
      key === "appre_fds" ? JSON.stringify(data[key]) : data[key]
    );

    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
    const query = `UPDATE Appre_tab SET ${setClause} WHERE appreciation_id = $${keys.length + 1}`;
    
    await db.query(query, [...values, appreciationId]);

    return ResponseHelper.success(200, "Appreciation updated successfully");

  } catch (error) {
    console.error("Error updating appreciation:", error);
    return ResponseHelper.error(500, "Failed to update appreciation", error.message);
  }
};

exports.getAppreciationParameters = async (appreciationId) => {
  try {
    const result = await db.query(`
      SELECT ap.*, pm.name as parameter_name, pm.category, pm.subcategory, pm.subsubcategory
      FROM Appreciation_Parameter ap
      JOIN Parameter_Master pm ON ap.parameter_id = pm.param_id
      WHERE ap.appreciation_id = $1
      ORDER BY ap.appreciation_param_id
    `, [appreciationId]);

    return ResponseHelper.success(200, "Appreciation parameters fetched successfully", result.rows);
  } catch (error) {
    console.error("Error fetching appreciation parameters:", error);
    return ResponseHelper.error(500, "Failed to fetch appreciation parameters", error.message);
  }
};
