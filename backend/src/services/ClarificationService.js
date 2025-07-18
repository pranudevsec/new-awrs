const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");

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

    // Choose table and column based on type
    const table = type === "citation" ? "Citation_tab" : "Appre_tab";
    const jsonColumn = type === "citation" ? "citation_fds" : "appre_fds";

    // Get the current JSON field
    const selectQuery = `SELECT ${jsonColumn} FROM ${table} WHERE ${type}_id = $1 FOR UPDATE`;
    const jsonResult = await client.query(selectQuery, [application_id]);

    if (jsonResult.rowCount === 0) {
      throw new Error(`${type} record not found`);
    }

    const fds = jsonResult.rows[0][jsonColumn];

    // Modify the correct parameter
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

    // Update the table with new JSON
    const updateQuery = `
        UPDATE ${table}
        SET ${jsonColumn} = $1::jsonb
        WHERE ${type}_id = $2;
      `;
    await client.query(updateQuery, [
      JSON.stringify(updatedFds),
      application_id,
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

    const { application_type, application_id } = clarificationRow;
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
// START HELPER OF updateClarification
async function fetchClarificationRow(client, clarification_id) {
  const res = await client.query(
    `SELECT * FROM Clarification_tab WHERE clarification_id = $1`,
    [clarification_id]
  );
  return res.rowCount > 0 ? res.rows[0] : null;
}

function buildUpdateFields(user, data) {
  const { clarification, clarification_doc, clarification_status } = data;
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

  const appRes = await client.query(appQuery, [id]);
  if (appRes.rowCount === 0) return;

  const fds = appRes.rows[0][jsonField];
  if (!Array.isArray(fds?.parameters)) return;

  const updatedParams = updateFdsParameters(
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
      appQuery: `SELECT citation_fds FROM Citation_tab WHERE citation_id = $1`,
      tableName: "Citation_tab",
      jsonField: "citation_fds",
      idField: "citation_id",
    };
  } else if (application_type === "appreciation") {
    return {
      appQuery: `SELECT appre_fds FROM Appre_tab WHERE appreciation_id = $1`,
      tableName: "Appre_tab",
      jsonField: "appre_fds",
      idField: "appreciation_id",
    };
  }
  throw new Error("Unsupported application type");
}

function updateFdsParameters(parameters, clarification_id, user, status) {
  let wasUpdated = false;
  const updatedParams = parameters.map((param) => {
    if (param.clarification_id == clarification_id) {
      wasUpdated = true;
      const { clarification_id, ...rest } = param;
      const updatedParam = {
        ...rest,
        last_clarification_handled_by: user.user_role,
        last_clarification_status: status,
        last_clarification_id: clarification_id,
      };

      if (status === "rejected") {
        return {
          ...updatedParam,
          approved_marks: "8",
          approved_by_role: user.user_role,
          approved_by_user: user.id,
          approved_marks_at: new Date().toISOString(),
        };
      } else {
        const {
          approved_marks,
          approved_by_role,
          approved_by_user,
          approved_marks_at,
          ...cleanedParam
        } = updatedParam;
        return cleanedParam;
      }
    }
    return param;
  });
  parameters.splice(0, parameters.length, ...updatedParams);
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
// END HELPER OF updateClarification

exports.getAllApplicationsWithClarificationsForUnit = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const unitId = user.unit_id;
    const { award_type, search, page = 1, limit = 10 } = query;

    // Fetch citations
    const citationQuery = `
        SELECT 
          citation_id AS id,
          'citation' AS type,
          unit_id,
          date_init,
          citation_fds AS fds,
          status_flag
        FROM Citation_tab
        WHERE unit_id = $1
      `;
    // Fetch appreciations
    const appreQuery = `
        SELECT 
          appreciation_id AS id,
          'appreciation' AS type,
          unit_id,
          date_init,
          appre_fds AS fds,
          status_flag
        FROM Appre_tab
        WHERE unit_id = $1
      `;

    const citations = await client.query(citationQuery, [unitId]);
    const appreciations = await client.query(appreQuery, [unitId]);

    let allApps = [...citations.rows, ...appreciations.rows];

    // Filter by award_type if given
    if (award_type) {
      allApps = allApps.filter(
        (app) => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }

    // Filter by search keyword
    const normalize = (str) =>
      str?.toString().toLowerCase().replace(/[\s-]/g, "");
    
    if (search) {
      const searchLower = normalize(search);
      allApps = allApps.filter((app) => {
        const idMatch = app.id.toString().toLowerCase().includes(searchLower);
        const cycleMatch = normalize(app.fds?.cycle_period || "").includes(
          searchLower
        );
        return idMatch || cycleMatch;
      });
    }

    // Gather all clarification_ids from parameters
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

    // Inject clarification data into parameters
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

    // Remove status_flag for 'unit' users
    if (user.user_role === "unit") {
      allApps = allApps.map(({ status_flag, ...rest }) => rest);
    }

    // Sort by date_init descending
    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    // Filter to only apps where any parameter's clarification is by role 'brigade'
    const filteredApplications = allApps.filter((app) =>
      app.fds?.parameters?.some(
        (param) =>
          param.clarification?.clarification_by_role?.toLowerCase() ===
          "brigade"
      )
    );

    // --- Pagination Logic ---
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
    console.error(`[Clarification API] Error: ${err.message}`);
    return ResponseHelper.error(500, "Failed to fetch clarifications", err.message);
  } finally {
    client.release();
  }
};

// START HELPER OF getAllApplicationsWithClarificationsForSubordinates
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
    citation: { table: "Citation_tab", idField: "citation_id", fdsField: "citation_fds" },
    appreciation: { table: "Appre_tab", idField: "appreciation_id", fdsField: "appre_fds" },
  };

  for (const clarification of clarifications) {
    const { application_type, application_id, parameter_name } = clarification;
    const { table, idField, fdsField } = tableMap[application_type];

    const [appRes, unitRes] = await Promise.all([
      client.query(`SELECT * FROM ${table} WHERE ${idField} = $1`, [application_id]),
      client.query(`SELECT * FROM Unit_tab WHERE unit_id = (SELECT unit_id FROM ${table} WHERE ${idField} = $1)`, [application_id]),
    ]);

    const application = appRes.rows[0];
    const unit = unitRes.rows[0];
    if (!application || !unit || unit[matchingField] !== ownUnitName) continue;

    const fds = typeof application[fdsField] === "string" ? JSON.parse(application[fdsField]) : application[fdsField];
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
// END HELPER OF getAllApplicationsWithClarificationsForSubordinates
