const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const { attachSingleFdsToApplication, attachFdsToApplications } = require("./commonService");

exports.addClarification = async (user, data) => {
  const client = await dbService.getClient();

  try {
    const {
      type, // 'citation' or 'appreciation'
      application_id,
      parameter_name,
      parameter_id,
      clarification,
      clarification_doc,
      reviewer_comment, // new field added
    } = data;

    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO Clarification_tab (
        application_type,
        application_id,
        parameter_id,             
        parameter_name,
        clarification_by_id,
        clarification_by_role,
        clarification_status,
        clarification,
        clarification_doc,
        reviewer_comment,
        clarification_sent_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, NOW())
      RETURNING clarification_id;
    `;

    const values = [
      type,
      application_id,
      parameter_id,
      parameter_name,
      user.user_id,
      user.user_role,
      clarification,
      clarification_doc,
      reviewer_comment,
    ];

    const result = await client.query(insertQuery, values);
    const clarificationId = result.rows[0].clarification_id;


    const table = type === "citation" ? "Citation_tab" : "Appre_tab";
    const idColumn = type === "citation" ? "citation_id" : "appreciation_id";

    const selectQuery = `SELECT *, ${idColumn} AS id FROM ${table} WHERE ${idColumn} = $1 FOR UPDATE`;
    const jsonResult = await client.query(selectQuery, [application_id]);

    if (jsonResult.rowCount === 0) {
      throw new Error(`${type} record not found`);
    }
let appData=jsonResult.rows[0]

appData=await attachSingleFdsToApplication(appData);

    let fds = appData.fds;
   

    const updatedFds = {
      ...fds,
      parameters: fds.parameters.map((param) => {
        if (param.id === parameter_id) {
          return {
            ...param,
            clarification_id: clarificationId,
          };
        }
        return param;
      }),
    };
    const updateClarificationQuery = `
    UPDATE fds_parameters
    SET clarification_id = $1,
        updated_at = NOW()
    WHERE fds_id = $2
      AND param_id = $3
    RETURNING *;
  `;
  
  await client.query(updateClarificationQuery, [
    clarificationId,
    appData.fds_id,
    parameter_id,
  ]);

    await client.query("COMMIT");

    return ResponseHelper.success(
      200,
      "Clarification added and linked successfully",
      {
        clarification_id: clarificationId,
      }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    return ResponseHelper.error(
      500,
      "Failed to insert and link clarification",
      err.message
    );
  } finally {
    client.release();
  }
};

exports.updateClarification = async (user, data, clarification_id) => {
  const client = await dbService.getClient();
  try {
    if (!clarification_id) {
      return ResponseHelper.error(400, "clarification_id is required");
    }

    const clarificationRow = await fetchClarificationRow(
      client,
      clarification_id
    );
    if (!clarificationRow) {
      return ResponseHelper.error(404, "Clarification not found");
    }

    const { application_type, application_id, parameter_id } = clarificationRow;
    

    if (data.approved_count !== undefined || data.approved_marks !== undefined) {
      const validationResult = await validateApprovedCountAndMarks(
        client,
        application_type,
        application_id,
        parameter_id,
        data.approved_count,
        data.approved_marks
      );
      if (!validationResult.isValid) {
        return ResponseHelper.error(400, validationResult.message);
      }
    }
    
    const updateFields = buildUpdateFields(user, data);

    if (updateFields.updates.length === 0) {
      return ResponseHelper.error(400, "No permitted update fields provided");
    }

    const updatedClarification = await updateClarificationRow(
      client,
      clarification_id,
      updateFields
    );

    if (
      shouldUpdateApplication(
        data.clarification_status,
        application_type,
        application_id
      )
    ) {
      await handleApplicationClarification(
        client,
        user,
        data.clarification_status,
        application_type,
        application_id,
        clarification_id
      );
    }

    return ResponseHelper.success(
      200,
      "Clarification updated successfully",
      updatedClarification
    );
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to update clarification",
      err.message
    );
  } finally {
    client.release();
  }
};
async function fetchClarificationRow(client, clarification_id) {
  const res = await client.query(
    `SELECT * FROM Clarification_tab WHERE clarification_id = $1`,
    [clarification_id]
  );
  return res.rowCount > 0 ? res.rows[0] : null;
}

function buildUpdateFields(user, data) {
  const { clarification, clarification_doc, clarification_status, approved_marks, approved_count } = data;
  const updates = [];
  const values = [];
  let i = 1;

  const canEditTextFields =
    ["unit", "brigade", "division", "corps", "command"].includes(
      user.user_role
    ) && !clarification_status;

  if (canEditTextFields) {
    if (clarification !== undefined) {
      updates.push(`clarification = $${i++}`);
      values.push(clarification);
    }
    if (clarification_doc !== undefined) {
      updates.push(`clarification_doc = $${i++}`);
      values.push(clarification_doc);
    }
  } else if (clarification_status !== undefined) {
    updates.push(`clarification_status = $${i++}`);
    values.push(clarification_status);
  }



  if (["brigade", "division", "corps", "command"].includes(user.user_role)) {
    if (approved_count !== undefined) {
      updates.push(`approved_count = $${i++}`);
      values.push(approved_count);
    }
    if (approved_marks !== undefined) {
      updates.push(`approved_marks = $${i++}`);
      values.push(approved_marks);
    }
  }

  updates.push(`clarified_at = NOW()`);
  return { updates, values };
}

async function updateClarificationRow(
  client,
  clarification_id,
  { updates, values }
) {
  const query = `
    UPDATE Clarification_tab
    SET ${updates.join(", ")}
    WHERE clarification_id = $${values.length + 1}
    RETURNING *;
  `;
  const res = await client.query(query, [...values, clarification_id]);
  return res.rows[0];
}

function shouldUpdateApplication(status, type, id) {
  return ["clarified", "rejected"].includes(status) && type && id;
}

async function handleApplicationClarification(
  client,
  user,
  status,
  type,
  id,
  clarification_id
) {
  const { appQuery, tableName, jsonField, idField } = getAppTableInfo(type);

  let appRes = await client.query(appQuery, [id]);
  if (appRes.rowCount === 0) return;
let appData=appRes.rows[0];
appData=await attachSingleFdsToApplication(appData)
  const fds = appData.fds;
  if (!Array.isArray(fds?.parameters)) return;

  const updatedParams = updateFdsParameters(
    client,
    fds.parameters,
    clarification_id,
    user,
    status
  );

  if (updatedParams.wasUpdated) {
    await updateFdsInApplication(
      client,
      tableName,
      jsonField,
      idField,
      id,
      fds
    );
    await logClarificationAction(client, clarification_id);
  }
}

function getAppTableInfo(application_type) {
  if (application_type === "citation") {
    return {
      appQuery: `SELECT * FROM Citation_tab WHERE citation_id = $1`,
      tableName: "Citation_tab",
      jsonField: "citation_fds",
      idField: "citation_id",
    };
  } else if (application_type === "appreciation") {
    return {
      appQuery: `SELECT * FROM Appre_tab WHERE appreciation_id = $1`,
      tableName: "Appre_tab",
      jsonField: "appre_fds",
      idField: "appreciation_id",
    };
  }
  throw new Error("Unsupported application type");
}

async function updateFdsParameters(client, parameters, clarification_id, user, status) {
  let wasUpdated = false;


  for (const param of parameters) {
    if (param.clarification_id == clarification_id) {
      wasUpdated = true;


      const updatedParam = {
        last_clarification_handled_by: user.user_role,
        last_clarification_status: status,
        last_clarification_id: clarification_id,
      };


      if (status === "rejected") {
        updatedParam.approved_marks = 8; // or keep existing logic
        updatedParam.approved_by_role = user.user_role;
        updatedParam.approved_by_user = user.id;
        updatedParam.approved_marks_at = new Date();
      } else {

        updatedParam.approved_marks = null;
        updatedParam.approved_by_role = null;
        updatedParam.approved_by_user = null;
        updatedParam.approved_marks_at = null;
      }


      await client.query(
        `
        UPDATE fds_parameters
        SET
          last_clarification_handled_by = $1,
          last_clarification_status = $2,
          last_clarification_id = $3,
          approved_marks = $4,
          approved_by_role = $5,
          approved_by_user = $6,
          approved_marks_at = $7,
          clarification_id = NULL,   -- clear the clarification_id
          updated_at = NOW()
        WHERE clarification_id = $8
        `,
        [
          updatedParam.last_clarification_handled_by,
          updatedParam.last_clarification_status,
          updatedParam.last_clarification_id,
          updatedParam.approved_marks,
          updatedParam.approved_by_role,
          updatedParam.approved_by_user,
          updatedParam.approved_marks_at,
          clarification_id,
        ]
      );
      

      Object.assign(param, updatedParam);
    }
  }

  return { wasUpdated };
}


async function updateFdsInApplication(
  client,
  tableName,
  jsonField,
  idField,
  id,
  fds
) {
  await client.query(
    `UPDATE ${tableName} SET ${jsonField} = $1 WHERE ${idField} = $2`,
    [fds, id]
  );
}

async function logClarificationAction(client, clarification_id) {
  const entry = {
    clarification_id,
    removed_at: new Date().toISOString(),
    action: "clarification_id_clarified",
  };
  await client.query(
    `UPDATE Clarification_tab
     SET clarified_history = COALESCE(clarified_history, '[]'::jsonb) || $1::jsonb
     WHERE clarification_id = $2`,
    [JSON.stringify([entry]), clarification_id]
  );
}

/**
 * Validates approved count and marks against the original parameter data
 * Uses the same Math.min logic as citation/appreciation validation
 * @param {Object} client - Database client
 * @param {string} application_type - Type of application (citation/appreciation)
 * @param {number} application_id - ID of the application
 * @param {string} parameter_id - ID of the parameter
 * @param {string|number} approved_count - The approved count value
 * @param {string|number} approved_marks - The approved marks value
 * @returns {Object} - Validation result with isValid and message
 */
async function validateApprovedCountAndMarks(client, application_type, application_id, parameter_id, approved_count, approved_marks) {
  try {
    const table = application_type === "citation" ? "Citation_tab" : "Appre_tab";
    const jsonColumn = application_type === "citation" ? "citation_fds" : "appre_fds";
    const idField = application_type === "citation" ? "citation_id" : "appreciation_id";

    const fds = await (async () => {
      const appQuery = `SELECT ${jsonColumn} FROM ${table} WHERE ${idField} = $1`;
      const appRes = await client.query(appQuery, [application_id]);
      if (appRes.rowCount === 0) return null;
      return appRes.rows[0][jsonColumn];
    })();
    if (!fds || !Array.isArray(fds?.parameters)) {
      return { isValid: false, message: "Application parameters not found" };
    }

    const parameter = fds.parameters.find((param) => param.id === parameter_id);
    if (!parameter) return { isValid: false, message: "Parameter not found" };

    const approvedCountNum = Number(approved_count) || 0;
    const approvedMarksNum = Number(approved_marks) || 0;
    const originalCount = Number(parameter.count) || 0;
    const maxMarks = Number(parameter.max_marks) || 0;
    const perUnitMark = Number(parameter.per_unit_mark) || 0;

    const invalidCount = approved_count !== undefined && (isNaN(approvedCountNum) || approvedCountNum < 0);
    if (invalidCount) return { isValid: false, message: "Approved count must be a valid non-negative number" };

    const invalidMarks = approved_marks !== undefined && (isNaN(approvedMarksNum) || approvedMarksNum < 0);
    if (invalidMarks) return { isValid: false, message: "Approved marks must be a valid non-negative number" };

    if (approved_count !== undefined && approved_marks !== undefined) {
      const calculatedMarks = Math.min(approvedCountNum * perUnitMark, maxMarks);
      if (Math.abs(approvedMarksNum - calculatedMarks) > 0.01) {
        return { isValid: false, message: `Approved marks (${approvedMarksNum}) should be ${calculatedMarks} based on approved count (${approvedCountNum})` };
      }
    }

    if (approved_count !== undefined && approvedCountNum > originalCount) {
      return { isValid: false, message: `Approved count (${approvedCountNum}) cannot exceed original count (${originalCount})` };
    }
    if (approved_marks !== undefined && approvedMarksNum > maxMarks) {
      return { isValid: false, message: `Approved marks (${approvedMarksNum}) cannot exceed maximum marks (${maxMarks})` };
    }
    return { isValid: true, message: "Approved marks are valid" };
  } catch (error) {
    return { isValid: false, message: "Error validating approved marks" };
  }
}

exports.getAllApplicationsWithClarificationsForUnit = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const unitId = user.unit_id;
    const { award_type, search, page = 1, limit = 10 } = query;


    const citationQuery = `
        SELECT 
          citation_id AS id,
          'citation' AS type,
          unit_id,
          date_init,
          status_flag
        FROM Citation_tab
        WHERE unit_id = $1
      `;

    const appreQuery = `
        SELECT 
          appreciation_id AS id,
          'appreciation' AS type,
          unit_id,
          date_init,
          status_flag
        FROM Appre_tab
        WHERE unit_id = $1
      `;

    const citations = await client.query(citationQuery, [unitId]);
    const appreciations = await client.query(appreQuery, [unitId]);

    let allApps = [...citations.rows, ...appreciations.rows];
    allApps=await attachFdsToApplications(allApps)

    if (award_type) {
      allApps = allApps.filter(
        (app) => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }


    const normalize = (str) =>
      str?.toString().toLowerCase().replace(/[\s-]/g, "");
    
    if (search) {
      const searchLower = normalize(search);
      allApps = allApps.filter((app) => {
        const idMatch = app.id.toString().toLowerCase().includes(searchLower);
        const cycleMatch = normalize(app.fds?.cycle_period || "").includes(searchLower);
        

        const awardTypeMatch = normalize(app.fds?.award_type || "").includes(searchLower);
        const commandMatch = normalize(app.fds?.command || "").includes(searchLower);
        const brigadeMatch = normalize(app.fds?.brigade || "").includes(searchLower);
        const divisionMatch = normalize(app.fds?.division || "").includes(searchLower);
        const corpsMatch = normalize(app.fds?.corps || "").includes(searchLower);
        const unitTypeMatch = normalize(app.fds?.unit_type || "").includes(searchLower);
        const matrixUnitMatch = normalize(app.fds?.matrix_unit || "").includes(searchLower);
        const locationMatch = normalize(app.fds?.location || "").includes(searchLower);
        
        return idMatch || cycleMatch || awardTypeMatch || commandMatch || brigadeMatch || 
               divisionMatch || corpsMatch || unitTypeMatch || matrixUnitMatch || locationMatch;
      });
    }


    const clarificationIdSet = new Set();
    allApps.forEach((app) => {
      app.fds?.parameters?.forEach((param) => {
        if (param.clarification_id) {
          clarificationIdSet.add(param.clarification_id);
        }
      });
    });
    const clarificationIds = Array.from(clarificationIdSet);

    let clarificationsMap = {};
    if (clarificationIds.length > 0) {
      const clarRes = await client.query(
        `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
        [clarificationIds]
      );
      clarificationsMap = clarRes.rows.reduce((acc, row) => {
        acc[row.clarification_id] = row;
        return acc;
      }, {});
    }


    allApps = allApps.map((app) => {
      const updatedParams = app.fds?.parameters?.map((param) => {
        if (param.clarification_id) {
          return {
            ...param,
            clarification: clarificationsMap[param.clarification_id] || null,
          };
        }
        return param;
      });

      return {
        ...app,
        fds: {
          ...app.fds,
          parameters: updatedParams,
        },
      };
    });


    if (user.user_role === "unit") {
      allApps = allApps.map(({ status_flag, ...rest }) => rest);
    }


    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));


    const filteredApplications = allApps.filter((app) =>
      app.fds?.parameters?.some(
        (param) =>
          param.clarification?.clarification_by_role?.toLowerCase() ===
          "brigade"
      )
    );


    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const totalItems = filteredApplications.length;
    const totalPages = Math.ceil(totalItems / limitInt);
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = startIndex + limitInt;

    const paginatedData = filteredApplications.slice(startIndex, endIndex);

    const pagination = {
      totalItems,
      totalPages,
      currentPage: pageInt,
      itemsPerPage: limitInt,
    };

    return ResponseHelper.success(
      200,
      "Fetched applications with clarifications",
      paginatedData,
      pagination
    );
  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch data", err.message);
  } finally {
    client.release();
  }
};

exports.getAllApplicationsWithClarificationsForSubordinates = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role, unit_id } = user;
    const { award_type, search, page = 1, limit = 10 } = query;

    const roleHierarchy = ["unit", "brigade", "division", "corps", "command"];
    const currentRoleIndex = roleHierarchy.indexOf(user_role.toLowerCase());

    if (currentRoleIndex === -1 || currentRoleIndex >= roleHierarchy.length - 1) {
      return ResponseHelper.error(400, "Invalid or top-level role");
    }

    const seniorRole = roleHierarchy[currentRoleIndex + 1];
    const matchingField = { brigade: "bde", division: "div", corps: "corps", command: "comd" }[user_role.toLowerCase()];

    const ownUnitData = await getOwnUnitData(client, unit_id);
    if (!ownUnitData) return ResponseHelper.error(404, "Unit not found");

    const clarifications = await fetchPendingClarifications(client, seniorRole);
    const responseData = await buildResponseData(client, clarifications, ownUnitData.name, matchingField);

    const filteredData = filterAndSortApplications(responseData, award_type, search);

    const paginatedData = paginateData(filteredData, page, limit);
    const pagination = {
      totalItems: filteredData.length,
      totalPages: Math.ceil(filteredData.length / limit),
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
    };

    return ResponseHelper.success(
      200,
      "Fetched pending clarifications",
      paginatedData,
      pagination
    );
  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch clarifications", err.message);
  } finally {
    client.release();
  }
};

async function getOwnUnitData(client, unit_id) {
  const res = await client.query(`SELECT * FROM Unit_tab WHERE unit_id = $1`, [unit_id]);
  return res.rows[0] || null;
}

async function fetchPendingClarifications(client, seniorRole) {
  const res = await client.query(
    `SELECT * FROM Clarification_tab WHERE clarification_by_role = $1 AND clarification_status = 'pending'`,
    [seniorRole]
  );
  return res.rows;
}

async function buildResponseData(client, clarifications, ownUnitName, matchingField) {
  const responseData = [];

  const tableMap = {
    citation: { table: "Citation_tab", idField: "citation_id" },
    appreciation: { table: "Appre_tab", idField: "appreciation_id" },
  };

  for (const clarification of clarifications) {
    const { application_type, application_id, parameter_name } = clarification;
    const { table, idField } = tableMap[application_type];


    const appRes = await client.query(
      `SELECT * FROM ${table} WHERE ${idField} = $1`,
      [application_id]
    );
    let application = appRes.rows[0];


    const unitRes = await client.query(
      `SELECT * FROM Unit_tab WHERE unit_id = $1`,
      [application.unit_id]
    );
    const unit = unitRes.rows[0];
    if (!application || !unit) continue;

    application = await attachSingleFdsToApplication(application);
    const fds = application?.fds;
    let clarifications_count = 0;

    if (Array.isArray(fds.parameters)) {
      fds.parameters = fds.parameters.map(param => {
        if (param.name === parameter_name) {
          clarifications_count++;
          return {
            ...param,
            clarification_id: clarification.clarification_id,
            last_clarification_status: clarification.clarification_status,
            last_clarification_handled_by: clarification.clarification_by_role,
            clarification,
          };
        }
        return param;
      });
    }

    responseData.push({
      id: application[idField],
      type: application_type,
      unit_id: application.unit_id,
      date_init: application.date_init,
      clarifications_count,
      fds,
    });
  }

  return responseData;
}

function filterAndSortApplications(data, award_type, search) {
  let filtered = data;

  if (award_type) {
    filtered = filtered.filter(
      app => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
    );
  }

  if (search) {
    const normalize = (str) =>
      str?.toString().toLowerCase().replace(/[\s-]/g, "");
    const searchNorm = normalize(search);
    filtered = filtered.filter(app => {
      return app.id.toString().toLowerCase().includes(searchNorm) ||
        normalize(app.fds?.cycle_period || "").includes(searchNorm);
    });
  }

  return filtered.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
}

function paginateData(data, page, limit) {
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const start = (pageInt - 1) * limitInt;
  const end = pageInt * limitInt;
  return data.slice(start, end);
}
