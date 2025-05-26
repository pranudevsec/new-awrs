const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");

exports.createCitation = async (data, user) => {
  const client = await dbService.getClient();
  try {
    const { date_init, citation_fds } = data;
    const status_flag = "in_review";
    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    const requiredFields = ["name", "bde", "div", "corps", "comd"];
    const missingFields = requiredFields.filter((field) => !unit?.[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Incomplete unit profile. Please update the following fields in unit settings: ${missingFields.join(
          ", "
        )}`
      );
    }

    const { award_type, parameters } = citation_fds;

    const paramResult = await client.query(
      `SELECT name, per_unit_mark, max_marks
       FROM Parameter_Master
       WHERE award_type = $1`,
      [award_type]
    );

    const paramMap = {};
    paramResult.rows.forEach((p) => {
      paramMap[p.name.trim()] = {
        per_unit_mark: p.per_unit_mark,
        max_marks: p.max_marks,
      };
    });

    const updatedParameters = parameters.map((p) => {
      const matchedParam = paramMap[p.name.trim()];
      if (!matchedParam) {
        throw new Error(
          `Parameter "${p.name}" not found in master for award_type "${award_type}"`
        );
      }

      const calculatedMarks = p.count * matchedParam.per_unit_mark;
      const cappedMarks = Math.min(calculatedMarks, matchedParam.max_marks);

      return {
        ...p,
        marks: cappedMarks,
        info: `1 ${p.name} = ${matchedParam.per_unit_mark} marks (Max ${matchedParam.max_marks} marks)`,
      };
    });

    citation_fds.parameters = updatedParameters;

    const result = await client.query(
      `INSERT INTO Citation_tab (unit_id, date_init, citation_fds, status_flag)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.unit_id, date_init, JSON.stringify(citation_fds), status_flag]
    );

    return ResponseHelper.success(201, "Citation created", result.rows[0]);
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

exports.updateCitation = async (id, data,user) => {
  const client = await dbService.getClient();
  try {
    const allowedFields = [
      "isShortlisted",
      "date_init",
      "citation_fds",
      "status_flag",
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

    if (keys.includes("citation_fds")) {
      const { award_type, parameters } = data.citation_fds;

      const paramResult = await client.query(
        `SELECT name, per_unit_mark, max_marks
         FROM Parameter_Master
         WHERE award_type = $1`,
        [award_type]
      );

      const paramMap = {};
      paramResult.rows.forEach((p) => {
        paramMap[p.name.trim()] = {
          per_unit_mark: p.per_unit_mark,
          max_marks: p.max_marks,
        };
      });

      const updatedParameters = parameters.map((p) => {
        const matchedParam = paramMap[p.name.trim()];
        if (!matchedParam) {
          throw new Error(
            `Parameter "${p.name}" not found in master for award_type "${award_type}"`
          );
        }

        const calculatedMarks = p.count * matchedParam.per_unit_mark;
        const cappedMarks = Math.min(calculatedMarks, matchedParam.max_marks);

        return {
          ...p,
          marks: cappedMarks,
          info: `1 ${p.name} = ${matchedParam.per_unit_mark} marks (Max ${matchedParam.max_marks} marks)`,
        };
      });

      data.citation_fds.parameters = updatedParameters;
    }

    const values = keys.map((key) =>
      key === "citation_fds" ? JSON.stringify(data[key]) : data[key]
    );
    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");

    const result = await client.query(
      `UPDATE Citation_tab SET ${setClause} WHERE citation_id = $${
        keys.length + 1
      } RETURNING *`,
      [...values, id]
    );

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
