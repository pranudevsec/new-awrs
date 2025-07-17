const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");

exports.createCitation = async (data, user) => {
  const client = await dbService.getClient();
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

    const paramResult = await client.query(
      `SELECT name, subsubcategory, subcategory, category, per_unit_mark, max_marks,negative
       FROM Parameter_Master
       WHERE award_type = $1`,
      [award_type]
    );

    const paramList = paramResult.rows;

    function findMatchedParam(frontendName) {
      const cleanedName = (frontendName ?? "").trim();
    
      for (const p of paramList) {
        if (!p) continue;
    
        if (
          (p.name ?? "").trim() === cleanedName ||
          (p.subsubcategory ?? "").trim() === cleanedName ||
          (p.subcategory ?? "").trim() === cleanedName ||
          (p.category ?? "").trim() === cleanedName
        ) {
          return p;
        }
      }
    
      return undefined;
    }
    
const updatedParameters = parameters.map((p) => {
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
    negative:  matchedParam.negative,
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

if (isSpecialUnit && !isDraft) {
  isshortlisted = true;
  last_approved_at = new Date().toISOString();
  last_approved_by_role = 'command';
  status_flag = "approved";
  is_mo_approved = true;
  mo_approved_at = new Date().toISOString();
  is_ol_approved = true;
  ol_approved_at = new Date().toISOString();
}

const result = await client.query(
  `INSERT INTO Citation_tab 
  (unit_id, date_init, citation_fds, status_flag, isshortlisted, last_approved_at, last_approved_by_role, 
   is_mo_approved, mo_approved_at, is_ol_approved, ol_approved_at)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
   RETURNING *`,
  [
    user.unit_id,
    date_init,
    JSON.stringify(citation_fds),
    status_flag,
    isshortlisted,
    last_approved_at,
    last_approved_by_role,
    is_mo_approved,
    mo_approved_at,
    is_ol_approved,
    ol_approved_at
  ]
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

    if (keys.includes("citation_fds")) {
      const { award_type, parameters } = data.citation_fds;

      const paramResult = await client.query(
        `SELECT name,subsubcategory, subcategory, category, per_unit_mark, max_marks
         FROM Parameter_Master
         WHERE award_type = $1`,
        [award_type]
      );

      const paramList = paramResult.rows;

      function findMatchedParam(frontendName) {
        const nameToMatch = (frontendName ?? "").trim();
      
        for (const p of paramList) {
          if (!p) continue;
      
          for (const key of ["name", "subsubcategory", "subcategory", "category"]) {
            const field = (p[key] ?? "").trim();
            if (field === nameToMatch) {
              return p;
            }
          }
        }
      
        return null;
      }
      

const updatedParameters = parameters.map((p) => {
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
    info: `1 ${matchedParam.name} = ${matchedParam.per_unit_mark} marks (Max ${matchedParam.max_marks} marks)`,
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
