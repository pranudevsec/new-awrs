const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");
const { application } = require("express");

exports.getAllApplicationsForUnit = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const unitId = user.unit_id;
    const { award_type, search, page = 1, limit = 10 } = query;

    const citations = await client.query(
      `
      SELECT 
        citation_id AS id,
        'citation' AS type,
        unit_id,
        date_init,
        citation_fds AS fds,
        status_flag
      FROM Citation_tab
      WHERE unit_id = $1
    `,
      [unitId]
    );

    const appreciations = await client.query(
      `
      SELECT 
        appreciation_id AS id,
        'appreciation' AS type,
        unit_id,
        date_init,
        appre_fds AS fds,
        status_flag
      FROM Appre_tab
      WHERE unit_id = $1
    `,
      [unitId]
    );

    let allApps = [...citations.rows, ...appreciations.rows];

    if (award_type) {
      allApps = allApps.filter(
        (app) => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }

    function normalize(input) {
      if (input == null) return "";
      const str = String(input).toLowerCase();
      return str.split(/[\s-]+/).join("");
    }
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
      allApps = allApps.map(({ status_flag, ...rest }) => {
        if (status_flag === "draft") {
          return { status_flag, ...rest };
        }
        return rest;
      });
    }
    let total_pending_clarifications = 0;
    allApps = allApps.map((app) => {
      let clarifications_count = 0;
      const cleanedParameters = app.fds.parameters.map((param) => {
        const newParam = { ...param };
        if (newParam.clarification?.clarification_status === "pending") {
          clarifications_count++;
          total_pending_clarifications++;
        }
        delete newParam.clarification;
        delete newParam.clarification_id;
        return newParam;
      });

      return {
        ...app,
        clarifications_count,
        total_pending_clarifications,
        fds: {
          ...app.fds,
          parameters: cleanedParameters,
        },
      };
    });

    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    // ✅ Pagination logic
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = pageInt * limitInt;

    const paginatedData = allApps.slice(startIndex, endIndex);

    const pagination = {
      totalItems: allApps.length,
      totalPages: Math.ceil(allApps.length / limitInt),
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

exports.getAllApplicationsForHQ = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { award_type, search, page = 1, limit = 10 } = query;

    const citations = await client.query(`
      SELECT 
        citation_id AS id,
        'citation' AS type,
        unit_id,
        date_init,
        citation_fds AS fds,
        status_flag,
        last_approved_by_role,
        is_hr_review,
        is_dv_review,
        is_mp_review
      FROM Citation_tab
      WHERE 
        status_flag = 'approved' 
        AND last_approved_by_role = 'command'
    `);

    const appreciations = await client.query(`
      SELECT 
        appreciation_id AS id,
        'appreciation' AS type,
        unit_id,
        date_init,
        appre_fds AS fds,
        status_flag,
        last_approved_by_role,
        is_hr_review,
        is_dv_review,
        is_mp_review
      FROM Appre_tab
      WHERE 
        status_flag = 'approved' 
        AND last_approved_by_role = 'command'
    `);

    let allApps = [...citations.rows, ...appreciations.rows];

    // Filter by award_type if provided
    if (award_type) {
      allApps = allApps.filter(
        (app) => app.type?.toLowerCase() === award_type.toLowerCase()
      );
    }

    // Normalize and filter by search if provided
    const normalize = (str) =>
      str
        ?.toString()
        .toLowerCase()
        .replace(/[\s-]/g, "");

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

    // ✅ Additional filtering based on CW2 role and type
    if (user.user_role === "cw2") {
      const cw2TypeFieldMap = {
        hr: "is_hr_review",
        dv: "is_dv_review",
        mp: "is_mp_review",
      };

      const fieldToCheck = cw2TypeFieldMap[user.cw2_type];
      if (fieldToCheck) {
        allApps = allApps.filter((app) => app[fieldToCheck] === true);
      }
    }

    // Gather clarification IDs
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

    // Attach clarifications to parameters
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

    // Count and clean clarifications
    let total_pending_clarifications = 0;
    allApps = allApps.map((app) => {
      let clarifications_count = 0;
      const cleanedParameters = app.fds.parameters.map((param) => {
        const newParam = { ...param };
        if (newParam.clarification?.clarification_status === "pending") {
          clarifications_count++;
          total_pending_clarifications++;
        }
        delete newParam.clarification;
        delete newParam.clarification_id;
        return newParam;
      });

      return {
        ...app,
        clarifications_count,
        total_pending_clarifications,
        fds: {
          ...app.fds,
          parameters: cleanedParameters,
        },
      };
    });

    // Sort descending by date_init
    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    // Pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = pageInt * limitInt;

    const paginatedData = allApps.slice(startIndex, endIndex);
    const pagination = {
      totalItems: allApps.length,
      totalPages: Math.ceil(allApps.length / limitInt),
      currentPage: pageInt,
      itemsPerPage: limitInt,
    };

    return ResponseHelper.success(
      200,
      "Fetched HQ applications approved by command",
      paginatedData,
      pagination
    );
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to fetch HQ applications",
      err.message
    );
  } finally {
    client.release();
  }
};

exports.getSingleApplicationForUnit = async (
  user,
  { application_id, award_type }
) => {
  const client = await dbService.getClient();

  try {
    let table = null;

    if (award_type === "citation") {
      table = {
        tab: "Citation_tab",
        idCol: "citation_id",
        fdsCol: "citation_fds",
        alias: "c"
      };
    } else if (award_type === "appreciation") {
      table = {
        tab: "Appre_tab",
        idCol: "appreciation_id",
        fdsCol: "appre_fds",
        alias: "a"
      };
    }
    
    if (!table) {
      return ResponseHelper.error(400, "Invalid award_type provided");
    }

    const baseFields = `
      ${table.alias}.unit_id,
      u.name AS unit_name,
      ${table.alias}.date_init,
      ${table.alias}.${table.fdsCol} AS fds,
      ${table.alias}.last_approved_by_role,
      ${table.alias}.last_approved_at,
      ${table.alias}.status_flag,
      ${table.alias}.isShortlisted,
      ${table.alias}.is_mo_approved,
      ${table.alias}.mo_approved_at,
      ${table.alias}.is_ol_approved,
      ${table.alias}.ol_approved_at,
      ${table.alias}.is_hr_review,
      ${table.alias}.is_dv_review,
      ${table.alias}.is_mp_review,
      ${table.alias}.remarks
    `;

    const query = `
      SELECT 
        ${table.alias}.${table.idCol} AS id,
        '${award_type}' AS type,
        ${baseFields}
      FROM ${table.tab} ${table.alias}
      JOIN Unit_tab u ON ${table.alias}.unit_id = u.unit_id
      WHERE ${table.alias}.${table.idCol} = $1
    `;

    const res = await client.query(query, [application_id]);
    const application = res.rows[0];

    if (!application) {
      return ResponseHelper.error(404, "Application not found");
    }

    const roleHierarchy = ["unit", "brigade", "division", "corps", "command"];
    const userRoleIndex = roleHierarchy.indexOf(user.user_role?.toLowerCase());
    const fds = application.fds;

    for (const param of fds.parameters) {
      const clarId = param.clarification_id || param.last_clarification_id;
      if (!clarId) continue;

      const clarRes = await client.query(
        `SELECT
          clarification_id, application_type, application_id, parameter_name,
          clarification_by_id, clarification_by_role, clarification_status,
          reviewer_comment, clarification, clarification_doc, clarified_history,
          clarification_sent_at, clarified_at
        FROM Clarification_tab WHERE clarification_id = $1`,
        [clarId]
      );

      param.clarification_details = clarRes.rows[0] || null;

      const clarRoleIndex = roleHierarchy.indexOf(
        param.clarification_details?.clarification_by_role?.toLowerCase()
      );

      if (clarRoleIndex >= 0 && userRoleIndex > clarRoleIndex) {
        delete param.clarification_id;
        delete param.last_clarification_id;
        delete param.clarification_details;
      }
    }

    application.fds = fds;

    return ResponseHelper.success(200, "Fetched single application", application);

  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch application", err.message);
  } finally {
    client.release();
  }
};

// END HELPER OF getSingleApplicationForUnit

exports.getApplicationsOfSubordinates = async (user, query) => {
  const client = await dbService.getClient();

  try {
    const { user_role } = user;
    const {
      award_type,
      search,
      page = 1,
      limit = 10,
      isShortlisted,
      isGetNotClarifications,
    } = query;

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    validateUnitProfile(user_role, unit);

    const unitIds = await getSubordinateUnitIds(client, user_role, unit);
    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No subordinate units found", [], {
        totalItems: 0,
      });
    }

    const baseFilters = buildBaseFilters(user, unitIds, query);
    const queryParams = buildQueryParams(user, unitIds, query);

    const allApps = await fetchApplications(client, baseFilters, queryParams);

    let processedApps = await processApplications(
      client,
      allApps,
      award_type,
      search,
      isShortlisted,
      user_role
    );

    if (isGetNotClarifications) {
      processedApps = processedApps.filter(
        (app) => app.clarifications_count === 0
      );
    }

    processedApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    const paginatedData = paginate(processedApps, page, limit);

    return ResponseHelper.success(
      200,
      "Fetched subordinate applications",
      paginatedData.items,
      paginatedData.meta
    );
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to fetch subordinate applications",
      err.message
    );
  } finally {
    client.release();
  }
};

// START HELPER OF Subordinates
function validateUnitProfile(user_role, unit) {
  const roleFieldRequirements = {
    unit: ["bde", "div", "corps", "comd", "name"],
    brigade: ["div", "corps", "comd", "name"],
    division: ["corps", "comd", "name"],
    corps: ["comd", "name"],
    command: ["name"],
  };
  const requiredFields = roleFieldRequirements[user_role.toLowerCase()] || [];
  const missingFields = requiredFields.filter(
    (field) => !unit?.[field] || unit[field] === ""
  );
  if (missingFields.length > 0) {
    throw new Error("Please complete your unit profile before proceeding.");
  }
}

async function getSubordinateUnitIds(client, user_role, unit) {
  const hierarchy = ["unit", "brigade", "division", "corps", "command"];
  const currentIndex = hierarchy.indexOf(user_role.toLowerCase());

  if (currentIndex === -1 || currentIndex === 0) {
    throw new Error("Invalid or lowest level user role");
  }

  const subordinateFieldMap = {
    brigade: "bde",
    division: "div",
    corps: "corps",
    command: "comd",
  };
  const matchField = subordinateFieldMap[user_role.toLowerCase()];

  if (!matchField || !unit?.name) {
    throw new Error("Unit data or hierarchy mapping missing");
  }

  const subUnitsRes = await client.query(
    `SELECT unit_id FROM Unit_tab WHERE ${matchField} = $1`,
    [unit.name]
  );

  return subUnitsRes.rows.map((u) => u.unit_id);
}

function buildBaseFilters(user, unitIds, query) {
  const { user_role } = user;
  const { isShortlisted, isGetWithdrawRequests } = query;

  if (isGetWithdrawRequests) {
    return `
      unit_id = ANY($1) AND (
        (
          is_withdraw_requested = TRUE AND withdraw_status = 'pending'
        )
        OR
        (
          withdraw_approved_by_role = $2 
          AND withdraw_approved_by_user_id = $3 
          AND (status_flag = 'approved' OR status_flag = 'rejected' OR status_flag = 'withdrawed')
        )
      )
      AND status_flag IN ('approved', 'withdrawed')
      AND last_approved_by_role = $4
    `;
  }

  if (isShortlisted && user_role.toLowerCase() === "command") {
    return `
      unit_id = ANY($1)
      AND (
        (status_flag = 'shortlisted_approved' AND last_shortlisted_approved_role = $2)
        OR
        (status_flag = 'approved' AND last_approved_by_role = $2)
      )
    `;
  }

  if (isShortlisted) {
    return `
      unit_id = ANY($1)
      AND status_flag = 'shortlisted_approved'
      AND last_shortlisted_approved_role = $2
    `;
  }

  if (user_role.toLowerCase() === "brigade") {
    return `unit_id = ANY($1) AND status_flag NOT IN ('approved', 'draft', 'shortlisted_approved', 'rejected') AND (last_approved_by_role IS NULL OR last_approved_at IS NULL)`;
  }

  return `unit_id = ANY($1) AND status_flag = 'approved' AND status_flag NOT IN ('draft', 'shortlisted_approved', 'rejected') AND last_approved_by_role = $2`;
}

function buildQueryParams(user, unitIds, query) {
  const { user_role, user_id } = user;
  const { isShortlisted, isGetWithdrawRequests } = query;
  const params = [unitIds];

  if (isGetWithdrawRequests) {
    const lowerRole = getLowerRole(user_role);
    params.push(user_role, user_id, lowerRole);
  } else if (isShortlisted || user_role.toLowerCase() !== "brigade") {
    params.push(user_role.toLowerCase() === "brigade" ? null : getLowerRole(user_role));
  }

  return params;
}

function getLowerRole(user_role) {
  const hierarchy = ["unit", "brigade", "division", "corps", "command"];
  const index = hierarchy.indexOf(user_role.toLowerCase());
  return index > 0 ? hierarchy[index - 1] : null;
}

async function fetchApplications(client, baseFilters, queryParams) {
  const citationQuery = `
    SELECT 
      citation_id AS id,
      'citation' AS type,
      unit_id,
      date_init,
      citation_fds AS fds,
      status_flag,
      last_approved_by_role,
      last_approved_at,
      is_withdraw_requested,
      withdraw_status,
      withdraw_approved_by_role,
      withdraw_approved_by_user_id
    FROM Citation_tab
    WHERE ${baseFilters}`;

  const appreQuery = `
    SELECT 
      appreciation_id AS id,
      'appreciation' AS type,
      unit_id,
      date_init,
      appre_fds AS fds,
      status_flag,
      last_approved_by_role,
      last_approved_at,
      is_withdraw_requested,
      withdraw_status,
      withdraw_approved_by_role,
      withdraw_approved_by_user_id
    FROM Appre_tab
    WHERE ${baseFilters}`;

  const [citations, appreciations] = await Promise.all([
    client.query(citationQuery, queryParams),
    client.query(appreQuery, queryParams),
  ]);

  return [...citations.rows, ...appreciations.rows];
}

async function processApplications(
  client,
  apps,
  award_type,
  search,
  isShortlisted,
  user_role
) {
  let filteredApps = apps;

  if (award_type) {
    filteredApps = filteredApps.filter(
      (app) =>
        app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
    );
  }

  if (search) {
    const normalize = (str) =>
      str ? str.toString().toLowerCase().split(/[\s-]+/).join("") : "";
    const searchLower = normalize(search);
    filteredApps = filteredApps.filter((app) => {
      const idMatch = app.id.toString().includes(searchLower);
      const cycleMatch = normalize(app.fds?.cycle_period || "").includes(
        searchLower
      );
      return idMatch || cycleMatch;
    });
  }

  // Clarifications
  const clarificationIds = [];
  filteredApps.forEach((app) =>
    app.fds?.parameters?.forEach((p) => {
      if (p.clarification_id) clarificationIds.push(p.clarification_id);
    })
  );

  let clarificationMap = {};
  if (clarificationIds.length > 0) {
    const clarificationsRes = await client.query(
      `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
      [clarificationIds]
    );
    clarificationMap = clarificationsRes.rows.reduce((acc, cur) => {
      acc[cur.clarification_id] = cur;
      return acc;
    }, {});
  }

  let total_pending_clarifications = 0;
  filteredApps = filteredApps.map((app) => {
    let clarifications_count = 0;
    const updatedParams = app.fds?.parameters.map((param) => {
      if (
        clarificationMap[param.clarification_id]?.clarification_status ===
        "pending"
      ) {
        clarifications_count++;
        total_pending_clarifications++;
      }
      const { clarification, ...rest } = param;
      return { ...rest };
    });
    return {
      ...app,
      clarifications_count,
      total_pending_clarifications,
      fds: { ...app.fds, parameters: updatedParams },
    };
  });

  if (isShortlisted) {
    filteredApps = await enrichShortlistedApps(client, filteredApps, user_role);
  }

  return filteredApps;
}

async function enrichShortlistedApps(client, apps, user_role) {
  const unitIdSet = [...new Set(apps.map((app) => app.unit_id))];
  const unitDetailsRes = await client.query(
    `SELECT * FROM Unit_tab WHERE unit_id = ANY($1)`,
    [unitIdSet]
  );
  const unitDetailsMap = unitDetailsRes.rows.reduce((acc, unit) => {
    acc[unit.unit_id] = unit;
    return acc;
  }, {});

  const allParamNames = Array.from(
    new Set(
      apps.flatMap((app) =>
        app.fds?.parameters?.map((p) => p.name.trim().toLowerCase()) || []
      )
    )
  );

  const parameterMasterRes = await client.query(
    `SELECT name, negative FROM Parameter_Master WHERE LOWER(TRIM(name)) = ANY($1)`,
    [allParamNames]
  );

  const negativeParamMap = parameterMasterRes.rows.reduce((acc, row) => {
    acc[row.name.trim().toLowerCase()] = row.negative;
    return acc;
  }, {});

  const hierarchy = ["unit", "brigade", "division", "corps", "command"];
  const currentRole = user_role.toLowerCase();
  const lowerRole =
    hierarchy[hierarchy.indexOf(currentRole) - 1] || "unit";

  return apps
    .map((app) => {
      const params = app.fds?.parameters || [];
      const totalMarks = params.reduce(
        (sum, p) => sum + (p.marks || 0),
        0
      );
      const totalNegativeMarks = params.reduce(
        (sum, p) =>
          negativeParamMap[p.name.trim().toLowerCase()]
            ? sum + (p.marks || 0)
            : sum,
        0
      );
      const netMarks = totalMarks - totalNegativeMarks;
      return {
        ...app,
        unit_details: unitDetailsMap[app.unit_id] || null,
        totalMarks,
        totalNegativeMarks,
        netMarks,
      };
    })
    .sort((a, b) => {
      const aPriority =
        a.fds?.applicationPriority?.find((p) => p.role === lowerRole)
          ?.priority ?? Number.MAX_SAFE_INTEGER;
      const bPriority =
        b.fds?.applicationPriority?.find((p) => p.role === lowerRole)
          ?.priority ?? Number.MAX_SAFE_INTEGER;
      return aPriority - bPriority;
    });
}

function paginate(data, page, limit) {
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const start = (pageInt - 1) * limitInt;
  return {
    items: data.slice(start, start + limitInt),
    meta: {
      totalItems: data.length,
      totalPages: Math.ceil(data.length / limitInt),
      currentPage: pageInt,
      itemsPerPage: limitInt,
    },
  };
}
// END HELPER OF Subordinates

exports.getApplicationsScoreboard = async (user, query) => {
  const client = await dbService.getClient();

  try {
    const { user_role } = user;
    const { award_type, search, page = 1, limit = 10 } = query;
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    if (!["command", "headquarter"].includes(user_role.toLowerCase())) {
      return ResponseHelper.error(
        403,
        "Access denied. Only 'command' and 'headquarter' roles allowed."
      );
    }

    const isCommand = user_role.toLowerCase() === "command";
    const unitIds = isCommand ? await getUnitIdsForCommand(client, user) : [];

    if (isCommand && unitIds.length === 0) {
      return emptyPaginationResponse(pageInt, limitInt, "No subordinate units found");
    }

    const countValues = isCommand ? [unitIds] : [];
    if (award_type) countValues.push(award_type);
    if (search) countValues.push(`%${search.toLowerCase()}%`);

    const [citationCount, appreCount] = await Promise.all([
      client.query(buildCountQuery("Citation_tab", "citation_fds", isCommand), countValues),
      client.query(buildCountQuery("Appre_tab", "appre_fds", isCommand), countValues),
    ]);

    const totalItems = parseInt(citationCount.rows[0].count) + parseInt(appreCount.rows[0].count);
    if (totalItems === 0) {
      return emptyPaginationResponse(pageInt, limitInt, "No applications found");
    }

    const dataQuery = buildDataQuery(isCommand, award_type, search);
    const dataResult = await client.query(dataQuery, countValues);

    let apps = dataResult.rows;

    apps = await fetchClarificationsAndMap(client, apps);
    apps = await computeMarksAndSort(client, apps, user_role);

    const paginatedApps = apps.slice(offset, offset + limitInt);

    return ResponseHelper.success(
      200,
      "Fetched approved applications",
      paginatedApps,
      {
        totalItems,
        totalPages: Math.ceil(totalItems / limitInt),
        currentPage: pageInt,
        itemsPerPage: limitInt,
      }
    );

  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to fetch scoreboard data",
      err.message
    );
  } finally {
    client.release();
  }
};

// START HELPER OF getApplicationsScoreboard
async function getUnitIdsForCommand(client, user) {
  const profile = await AuthService.getProfile(user);
  const unitName = profile?.data?.unit?.name;
  if (!unitName) throw new Error("Command unit name not found in profile");

  const res = await client.query(
    `SELECT unit_id FROM Unit_tab WHERE comd = $1`,
    [unitName]
  );
  return res.rows.map((u) => u.unit_id);
}

function buildCountQuery(table, fdsField, isCommand) {
  const filter = isCommand
    ? `unit_id = ANY($1) AND status_flag = 'approved' AND last_approved_by_role = 'command'`
    : `status_flag = 'approved' AND last_approved_by_role = 'command'`;

  return `
    SELECT COUNT(*) AS count FROM ${table}
    WHERE ${filter}
    ${award_typeClause(fdsField)}
    ${searchClause(fdsField)}
  `;
}

function buildDataQuery(isCommand, award_type, search) {
  const citationQuery = buildSingleDataQuery("Citation_tab", "c", "citation_fds", "citation_id", isCommand, award_type, search);
  const appreQuery = buildSingleDataQuery("Appre_tab", "a", "appre_fds", "appreciation_id", isCommand, award_type, search);

  return `
    (${citationQuery})
    UNION ALL
    (${appreQuery})
    ORDER BY date_init DESC
  `;
}

function buildSingleDataQuery(table, alias, fdsField, idField, isCommand, award_type, search) {
  const filter = isCommand
    ? `${alias}.unit_id = ANY($1) AND ${alias}.status_flag = 'approved' AND ${alias}.last_approved_by_role = 'command'`
    : `${alias}.status_flag = 'approved' AND ${alias}.last_approved_by_role = 'command'`;

  return `
    SELECT
      ${alias}.${idField} AS id,
      '${table === "Citation_tab" ? "citation" : "appreciation"}' AS type,
      ${alias}.unit_id,
      ${alias}.date_init,
      ${alias}.${fdsField} AS fds,
      ${alias}.status_flag,
      ${alias}.last_approved_by_role,
      ${alias}.last_approved_at,
      ${alias}.isShortlisted,
      u.*
    FROM ${table} ${alias}
    JOIN Unit_tab u ON u.unit_id = ${alias}.unit_id
    WHERE ${filter}
    ${award_typeClause(`${alias}.${fdsField}`)}
    ${searchClause(`${alias}.${fdsField}`, `${alias}.${idField}`)}
  `;
}

function award_typeClause(fdsField) {
  return award_type ? `AND LOWER(${fdsField}->>'award_type') = LOWER($2)` : "";
}

function searchClause(fdsField, idField = "id") {
  if (!search) return "";

  const paramIndex = award_type ? 3 : 2;
  return `AND (CAST(${idField} AS TEXT) ILIKE $${paramIndex} OR LOWER(${fdsField}->>'cycle_period') ILIKE $${paramIndex})`;
}

async function fetchClarificationsAndMap(client, apps) {
  const clarificationIds = apps.flatMap(app =>
    app.fds?.parameters?.filter(p => p.clarification_id).map(p => p.clarification_id) || []
  );

  if (!clarificationIds.length) return apps;

  const clarRes = await client.query(
    `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
    [clarificationIds]
  );

  const clarMap = Object.fromEntries(clarRes.rows.map(c => [c.clarification_id, c]));

  return apps.map(app => ({
    ...app,
    fds: {
      ...app.fds,
      parameters: app.fds?.parameters?.map(param => ({
        ...param,
        clarification_details: param.clarification_id ? clarMap[param.clarification_id] || null : undefined
      })) || []
    }
  }));
}

async function computeMarksAndSort(client, apps, userRole) {
  const allParamNames = Array.from(
    new Set(apps.flatMap(app =>
      app.fds?.parameters?.map(p => p.name?.trim().toLowerCase()) || []
    ))
  );

  const paramMasterRes = await client.query(
    `SELECT name, negative FROM Parameter_Master WHERE LOWER(TRIM(name)) = ANY($1)`,
    [allParamNames]
  );

  const negativeMap = Object.fromEntries(
    paramMasterRes.rows.map(r => [r.name.trim().toLowerCase(), r.negative])
  );

  const role = userRole?.toLowerCase();

  return apps.map(app => {
    const parameters = app.fds?.parameters || [];
    const totalMarks = parameters.reduce((sum, p) => sum + (p.marks || 0), 0);
    const totalNegative = parameters.reduce((sum, p) =>
      negativeMap[p.name?.trim().toLowerCase()] ? sum + (p.marks || 0) : sum, 0);
    const netMarks = totalMarks - totalNegative;
    const priority = app.fds?.applicationPriority?.find(p => p.role?.toLowerCase() === role)?.priority ?? Infinity;

    return {
      ...app,
      totalMarks,
      totalNegativeMarks: totalNegative,
      netMarks,
      priority
    };
  }).sort((a, b) => a.priority - b.priority);
}

function emptyPaginationResponse(page, limit, message) {
  return ResponseHelper.success(200, message, [], {
    totalItems: 0,
    totalPages: 0,
    currentPage: page,
    itemsPerPage: limit,
  });
}
// END HELPER OF getApplicationsScoreboard

exports.updateApplicationStatus = async (
  id,
  type,
  status,
  user,
  member = null,
  withdrawRequested = false,
  withdraw_status = null
) => {
  const client = await dbService.getClient();

  try {
    const validTypes = {
      citation: { table: "Citation_tab", column: "citation_id", fdsColumn: "citation_fds" },
      appreciation: { table: "Appre_tab", column: "appreciation_id", fdsColumn: "appre_fds" },
    };

    const config = validTypes[type];
    if (!config) throw new Error("Invalid application type");

    if (withdrawRequested) {
      return await handleWithdrawRequest(client, config, id, user);
    }

    if (withdraw_status === "approved" || withdraw_status === "rejected") {
      return await handleWithdrawStatusUpdate(client, config, id, user, withdraw_status);
    }

    let isMemberStatusUpdate = false;
    let statusLower = status?.toLowerCase() || null;

    if (statusLower === "approved" || member) {
      const {  isMemberStatusUpdate: memberStatus } = await fetchAndUpdateFds(
        client, config, id, statusLower, member, user
      );
      isMemberStatusUpdate = memberStatus;
    }

    const allowedStatuses = [
      "in_review",
      "in_clarification",
      "approved",
      "rejected",
      "shortlisted_approved",
    ];

    if ((statusLower && allowedStatuses.includes(statusLower)) || isMemberStatusUpdate) {
      return await updateStatusFlag(client, config, id, statusLower || "shortlisted_approved", user);
    }

    if (member) {
      const result = await client.query(
        `SELECT * FROM ${config.table} WHERE ${config.column} = $1`,
        [id]
      );
      if (result.rowCount === 0) throw new Error("Application not found");
      return result.rows[0];
    }

    throw new Error("Invalid status value and no member provided");
  } catch (err) {
    console.error("Error updating status:", err);
    throw new Error(err.message);
  } finally {
    client.release();
  }
};
// START HELPER OF updateApplicationStatus
async function handleWithdrawRequest(client, config, id, user) {
  const now = new Date();
  const query = `
    UPDATE ${config.table}
    SET is_withdraw_requested = TRUE,
        withdraw_requested_by = $1,
        withdraw_requested_at = $2,
        withdraw_status = 'pending',
        withdraw_requested_by_user_id = $3
    WHERE ${config.column} = $4
    RETURNING *;
  `;
  const values = [user.user_role, now, user.user_id, id];
  const res = await client.query(query, values);
  if (res.rowCount === 0) throw new Error("Application not found or withdraw update failed");
  return res.rows[0];
}

async function handleWithdrawStatusUpdate(client, config, id, user, withdraw_status) {
  const checkRes = await client.query(
    `SELECT is_withdraw_requested FROM ${config.table} WHERE ${config.column} = $1`,
    [id]
  );

  if (checkRes.rowCount === 0) throw new Error("Application not found for withdraw status update");
  if (!checkRes.rows[0].is_withdraw_requested) throw new Error("No withdraw request found on this application.");

  const now = new Date();
  const setStatus =
    withdraw_status === "approved"
      ? ", status_flag = 'withdrawed'"
      : "";

  const query = `
    UPDATE ${config.table}
    SET withdraw_status = $1,
        withdraw_approved_by_role = $2,
        withdraw_approved_by_user_id = $3,
        withdraw_approved_at = $4
        ${setStatus}
    WHERE ${config.column} = $5
    RETURNING *;
  `;

  const values = [withdraw_status, user.user_role, user.user_id, now, id];
  const res = await client.query(query, values);
  if (res.rowCount === 0) throw new Error("Failed to update withdraw status");
  return res.rows[0];
}

async function fetchAndUpdateFds(client, config, id, statusLower, member, user) {
  const fds = await getFds(client, config, id);

  if (statusLower === "approved" && Array.isArray(fds?.parameters)) {
    clarifyApprovedParameters(fds.parameters, user);
  }

  let isMemberStatusUpdate = false;

  if (member) {
    updateAcceptedMembers(fds, member);

    const allSigned = await checkAllMembersSigned(fds.accepted_members, user);
    if (allSigned) {
      if (user.user_role === "cw2") {
        await approveCW2(client, config, id, user);
      } else if (statusLower !== "rejected") {
        isMemberStatusUpdate = true;
      }
    }
  }

  await updateFdsInDb(client, config, id, fds);

  return { updatedFds: fds, isMemberStatusUpdate };
}

// START Sub-Helper Functions for fetchAndUpdateFds 
async function getFds(client, config, id) {
  const res = await client.query(
    `SELECT ${config.fdsColumn} FROM ${config.table} WHERE ${config.column} = $1`,
    [id]
  );
  if (res.rowCount === 0) throw new Error("Application not found");
  return res.rows[0][config.fdsColumn];
}

function clarifyApprovedParameters(parameters, user) {
  parameters.forEach((param, idx, arr) => {
    if (param.clarification_id) {
      const { clarification_id, ...rest } = param;
      arr[idx] = {
        ...rest,
        last_clarification_handled_by: user.user_role,
        last_clarification_status: "clarified",
        last_clarification_id: clarification_id,
      };
    }
  });
}

function updateAcceptedMembers(fds, member) {
  fds.accepted_members = Array.isArray(fds.accepted_members) ? fds.accepted_members : [];
  const index = fds.accepted_members.findIndex(m => m.member_id === member.member_id);

  const updatedMember = {
    ...member,
    is_signature_added: member.is_signature_added ?? false,
  };

  if (index !== -1) {
    fds.accepted_members[index] = {
      ...fds.accepted_members[index],
      ...updatedMember,
      is_signature_added:
        updatedMember.is_signature_added ?? fds.accepted_members[index].is_signature_added ?? false,
    };
  } else {
    fds.accepted_members.push(updatedMember);
  }
}

async function checkAllMembersSigned(acceptedMembers, user) {
  const profile = await AuthService.getProfile(user);
  const unit = profile?.data?.unit;
  if (!unit?.members?.length || !acceptedMembers?.length) return false;

  const acceptedMap = new Map(acceptedMembers.map(m => [m.member_id, m]));
  return unit.members.every(member => acceptedMap.get(member.id)?.is_signature_added === true);
}

async function approveCW2(client, config, id, user) {
  const now = new Date();
  const is_mo = user.cw2_type === "mo";
  const is_ol = user.cw2_type === "ol";

  const query = `
    UPDATE ${config.table}
    SET is_mo_approved = $3,
        mo_approved_at = $4,
        is_ol_approved = $5,
        ol_approved_at = $6,
        last_approved_by_role = $2,
        last_approved_at = $7
    WHERE ${config.column} = $1
    RETURNING *;
  `;
  const values = [
    id,
    user.user_role,
    is_mo,
    is_mo ? now : null,
    is_ol,
    is_ol ? now : null,
    now
  ];

  await client.query(query, values);
}

async function updateFdsInDb(client, config, id, fds) {
  await client.query(
    `UPDATE ${config.table} SET ${config.fdsColumn} = $1 WHERE ${config.column} = $2`,
    [fds, id]
  );
}
// END  Sub-Helper Functions for fetchAndUpdateFds 

async function updateStatusFlag(client, config, id, statusLower, user) {
  const now = new Date();
  let query, values;

  switch (statusLower) {
    case "approved":
      query = `
        UPDATE ${config.table}
        SET status_flag = $1,
            last_approved_by_role = $3,
            last_approved_at = $4
        WHERE ${config.column} = $2
        RETURNING *;`;
      values = [statusLower, id, user.user_role, now];
      break;
    case "shortlisted_approved":
      query = `
        UPDATE ${config.table}
        SET status_flag = $1,
            last_shortlisted_approved_role = $3
        WHERE ${config.column} = $2
        RETURNING *;`;
      values = [statusLower, id, user.user_role];
      break;
    case "rejected":
      query = `
        UPDATE ${config.table}
        SET status_flag = $1,
            last_rejected_by_role = $3,
            last_rejected_at = $4
        WHERE ${config.column} = $2
        RETURNING *;`;
      values = [statusLower, id, user.user_role, now];
      break;
    default:
      query = `
        UPDATE ${config.table}
        SET status_flag = $1
        WHERE ${config.column} = $2
        RETURNING *;`;
      values = [statusLower, id];
      break;
  }

  const res = await client.query(query, values);
  if (res.rowCount === 0) throw new Error("Application not found or update failed");
  return res.rows[0];
}
// END HELPER OF updateApplicationStatus

exports.approveApplicationMarks = async (user, body) => {
  const client = await dbService.getClient();
  try {
    const {
      type,
      application_id,
      parameters,
      applicationGraceMarks,
      applicationPriorityPoints,
      remark,
    } = body;

    if (!["citation", "appreciation"].includes(type)) {
      return ResponseHelper.error(400, "Invalid type provided");
    }

    const tableName = type === "citation" ? "Citation_tab" : "Appre_tab";
    const idColumn = type === "citation" ? "citation_id" : "appreciation_id";
    const fdsColumn = type === "citation" ? "citation_fds" : "appre_fds";

    const res = await client.query(
      `SELECT ${idColumn}, ${fdsColumn} AS fds, remarks FROM ${tableName} WHERE ${idColumn} = $1`,
      [application_id]
    );

    if (res.rowCount === 0) {
      return ResponseHelper.error(404, "Application not found");
    }

    let fds = res.rows[0].fds;
    let remarks = res.rows[0].remarks || [];

    const now = new Date();

    if (Array.isArray(parameters) && parameters.length > 0) {
      fds = updateFdsParameters(fds, parameters, user, now);
    }

    if (applicationGraceMarks !== undefined) {
      fds = updateGraceMarks(fds, applicationGraceMarks, user, now);
    }

    if (applicationPriorityPoints !== undefined) {
      fds = updatePriorityPoints(fds, applicationPriorityPoints, user, now);
    }

    if (remark && typeof remark === "string") {
      remarks = updateRemarks(remarks, remark, user, now);
    }

    await client.query(
      `UPDATE ${tableName}
       SET ${fdsColumn} = $1,
           remarks = $2
       WHERE ${idColumn} = $3`,
      [JSON.stringify(fds), JSON.stringify(remarks), application_id]
    );

    return ResponseHelper.success(200, "Marks approved successfully");
  } catch (error) {
    console.error("Error in approveApplicationMarks:", error);
    return ResponseHelper.error(500, "Failed to approve marks", error.message);
  } finally {
    client.release();
  }
};

// START HELPER OF approveApplicationMarks

function updateFdsParameters(fds, parameters, user, now) {
  if (!Array.isArray(fds.parameters)) return fds;

  fds.parameters = fds.parameters.map((param) => {
    const approvedParam = parameters.find((p) => p.name === param.name);
    if (approvedParam) {
      return {
        ...param,
        approved_marks: approvedParam.approved_marks,
        approved_by_user: user.user_id,
        approved_by_role: user.user_role,
        approved_marks_at: now,
      };
    }
    return param;
  });

  return fds;
}

function updateGraceMarks(fds, applicationGraceMarks, user, now) {
  if (!Array.isArray(fds.applicationGraceMarks)) {
    fds.applicationGraceMarks = [];
  }

  const existingIndex = fds.applicationGraceMarks.findIndex(
    (entry) => entry.role === user.user_role
  );

  const graceEntry = {
    role: user.user_role,
    marksBy: user.user_id,
    marksAddedAt: now,
    marks: applicationGraceMarks,
  };

  if (existingIndex !== -1) {
    fds.applicationGraceMarks[existingIndex] = graceEntry;
  } else {
    fds.applicationGraceMarks.push(graceEntry);
  }

  return fds;
}

function updatePriorityPoints(fds, applicationPriorityPoints, user, now) {
  if (!Array.isArray(fds.applicationPriority)) {
    fds.applicationPriority = [];
  }

  const existingPriorityIndex = fds.applicationPriority.findIndex((entry) => {
    if (entry.role !== user.user_role) return false;
    return user.user_role !== "cw2" || entry.cw2_type === user.cw2_type;
  });

  const priorityEntry = {
    role: user.user_role,
    priority: applicationPriorityPoints,
    priorityAddedAt: now,
    ...(user.user_role === "cw2" && user.cw2_type ? { cw2_type: user.cw2_type } : {}),
  };

  if (existingPriorityIndex !== -1) {
    fds.applicationPriority[existingPriorityIndex] = priorityEntry;
  } else {
    fds.applicationPriority.push(priorityEntry);
  }

  return fds;
}

function updateRemarks(remarks, remarkText, user, now) {
  if (!Array.isArray(remarks)) {
    remarks = [];
  }

  const newRemark = {
    remarks: remarkText,
    remark_added_by_role: user.user_role,
    remark_added_by: user.user_id,
    remark_added_at: now,
  };

  const existingIndex = remarks.findIndex(
    (r) => r.remark_added_by_role === user.user_role
  );

  if (existingIndex !== -1) {
    remarks[existingIndex] = newRemark;
  } else {
    remarks.push(newRemark);
  }

  return remarks;
}
// END HELPER OF approveApplicationMarks

exports.addApplicationSignature = async (user, body) => {
  const client = await dbService.getClient();
  try {
    const {
      type,
      application_id,
      id,
      member_order,
      member_type,
      name,
      added_signature = "",
    } = body;

    if (!["citation", "appreciation"].includes(type)) {
      return ResponseHelper.error(400, "Invalid type provided");
    }

    if (!id || !member_order || !member_type || !name) {
      return ResponseHelper.error(400, "Missing required member fields");
    }

    const tableName = type === "citation" ? "Citation_tab" : "Appre_tab";
    const idColumn = type === "citation" ? "citation_id" : "appreciation_id";

    // Fetch existing application
    const res = await client.query(
      `SELECT ${idColumn}, ${
        type === "citation" ? "citation_fds" : "appre_fds"
      } AS fds FROM ${tableName} WHERE ${idColumn} = $1`,
      [application_id]
    );

    if (res.rowCount === 0) {
      return ResponseHelper.error(404, "Application not found");
    }

    let fds = res.rows[0].fds;
    if (!fds || typeof fds !== "object") {
      fds = {};
    }

    if (!Array.isArray(fds.signatures)) {
      fds.signatures = [];
    }

    const userRole = user.user_role;
    const now = new Date();

    // Find or create the role entry
    let roleEntry = fds.signatures.find((sig) => sig.role === userRole);

    if (!roleEntry) {
      roleEntry = {
        role: userRole,
        signatures_of_members: [],
      };
      fds.signatures.push(roleEntry);
    }

    // Check if the member with the same ID already has a signature under this role
    const existingSignature = roleEntry.signatures_of_members.find(
      (m) => m.id === id
    );

    if (existingSignature) {
      return ResponseHelper.error(
        400,
        "Signature already added for this member under this role"
      );
    }

    // Add the signature entry
    const newSignature = {
      id,
      member_order,
      member_type,
      name,
      added_signature,
      signature_added_by: user.user_id,
      signature_added_at: now,
    };

    roleEntry.signatures_of_members.push(newSignature);

    // Update back to DB
    await client.query(
      `UPDATE ${tableName}
       SET ${type === "citation" ? "citation_fds" : "appre_fds"} = $1
       WHERE ${idColumn} = $2`,
      [JSON.stringify(fds), application_id]
    );

    return ResponseHelper.success(
      200,
      "Signature added successfully",
      newSignature
    );
  } catch (error) {
    return ResponseHelper.error(500, "Failed to add signature", error.message);
  } finally {
    client.release();
  }
};

exports.addApplicationComment = async (user, body) => {
  const client = await dbService.getClient();
  try {
    const { type, application_id, parameters } = body;

    if (!["citation", "appreciation"].includes(type)) {
      return ResponseHelper.error(400, "Invalid type provided");
    }

    const tableName = type === "citation" ? "Citation_tab" : "Appre_tab";
    const idColumn = type === "citation" ? "citation_id" : "appreciation_id";
    const fdsColumn = type === "citation" ? "citation_fds" : "appre_fds";

    const res = await client.query(
      `SELECT ${idColumn}, ${fdsColumn} AS fds FROM ${tableName} WHERE ${idColumn} = $1`,
      [application_id]
    );

    if (res.rowCount === 0) {
      return ResponseHelper.error(404, "Application not found");
    }

    let fds = res.rows[0].fds;
    const now = new Date();

    if (!Array.isArray(parameters) || parameters.length === 0) {
      return ResponseHelper.error(400, "Parameters array is required");
    }

    fds.parameters = fds.parameters.map((param) => {
      const incomingParam = parameters.find((p) => p.name === param.name);
      if (incomingParam) {
        if (!Array.isArray(param.comments)) {
          param.comments = [];
        }

        const existingCommentIndex = param.comments.findIndex(
          (c) => c.commented_by === user.user_id
        );

        const newComment = {
          comment: incomingParam.comment || "",
          commented_by_role_type: user.cw2_type || null,
          commented_by_role: user.user_role || null,
          commented_at: now,
          commented_by: user.user_id,
        };

        if (existingCommentIndex >= 0) {
          param.comments[existingCommentIndex] = newComment;
        } else {
          param.comments.push(newComment);
        }
      }
      return param;
    });

    await client.query(
      `UPDATE ${tableName}
         SET ${fdsColumn} = $1
         WHERE ${idColumn} = $2`,
      [fds, application_id]
    );

    return ResponseHelper.success(200, "Comment added successfully");
  } catch (error) {
    return ResponseHelper.error(500, "Failed to add comments", error.message);
  } finally {
    client.release();
  }
};
exports.addApplicationComment = async (user, body) => {
  const client = await dbService.getClient();
  try {
    const { type, application_id, parameters, comment } = body;

    if (!["citation", "appreciation"].includes(type)) {
      return ResponseHelper.error(400, "Invalid type provided");
    }

    const tableName = type === "citation" ? "Citation_tab" : "Appre_tab";
    const idColumn = type === "citation" ? "citation_id" : "appreciation_id";
    const fdsColumn = type === "citation" ? "citation_fds" : "appre_fds";

    const res = await client.query(
      `SELECT ${idColumn}, ${fdsColumn} AS fds FROM ${tableName} WHERE ${idColumn} = $1`,
      [application_id]
    );

    if (res.rowCount === 0) {
      return ResponseHelper.error(404, "Application not found");
    }

    let fds = res.rows[0].fds;
    const now = new Date();

    // ✅ Application-level comment (stored as array)
    if (typeof comment === "string" && comment.trim() !== "") {
      if (!Array.isArray(fds.comments)) {
        fds.comments = [];
      }

      const newAppComment = {
        comment: comment.trim(),
        commented_by_role_type: user.cw2_type || null,
        commented_by_role: user.user_role || null,
        commented_at: now,
        commented_by: user.user_id,
      };

      const existingAppCommentIndex = fds.comments.findIndex(
        (c) => c.commented_by === user.user_id
      );

      if (existingAppCommentIndex >= 0) {
        fds.comments[existingAppCommentIndex] = newAppComment;
      } else {
        fds.comments.push(newAppComment);
      }
    }

    if (Array.isArray(parameters) && parameters.length > 0) {
      fds.parameters = fds.parameters.map((param) => {
        const incomingParam = parameters.find((p) => p.name === param.name);
        if (incomingParam) {
          if (!Array.isArray(param.comments)) {
            param.comments = [];
          }

          const newParamComment = {
            comment: incomingParam.comment || "",
            commented_by_role_type: user.cw2_type || null,
            commented_by_role: user.user_role || null,
            commented_at: now,
            commented_by: user.user_id,
          };

          const existingCommentIndex = param.comments.findIndex(
            (c) => c.commented_by === user.user_id
          );

          if (existingCommentIndex >= 0) {
            param.comments[existingCommentIndex] = newParamComment;
          } else {
            param.comments.push(newParamComment);
          }
        }
        return param;
      });
    }

    await client.query(
      `UPDATE ${tableName}
         SET ${fdsColumn} = $1
         WHERE ${idColumn} = $2`,
      [fds, application_id]
    );

    return ResponseHelper.success(200, "Comment added successfully");
  } catch (error) {
    return ResponseHelper.error(500, "Failed to add comments", error.message);
  } finally {
    client.release();
  }
};

exports.saveOrUpdateDraft = async (user, body) => {
  const client = await dbService.getClient();
  try {
    const { type, draft_fds } = body;

    if (!["citation", "appreciation"].includes(type)) {
      return ResponseHelper.error(400, "Invalid draft type");
    }

    const now = new Date();

    const existing = await client.query(
      `SELECT draft_id FROM Application_drafts WHERE user_id = $1 AND type = $2`,
      [user.user_id, type]
    );

    if (existing.rowCount > 0) {
      await client.query(
        `UPDATE Application_drafts 
           SET draft_fds = $1, updated_at = $2
           WHERE user_id = $3 AND type = $4`,
        [draft_fds, now, user.user_id, type]
      );
    } else {
      await client.query(
        `INSERT INTO Application_drafts (user_id, type, draft_fds, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $4)`,
        [user.user_id, type, draft_fds, now]
      );
    }

    return ResponseHelper.success(200, "Draft saved successfully");
  } catch (err) {
    console.error("Save draft error:", err);
    return ResponseHelper.error(500, "Failed to save draft", err.message);
  } finally {
    client.release();
  }
};

exports.getDraft = async (user, type) => {
  const client = await dbService.getClient();
  try {
    const res = await client.query(
      `SELECT draft_fds FROM Application_drafts WHERE user_id = $1 AND type = $2`,
      [user.user_id, type]
    );

    if (res.rowCount === 0) {
      return ResponseHelper.success(200, "No draft found", null);
    }

    return ResponseHelper.success(
      200,
      "Draft fetched successfully",
      res.rows[0].draft_fds
    );
  } catch (err) {
    console.error("Get draft error:", err);
    return ResponseHelper.error(500, "Failed to fetch draft", err.message);
  } finally {
    client.release();
  }
};

exports.deleteDraft = async (user, type) => {
  const client = await dbService.getClient();
  try {
    await client.query(
      `DELETE FROM Application_drafts WHERE user_id = $1 AND type = $2`,
      [user.user_id, type]
    );

    return ResponseHelper.success(200, "Draft deleted successfully");
  } catch (err) {
    console.error("Delete draft error:", err);
    return ResponseHelper.error(500, "Failed to delete draft", err.message);
  } finally {
    client.release();
  }
};

exports.getApplicationsHistory = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const { award_type, search, page = 1, limit = 10 } = query;
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    if (user_role.toLowerCase() === "cw2") {
      return await getCW2History(client, user, limitInt, offset, award_type, search, pageInt);
    }

    const { unitIds, allowedRoles, lowerRoles } = await getUnitRoleDetails(client, user_role, unit);
    if (!unitIds.length) {
      return ResponseHelper.success(200, "No applications found", [], { totalItems: 0 });
    }

    const allApps = await fetchApplicationsForApplicationsHistory(client, unitIds, allowedRoles, lowerRoles, user.user_role);
    const filteredApps = filterAndEnhanceApplications(allApps, award_type, search);
    const enrichedApps = await attachClarifications(client, filteredApps);
    const finalApps = calculateMarks(client, enrichedApps);

    finalApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
    const paginatedData = finalApps.slice(offset, offset + limitInt);

    return ResponseHelper.success(
      200,
      "Fetched applications history",
      paginatedData,
      {
        totalItems: finalApps.length,
        totalPages: Math.ceil(finalApps.length / limitInt),
        currentPage: pageInt,
        itemsPerPage: limitInt,
      }
    );
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to fetch applications history",
      err.message
    );
  } finally {
    client.release();
  }
};
// START HELPER OF getApplicationsHistory
async function getCW2History(client, user, limitInt, offset, award_type, search, pageInt) {
  let approvalField;
  if (user.cw2_type === "mo") {
    approvalField = "is_mo_approved";
  } else if (user.cw2_type === "ol") {
    approvalField = "is_ol_approved";
  } else {
    throw new Error("Invalid cw2_type for CW2 user.");
  }
  const [citationsRes, appreciationsRes] = await Promise.all([
    client.query(`
      SELECT * FROM Citation_tab WHERE ${approvalField} = true
      ORDER BY date_init DESC LIMIT $1 OFFSET $2
    `, [limitInt, offset]),
    client.query(`
      SELECT * FROM Appre_tab WHERE ${approvalField} = true
      ORDER BY date_init DESC LIMIT $1 OFFSET $2
    `, [limitInt, offset])
  ]);

  let allApps = [...citationsRes.rows, ...appreciationsRes.rows];
  allApps = filterApplications(allApps, award_type, search);

  return ResponseHelper.success(
    200,
    "Fetched CW2 applications history",
    allApps,
    {
      totalItems: allApps.length,
      currentPage: pageInt,
      itemsPerPage: limitInt,
      totalPages: Math.ceil(allApps.length / limitInt),
    }
  );
}

async function getUnitRoleDetails(client, user_role, unit) {
  const ROLE_HIERARCHY = ["unit", "brigade", "division", "corps", "command"];
  const currentRole = user_role.toLowerCase();
  const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
  if (currentIndex === -1) throw new Error("Invalid user role");

  let unitIds = [];
  if (currentRole === "unit") {
    unitIds = [unit.unit_id];
  } else {
    const subordinateFieldMap = { brigade: "bde", division: "div", corps: "corps", command: "comd" };
    const matchField = subordinateFieldMap[currentRole];
    const subUnitsRes = await client.query(
      `SELECT unit_id FROM Unit_tab WHERE ${matchField} = $1`, [unit.name]
    );
    unitIds = subUnitsRes.rows.map(u => u.unit_id);
  }

  const allowedRoles = ROLE_HIERARCHY.slice(currentIndex);
  const lowerRoles = allowedRoles.slice(0, -1);
  return { unitIds, allowedRoles, lowerRoles };
}

async function fetchApplicationsForApplicationsHistory(client, unitIds, allowedRoles, lowerRoles, userRole) {
  const filters = `
    unit_id = ANY($1) AND
    (
      (status_flag IN ('approved', 'shortlisted_approved') AND last_approved_by_role = ANY($2)) OR
      (status_flag = 'rejected' AND last_approved_by_role = ANY($3)) OR
      (status_flag = 'withdrawed' AND withdraw_requested_by = ANY($4))
    )
  `;
  const params = [unitIds, allowedRoles, lowerRoles, [userRole]];

  const [citations, appreciations] = await Promise.all([
    client.query(`SELECT * FROM Citation_tab WHERE ${filters}`, params),
    client.query(`SELECT * FROM Appre_tab WHERE ${filters}`, params),
  ]);

  return [...citations.rows, ...appreciations.rows];
}

function filterApplications(apps, award_type, search) {
  let filtered = apps;
  if (award_type) {
    filtered = filtered.filter(
      app => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
    );
  }
  if (search) {
    const norm = s => s?.toLowerCase().replace(/[\s-]/g, "");
    const searchNorm = norm(search);
    filtered = filtered.filter(
      app =>
        app.id.toString().toLowerCase().includes(searchNorm) ||
        norm(app.fds?.cycle_period || "").includes(searchNorm)
    );
  }
  return filtered;
}

function filterAndEnhanceApplications(apps, award_type, search) {
  return filterApplications(apps, award_type, search);
}

async function attachClarifications(client, apps) {
  const clarificationIds = apps.flatMap(app =>
    app.fds?.parameters?.filter(p => p.clarification_id).map(p => p.clarification_id) || []
  );
  const clarificationMap = {};
  if (clarificationIds.length) {
    const clarifications = await client.query(
      `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
      [clarificationIds]
    );
    clarifications.rows.forEach(c => { clarificationMap[c.clarification_id] = c; });
  }

  return apps.map(app => ({
    ...app,
    fds: {
      ...app.fds,
      parameters: app.fds?.parameters?.map(param => ({
        ...param,
        clarification: param.clarification_id ? clarificationMap[param.clarification_id] || null : undefined,
      })) || [],
    },
  }));
}

function calculateMarks(client, apps) {
  return apps.map(app => {
    const params = app.fds?.parameters || [];
    const totalMarks = params.reduce((sum, p) => sum + (p.marks || 0), 0);
    const negativeMarks = params.reduce((sum, p) =>
      p.negative ? sum + (p.marks || 0) : sum, 0);
    const netMarks = totalMarks - negativeMarks;

    return {
      ...app,
      totalMarks,
      totalNegativeMarks: negativeMarks,
      netMarks,
      fds: { ...app.fds, parameters: params.map(p => { const { clarification, ...rest } = p; return rest; }) },
    };
  });
}
// END HELPER OF getApplicationsHistory

exports.getAllApplications = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const { award_type, search, page = 1, limit = 10 } = query;
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    validateUnitProfileForAllApplications(unit, user_role);

    const {  filters, queryParams } = await buildFilterParams(client, user_role, unit);

    const [citations, appreciations] = await Promise.all([
      client.query(buildQuery("Citation_tab", filters), queryParams),
      client.query(buildQuery("Appre_tab", filters), queryParams),
    ]);

    let allApps = [...citations.rows, ...appreciations.rows];

    allApps = applyAwardAndSearchFilters(allApps, award_type, search);

    const clarificationMap = await fetchClarifications(client, allApps);

    allApps = attachClarificationsToApps(allApps, clarificationMap);

    const negativeParamMap = await fetchNegativeParameters(client, allApps);

    allApps = calculateMarksForApps(allApps, negativeParamMap);

    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    const paginatedData = paginateForApps(allApps, pageInt, limitInt);

    return ResponseHelper.success(
      200,
      "Fetched all applications",
      paginatedData,
      {
        totalItems: allApps.length,
        totalPages: Math.ceil(allApps.length / limitInt),
        currentPage: pageInt,
        itemsPerPage: limitInt,
      }
    );
  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch all applications", err.message);
  } finally {
    client.release();
  }
};

// START HELPER OF getAllApplications
function validateUnitProfileForAllApplications(unit, user_role) {
  const requirements = {
    unit: ["bde", "div", "corps", "comd", "name"],
    brigade: ["div", "corps", "comd", "name"],
    division: ["corps", "comd", "name"],
    corps: ["comd", "name"],
    command: ["name"],
  };
  const requiredFields = requirements[user_role.toLowerCase()] || [];
  const missing = requiredFields.filter(f => !unit?.[f] || unit[f] === "");
  if (missing.length > 0) throw new Error("Please complete your unit profile before proceeding.");
}

async function buildFilterParams(client, user_role, unit) {
  const ROLE_HIERARCHY = ["unit", "brigade", "division", "corps", "command"];
  const currentRole = user_role.toLowerCase();
  let unitIds = [], allowedRoles = [];

  if (currentRole === "headquarter") {
    const allUnitsRes = await client.query(`SELECT unit_id FROM Unit_tab`);
    unitIds = allUnitsRes.rows.map(u => u.unit_id);
    allowedRoles = ROLE_HIERARCHY;
    return {
      unitIds,
      allowedRoles,
      filters: `unit_id = ANY($1)`,
      queryParams: [unitIds],
    };
  }

  const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
  if (currentIndex === -1) throw new Error("Invalid user role");

  if (currentRole === "unit") {
    unitIds = [unit.unit_id];
  } else {
    const fieldMap = { brigade: "bde", division: "div", corps: "corps", command: "comd" };
    const field = fieldMap[currentRole];
    const subUnits = await client.query(`SELECT unit_id FROM Unit_tab WHERE ${field} = $1`, [unit.name]);
    unitIds = subUnits.rows.map(u => u.unit_id);
  }

  allowedRoles = ROLE_HIERARCHY.slice(0, currentIndex + 1);
  const filters = `
    (
      (
        unit_id = ANY($1) AND
        status_flag IN ('approved', 'rejected', 'shortlisted_approved') AND
        last_approved_by_role = ANY($2)
      ) OR (
        unit_id = ANY($1) AND
        status_flag = 'in_review' AND
        last_approved_by_role IS NULL AND
        last_approved_at IS NULL
      ) OR (
        unit_id = ANY($1) AND
        status_flag = 'rejected' AND
        last_approved_by_role IS NULL AND
        last_approved_at IS NULL
      )
    )
  `;
  return { unitIds, allowedRoles, filters, queryParams: [unitIds, allowedRoles] };
}

function buildQuery(table, filters) {
  return `
    SELECT 
      ${table === "Citation_tab" ? "citation_id AS id" : "appreciation_id AS id"},
      '${table === "Citation_tab" ? "citation" : "appreciation"}' AS type,
      unit_id,
      date_init,
      ${table === "Citation_tab" ? "citation_fds AS fds" : "appre_fds AS fds"},
      status_flag,
      is_mo_approved,
      mo_approved_at,
      is_ol_approved,
      ol_approved_at,
      last_approved_by_role,
      last_approved_at
    FROM ${table}
    WHERE ${filters}
  `;
}

function applyAwardAndSearchFilters(apps, award_type, search) {
  if (!award_type && !search) return apps;

  const normalizedSearch = search
    ? search.toLowerCase().replace(/\s|-/g, "")
    : null;

  return apps.filter(app => {
    const matchesAwardType = award_type
      ? app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      : true;

    if (!matchesAwardType) return false;

    if (normalizedSearch) {
      const appIdStr = String(app.id).toLowerCase();
      const cyclePeriodStr = (app.fds?.cycle_period || "").toLowerCase().replace(/\s|-/g, "");
      return appIdStr.includes(normalizedSearch) || cyclePeriodStr.includes(normalizedSearch);
    }

    return true;
  });
}

async function fetchClarifications(client, apps) {
  const ids = apps.flatMap(app =>
    app.fds?.parameters?.filter(p => p.clarification_id).map(p => p.clarification_id) || []
  );
  if (!ids.length) return {};
  const res = await client.query(`SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`, [ids]);
  return res.rows.reduce((map, cur) => { map[cur.clarification_id] = cur; return map; }, {});
}

function attachClarificationsToApps(apps, clarificationMap) {
  return apps.map(app => ({
    ...app,
    fds: {
      ...app.fds,
      parameters: app.fds?.parameters?.map(param => ({
        ...param,
        clarification: param.clarification_id ? clarificationMap[param.clarification_id] || null : undefined,
      })) || [],
    },
  }));
}

async function fetchNegativeParameters(client, apps) {
  const names = Array.from(new Set(apps.flatMap(app =>
    app.fds?.parameters?.map(p => p.name?.trim().toLowerCase()) || []
  )));
  if (!names.length) return {};
  const res = await client.query(
    `SELECT name, negative FROM Parameter_Master WHERE LOWER(TRIM(name)) = ANY($1)`,
    [names]
  );
  return res.rows.reduce((map, row) => { map[row.name.trim().toLowerCase()] = row.negative; return map; }, {});
}

function calculateMarksForApps(apps, negativeParamMap) {
  return apps.map(app => {
    const params = app.fds?.parameters || [];
    const totalMarks = params.reduce((sum, p) => sum + (p.marks || 0), 0);
    const totalNegative = params.reduce((sum, p) =>
      negativeParamMap[p.name?.trim().toLowerCase()] ? sum + (p.marks || 0) : sum, 0
    );
    const netMarks = totalMarks - totalNegative;
    return {
      ...app,
      totalMarks,
      totalNegativeMarks: totalNegative,
      netMarks,
      fds: { ...app.fds, parameters: params.map(p => { const { clarification, ...rest } = p; return rest; }) },
    };
  });
}

function paginateForApps(data, page, limit) {
  const start = (page - 1) * limit;
  return data.slice(start, start + limit);
}
// END HELPER OF getAllApplications
