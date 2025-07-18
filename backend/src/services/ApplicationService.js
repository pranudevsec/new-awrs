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
    const { award_type, search, command_type, page = 1, limit = 10 } = query;
    console.log(command_type);

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
      console.log("Filtering by award_type:", award_type);
    }

    if (command_type) {
      allApps = allApps.filter(
        (app) => app.fds?.command?.toLowerCase() === command_type.toLowerCase()
      );
      console.log("Filtering by command_type:", command_type);
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
    const query = buildQueryForAwardType(award_type);
    if (!query) {
      return ResponseHelper.error(400, "Invalid award_type provided");
    }

    const { rows } = await client.query(query, [application_id]);
    const application = rows[0];

    if (!application) {
      return ResponseHelper.error(404, "Application not found");
    }

    const roleHierarchy = ["unit", "brigade", "division", "corps", "command"];
    const userRoleIndex = roleHierarchy.indexOf(user.user_role?.toLowerCase());

    const fds = application.fds;
    if (Array.isArray(fds?.parameters)) {
      for (const param of fds.parameters) {
        await handleClarificationForParam(param, client, roleHierarchy, userRoleIndex);
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

// START HELPER OF getSingleApplicationForUnit
function buildQueryForAwardType(award_type) {
  const baseFields = `
  c.unit_id,
  u.name AS unit_name,
  c.date_init,
  c.last_approved_by_role,
  c.last_approved_at,
  c.status_flag,
  c.isShortlisted,
  c.is_mo_approved,
  c.mo_approved_at,
  c.is_ol_approved,
  c.ol_approved_at,
  c.is_hr_review,
  c.is_dv_review,
  c.is_mp_review,
  c.remarks
`;
if (award_type === "citation") {
  return `
    SELECT 
      c.citation_id AS id,
      'citation' AS type,
      ${baseFields},
      c.citation_fds AS fds
    FROM Citation_tab c
    JOIN Unit_tab u ON c.unit_id = u.unit_id
    WHERE c.citation_id = $1
  `;
} else if (award_type === "appreciation") {
  return `
    SELECT 
      a.appreciation_id AS id,
      'appreciation' AS type,
      ${baseFields.replace(/c\./g, 'a.')},
      a.appre_fds AS fds
    FROM Appre_tab a
    JOIN Unit_tab u ON a.unit_id = u.unit_id
    WHERE a.appreciation_id = $1
  `;
}
  return null;
}

async function handleClarificationForParam(param, client, roleHierarchy, userRoleIndex) {
  const clarificationId = param.clarification_id || param.last_clarification_id;
  if (!clarificationId) return;

  param.clarification_details = await fetchClarificationDetails(client, clarificationId);

  if (shouldRemoveClarification(param, roleHierarchy, userRoleIndex)) {
    delete param.clarification_id;
    delete param.last_clarification_id;
    delete param.clarification_details;
  }
}

async function fetchClarificationDetails(client, clarificationId) {
  const clarificationsQuery = `
    SELECT
      clarification_id,
      application_type,
      application_id,
      parameter_name,
      clarification_by_id,
      clarification_by_role,
      clarification_status,
      reviewer_comment,
      clarification,
      clarification_doc,
      clarified_history,
      clarification_sent_at,
      clarified_at
    FROM Clarification_tab
    WHERE clarification_id = $1
  `;

  const { rows } = await client.query(clarificationsQuery, [clarificationId]);
  return rows[0] || null;
}

function shouldRemoveClarification(param, roleHierarchy, userRoleIndex) {
  const clarificationRole = param.clarification_details?.clarification_by_role;
  if (!clarificationRole) return false;

  const clarificationRoleIndex = roleHierarchy.indexOf(clarificationRole?.toLowerCase());
  return clarificationRoleIndex >= 0 && userRoleIndex > clarificationRoleIndex;
}
// END HELPER OF getSingleApplicationForUnit


exports.getApplicationsOfSubordinates = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;
    const { unitIds, lowerRole } = await getSubordinateUnitIds(client, user, unit);

    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No subordinate units found", [], { totalItems: 0 });
    }

    const { baseFilters, queryParams } = buildBaseFiltersSubordinate(query, user, unitIds, lowerRole);

    const [citations, appreciations] = await fetchApplicationsSubordinates(client, baseFilters, queryParams);

    let allApps = mergeAndFilterApplications(citations.rows, appreciations.rows, query);

    allApps = await enrichClarifications(client, allApps, query.isGetNotClarifications);

    if (query.isShortlisted) {
      allApps = await enrichUnitDetailsAndMarks(client, allApps, user, query);
    }

    const paginatedData = paginate(allApps, query.page, query.limit);

    return ResponseHelper.success(
      200,
      "Fetched subordinate applications",
      paginatedData.data,
      paginatedData.pagination
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

/* ====================== HELPERS ====================== */

async function getSubordinateUnitIds(client, user, unit) {
  const { user_role } = user;
  const hierarchy = ["unit", "brigade", "division", "corps", "command"];
  const currentIndex = hierarchy.indexOf(user_role.toLowerCase());

  if (currentIndex <= 0) {
    throw new Error("Invalid or lowest level user role");
  }

  const lowerRole = hierarchy[currentIndex - 1];
  const subordinateFieldMap = { brigade: "bde", division: "div", corps: "corps", command: "comd" };
  const matchField = subordinateFieldMap[user_role.toLowerCase()];

  if (!matchField || !unit?.name) {
    throw new Error("Unit data or hierarchy mapping missing");
  }

  const subUnitsRes = await client.query(
    `SELECT unit_id FROM Unit_tab WHERE ${matchField} = $1`,
    [unit.name]
  );
  const unitIds = subUnitsRes.rows.map((u) => u.unit_id);
  return { unitIds, lowerRole };
}

function buildBaseFiltersSubordinate(query, user, unitIds, lowerRole) {
  const { user_role, user_id } = user;
  const isShortlisted = query.isShortlisted;
  const isGetWithdrawRequests = query.isGetWithdrawRequests;

  let baseFilters = "";
  const queryParams = [unitIds];

  if (isGetWithdrawRequests) {
    const ROLE_HIERARCHY = ["unit", "brigade", "division", "corps", "command"];
    const currentIndex = ROLE_HIERARCHY.indexOf(user_role.toLowerCase());
    const lowerRole = currentIndex > 0 ? ROLE_HIERARCHY[currentIndex - 1] : null;

    baseFilters = `
      unit_id = ANY($1) AND (
        (is_withdraw_requested = TRUE AND withdraw_status = 'pending')
        OR
        (withdraw_approved_by_role = $2 AND withdraw_approved_by_user_id = $3 AND (status_flag = 'approved' OR status_flag = 'rejected' OR status_flag = 'withdrawed'))
      )
      AND status_flag IN ('approved', 'withdrawed')
      AND last_approved_by_role = $4
    `;
    queryParams.push(user_role, user_id, lowerRole);

  } else if (isShortlisted && user_role.toLowerCase() === "command") {
    baseFilters = `
      unit_id = ANY($1)
      AND (
        (status_flag = 'shortlisted_approved' AND last_shortlisted_approved_role = $2)
        OR
        (status_flag = 'approved' AND last_approved_by_role = $2)
      )
    `;
    queryParams.push(user_role);

  } else if (isShortlisted) {
    baseFilters = `
      unit_id = ANY($1)
      AND status_flag = 'shortlisted_approved'
      AND last_shortlisted_approved_role = $2
    `;
    queryParams.push(user_role);

  } else if (user_role.toLowerCase() === "brigade") {
    baseFilters = `
      unit_id = ANY($1)
      AND status_flag NOT IN ('approved', 'draft', 'shortlisted_approved', 'rejected')
      AND (last_approved_by_role IS NULL OR last_approved_at IS NULL)
    `;

  } else {
    baseFilters = `
      unit_id = ANY($1)
      AND status_flag = 'approved'
      AND status_flag NOT IN ('draft', 'shortlisted_approved', 'rejected')
      AND last_approved_by_role = $2
    `;
    queryParams.push(lowerRole);
  }

  return { baseFilters, queryParams };
}

async function fetchApplicationsSubordinates(client, baseFilters, queryParams) {
  const citationQuery = `
    SELECT 
      citation_id AS id, 'citation' AS type, unit_id, date_init, citation_fds AS fds,
      status_flag, last_approved_by_role, last_approved_at,
      is_withdraw_requested, withdraw_status, withdraw_approved_by_role, withdraw_approved_by_user_id
    FROM Citation_tab
    WHERE ${baseFilters}
  `;

  const appreQuery = `
    SELECT 
      appreciation_id AS id, 'appreciation' AS type, unit_id, date_init, appre_fds AS fds,
      status_flag, last_approved_by_role, last_approved_at,
      is_withdraw_requested, withdraw_status, withdraw_approved_by_role, withdraw_approved_by_user_id
    FROM Appre_tab
    WHERE ${baseFilters}
  `;

  return Promise.all([
    client.query(citationQuery, queryParams),
    client.query(appreQuery, queryParams),
  ]);
}

function mergeAndFilterApplications(citations, appreciations, query) {
  let allApps = [...citations, ...appreciations];

  if (query.award_type) {
    const awardType = query.award_type.toLowerCase();
    allApps = allApps.filter(app => app.fds?.award_type?.toLowerCase() === awardType);
  }

  if (query.search) {
    const normalizedSearch = normalize(query.search);
    allApps = allApps.filter(app => 
      app.id.toString().toLowerCase().includes(normalizedSearch) ||
      normalize(app.fds?.cycle_period || "").includes(normalizedSearch)
    );
  }

  return allApps;
}

async function enrichClarifications(client, allApps, isGetNotClarifications) {
  const clarificationIds = allApps.flatMap(app =>
    app.fds?.parameters?.filter(p => p.clarification_id).map(p => p.clarification_id) || []
  );

  let clarificationMap = {};
  if (clarificationIds.length) {
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

  allApps = allApps.map(app => {
    let clarifications_count = 0;
    const updatedParameters = app.fds?.parameters?.map(param => {
      const clarification = clarificationMap[param.clarification_id] || null;
      if (clarification?.clarification_status === "pending") {
        clarifications_count++;
        total_pending_clarifications++;
      }
      return { ...param };
    }) || [];

    return {
      ...app,
      clarifications_count,
      total_pending_clarifications,
      fds: { ...app.fds, parameters: updatedParameters },
    };
  });

  if (isGetNotClarifications) {
    allApps = allApps.filter(app => app.clarifications_count === 0);
  }

  allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
  return allApps;
}

async function enrichUnitDetailsAndMarks(client, allApps, user, query) {
  const unitIds = [...new Set(allApps.map(app => app.unit_id))];
  const unitDetailsRes = await client.query(
    `SELECT * FROM Unit_tab WHERE unit_id = ANY($1)`,
    [unitIds]
  );
  const unitDetailsMap = unitDetailsRes.rows.reduce((acc, unit) => {
    acc[unit.unit_id] = unit;
    return acc;
  }, {});

  const allParamIds = [
    ...new Set(allApps.flatMap(app => app.fds?.parameters?.map(p => p.id) || [])),
  ];
  const parameterMasterRes = await client.query(
    `SELECT param_id, name, negative FROM Parameter_Master WHERE param_id = ANY($1)`,
    [allParamIds]
  );
  const negativeParamMap = parameterMasterRes.rows.reduce((acc, row) => {
    acc[row.param_id] = row.negative;
    return acc;
  }, {});

  const ROLE_HIERARCHY = ["unit", "brigade", "division", "corps", "command"];
  const currentRoleIndex = ROLE_HIERARCHY.indexOf(user.user_role?.toLowerCase());
  const lowerRole = currentRoleIndex > 0 ? ROLE_HIERARCHY[currentRoleIndex - 1] : null;

  allApps = allApps.map(app => {
    const parameters = app.fds?.parameters || [];
    const totalMarks = parameters.reduce(
      (sum, p) => (!negativeParamMap[p.id] ? sum + (p.marks || 0) : sum),
      0
    );
    const totalNegativeMarks = parameters.reduce(
      (sum, p) => (negativeParamMap[p.id] ? sum + (p.marks || 0) : sum),
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
  });

  if (currentRoleIndex > 0) {
    allApps.sort((a, b) => {
      const getPriority = (app) =>
        app.fds?.applicationPriority?.find(p => p.role === lowerRole)?.priority ?? Number.MAX_SAFE_INTEGER;
      return getPriority(a) - getPriority(b);
    });
  }

  return allApps;
}

function paginate(data, page = 1, limit = 10) {
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const start = (pageInt - 1) * limitInt;
  const end = pageInt * limitInt;

  return {
    data: data.slice(start, end),
    pagination: {
      totalItems: data.length,
      totalPages: Math.ceil(data.length / limitInt),
      currentPage: pageInt,
      itemsPerPage: limitInt,
    },
  };
}

function normalize(str) {
  return str?.toString().trim().toLowerCase().replace(/\s|-/g, "") ?? "";
}


exports.getApplicationsScoreboard = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const { award_type, search, page = 1, limit = 10, isShortlisted } = query;
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;
    const role = user_role.toLowerCase();

    if (!["command", "headquarter"].includes(role)) {
      return ResponseHelper.error(403, "Access denied. Only 'command' and 'headquarter' roles allowed.");
    }

    const profile = await AuthService.getProfile(user);
    const unitName = profile?.data?.unit?.name;

    let unitIds = [];
    if (role === "command") {
      if (!unitName) throw new Error("Command unit name not found in profile");
      const res = await client.query(`SELECT unit_id FROM Unit_tab WHERE comd = $1`, [unitName]);
      unitIds = res.rows.map((u) => u.unit_id);
      if (unitIds.length === 0) {
        return ResponseHelper.success(200, "No subordinate units found", [], buildPaginationForApplicationsScoreboard(0, pageInt, limitInt));
      }
    }

    const filterClause = buildFilterWhereClause(role, unitIds);
    const [totalItems, allApps] = await fetchApplications(client, filterClause, unitIds, award_type, search);

    if (totalItems === 0) {
      return ResponseHelper.success(200, "No applications found", [], buildPaginationForApplicationsScoreboard(0, pageInt, limitInt));
    }

    await enrichWithClarifications(client, allApps);
    const negativeParamMap = await getNegativeParamsMap(client, allApps);
    computeMarks(allApps, negativeParamMap);
    sortApplications(allApps, role, isShortlisted);

    const paginatedData = allApps.slice(offset, offset + limitInt);
    const pagination = buildPaginationForApplicationsScoreboard(totalItems, pageInt, limitInt);

    return ResponseHelper.success(200, "Fetched approved applications", paginatedData, pagination);
  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch scoreboard data", err.message);
  } finally {
    client.release();
  }
};

// START HELPER OF getApplicationsScoreboard
function buildFilterWhereClause(role, unitIds) {
  if (role === "command") {
    return {
      clause: `unit_id = ANY($1) AND status_flag = 'approved' AND last_approved_by_role = 'command'`,
      params: [unitIds],
    };
  }
  return {
    clause: `status_flag = 'approved' AND last_approved_by_role = 'cw2'`,
    params: [],
  };
}

function buildPaginationForApplicationsScoreboard(totalItems, page, limit) {
  return {
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: page,
    itemsPerPage: limit,
  };
}

async function fetchApplications(client, filter, unitIds, award_type, search) {
  const params = [...filter.params];
  if (award_type) params.push(award_type);
  if (search) params.push(`%${search.toLowerCase()}%`);

  const searchCondition = search
    ? `AND (CAST(id AS TEXT) ILIKE $${params.length} OR LOWER(fds->>'cycle_period') ILIKE $${params.length})`
    : "";

    let awardTypeCondition = "";

    if (award_type) {
      const paramIndex = search ? params.length - 1 : params.length;
      awardTypeCondition = `AND LOWER(fds->>'award_type') = LOWER($${paramIndex})`;
    }

  const combinedQuery = `
    SELECT id, 'citation' AS type, unit_id, date_init, citation_fds AS fds, status_flag, last_approved_by_role, last_approved_at
    FROM Citation_tab WHERE ${filter.clause.replace(/unit_id = ANY\(\$1\)/, 'unit_id = ANY($1)')}
    ${awardTypeCondition} ${searchCondition}
    UNION ALL
    SELECT id, 'appreciation' AS type, unit_id, date_init, appre_fds AS fds, status_flag, last_approved_by_role, last_approved_at
    FROM Appre_tab WHERE ${filter.clause.replace(/unit_id = ANY\(\$1\)/, 'unit_id = ANY($1)')}
    ${awardTypeCondition} ${searchCondition}
    ORDER BY date_init DESC
  `;

  const result = await client.query(combinedQuery, params);
  return [result.rowCount, result.rows];
}

async function enrichWithClarifications(client, allApps) {
  const clarificationIds = allApps.flatMap(app =>
    app.fds?.parameters?.map(param => param.clarification_id).filter(Boolean) || []
  );
  if (clarificationIds.length === 0) return;

  const res = await client.query(`SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`, [clarificationIds]);
  const map = Object.fromEntries(res.rows.map(row => [row.clarification_id, row]));
  allApps.forEach(app => {
    app.fds?.parameters?.forEach(param => {
      if (param.clarification_id) param.clarification_details = map[param.clarification_id] || null;
    });
  });
}

async function getNegativeParamsMap(client, allApps) {
  const paramIds = Array.from(new Set(allApps.flatMap(app =>
    app.fds?.parameters?.map(p => p.id).filter(Boolean) || []
  )));
  if (paramIds.length === 0) return {};

  const res = await client.query(`SELECT param_id, negative FROM Parameter_Master WHERE param_id = ANY($1)`, [paramIds]);
  return Object.fromEntries(res.rows.map(row => [row.param_id, row.negative]));
}

function computeMarks(allApps, negativeMap) {
  allApps.forEach(app => {
    const parameters = app.fds?.parameters || [];
    const totalMarks = parameters.reduce(
      (sum, p) => !negativeMap[p.id] ? sum + (p.marks || 0) : sum,
      0
    );
    const totalNegativeMarks = parameters.reduce(
      (sum, p) => negativeMap[p.id] ? sum + (p.marks || 0) : sum,
      0
    );
    app.totalMarks = totalMarks;
    app.totalNegativeMarks = totalNegativeMarks;
    app.netMarks = totalMarks - totalNegativeMarks;
  });
}

function sortApplications(allApps, role, isShortlisted) {
  if (!isShortlisted) return;

  const priorityRole = "command";
  allApps.forEach(app => {
    const priorityEntry = app.fds?.applicationPriority?.find(p => p.role?.toLowerCase() === priorityRole);
    app.commandPriority = priorityEntry?.priority ?? Number.MAX_SAFE_INTEGER;
  });
  allApps.sort((a, b) => a.commandPriority - b.commandPriority);
}

// END HELPER OF getApplicationsScoreboard

// exports.updateApplicationStatus = async (
//   id,
//   type,
//   status,
//   user,
//   member = null,
//   withdrawRequested = false,
//   withdraw_status = null
// ) => {
//   const client = await dbService.getClient();

//   try {
//     const config = getTypeConfig(type);

//     if (withdrawRequested) {
//       return await handleWithdrawRequest(client, config, id, user);
//     }

//     if (["approved", "rejected"].includes(withdraw_status)) {
//       return await handleWithdrawApproval(client, config, id, withdraw_status, user);
//     }

//     let { isStatusValid, statusLower } = validateStatus(status);

//     let updatedFds = null;
//     let isMemberStatusUpdate = false;

//     if (statusLower === "approved" || member) {
//       console.log(member)
//       const fds = await fetchFds(client, config, id);
//       let updatedFdsResult = fds;

//       if (statusLower === "approved") {
//         updatedFdsResult = clarifyParameters(fds, user);
//       }

//       if (member && !member?.iscdr) {
//         const profile = await AuthService.getProfile(user);
//         const unit = profile?.data?.unit;
//         updatedFdsResult = await mergeMemberSignature(updatedFdsResult, member);

//         if (await handleCw2ApprovalCheck(updatedFdsResult, unit, user, config, id, client)) {
//           statusLower = "shortlisted_approved";
//           isMemberStatusUpdate = true;
//         }
//       }

//       updatedFds = updatedFdsResult;
//       await updateFds(client, config, id, updatedFds);
//     }

//     return await updateStatusFlag(
//       client,
//       config,
//       id,
//       statusLower,
//       user,
//       isStatusValid,
//       isMemberStatusUpdate
//     );
//   } catch (err) {
//     console.error("Error updating status:", err);
//     throw new Error(err.message);
//   } finally {
//     client.release();
//   }
// };

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
    const iscdr = member?.iscdr ?? false;


    const validTypes = {
      citation: {
        table: "Citation_tab",
        column: "citation_id",
        fdsColumn: "citation_fds",
      },
      appreciation: {
        table: "Appre_tab",
        column: "appreciation_id",
        fdsColumn: "appre_fds",
      },
    };

    const config = validTypes[type];
    if (!config) throw new Error("Invalid application type");
    // If withdraw requested, handle it
    if (withdrawRequested) {
      const now = new Date();
      const withdrawQuery = `
      UPDATE ${config.table}
      SET
          is_withdraw_requested = TRUE,
          withdraw_requested_by = $1,
          withdraw_requested_at = $2,
          withdraw_status = 'pending',
          withdraw_requested_by_user_id = $3
      WHERE ${config.column} = $4
      RETURNING *;
  `;
      const withdrawValues = [user.user_role, now, user.user_id, id];
      const withdrawResult = await client.query(withdrawQuery, withdrawValues);
      if (withdrawResult.rowCount === 0)
        throw new Error("Application not found or withdraw update failed");

      return withdrawResult.rows[0];
    }
    if (withdraw_status === "approved" || withdraw_status === "rejected") {
      const checkWithdrawQuery = `
        SELECT is_withdraw_requested FROM ${config.table}
        WHERE ${config.column} = $1
      `;
      const checkResult = await client.query(checkWithdrawQuery, [id]);

      if (checkResult.rowCount === 0) {
        throw new Error("Application not found for withdraw status update");
      }

      const { is_withdraw_requested } = checkResult.rows[0];

      if (is_withdraw_requested) {
        const now = new Date();

        let updateWithdrawStatusQuery;
        let updateValues;

        if (withdraw_status === "approved") {
          updateWithdrawStatusQuery = `
            UPDATE ${config.table}
            SET
              withdraw_status = $1,
              withdraw_approved_by_role = $2,
              withdraw_approved_by_user_id = $3,
              withdraw_approved_at = $4,
              status_flag = 'withdrawed'
            WHERE ${config.column} = $5
            RETURNING *;
          `;
          updateValues = [
            withdraw_status,
            user.user_role,
            user.user_id,
            now,
            id,
          ];
        } else {
          updateWithdrawStatusQuery = `
            UPDATE ${config.table}
            SET
              withdraw_status = $1,
              withdraw_approved_by_role = $2,
              withdraw_approved_by_user_id = $3,
              withdraw_approved_at = $4
            WHERE ${config.column} = $5
            RETURNING *;
          `;
          updateValues = [
            withdraw_status,
            user.user_role,
            user.user_id,
            now,
            id,
          ];
        }

        const updateResult = await client.query(
          updateWithdrawStatusQuery,
          updateValues
        );

        if (updateResult.rowCount === 0) {
          throw new Error("Failed to update withdraw status");
        }

        return updateResult.rows[0];
      } else {
        throw new Error("No withdraw request found on this application.");
      }
    }

    const allowedStatuses = [
      "in_review",
      "in_clarification",
      "approved",
      "rejected",
      "shortlisted_approved",
    ];
    let statusLower = status ? status.toLowerCase() : null;

    const isStatusValid = statusLower && allowedStatuses.includes(statusLower);
    let isMemberStatusUpdate = false;
    let updatedFds = null;
    // If status is "approved" or member is provided, fetch FDS
    if (statusLower === "approved" || member) {
      const fetchRes = await client.query(
        `SELECT ${config.fdsColumn} FROM ${config.table} WHERE ${config.column} = $1`,
        [id]
      );
      if (fetchRes.rowCount === 0) throw new Error("Application not found");

      const fds = fetchRes.rows[0][config.fdsColumn];
      // Handle FDS parameter clarifications if approved
      if (
        statusLower === "approved" &&
        fds?.parameters &&
        Array.isArray(fds.parameters)
      ) {
        const updatedParameters = fds.parameters.map((param) => {
          if (param.clarification_id) {
            const { clarification_id, ...rest } = param;
            return {
              ...rest,
              last_clarification_handled_by: user.user_role,
              last_clarification_status: "clarified",
              last_clarification_id: clarification_id,
            };
          }
          return param;
        });
        fds.parameters = updatedParameters;
      }

      const profile = await AuthService.getProfile(user);
      const unit = profile?.data?.unit;

      if (member && !iscdr) {

        if (!fds.accepted_members || !Array.isArray(fds.accepted_members)) {
          fds.accepted_members = [];
        }

        const existingIndex = fds.accepted_members.findIndex(
          (m) => m.member_id === member.member_id
        );

        if (existingIndex !== -1) {
          fds.accepted_members[existingIndex] = {
            ...fds.accepted_members[existingIndex],
            ...member,
            is_signature_added:
              member.is_signature_added ??
              fds.accepted_members[existingIndex].is_signature_added ??
              false,
          };
        } else {
          fds.accepted_members.push({
            ...member,
            is_signature_added: member.is_signature_added ?? false,
          });
        }

        if (unit?.members?.length && fds.accepted_members?.length) {
          const acceptedMap = new Map(
            fds.accepted_members.map((m) => [m.member_id, m])
          );

          const allSigned = unit.members.every((unitMember) => {
            const accepted = acceptedMap.get(unitMember.id);
            return accepted?.is_signature_added === true;
          });

          if (allSigned) {
         
            if (user.user_role === "cw2") {
                 const now = new Date().toISOString();
              let approvedAt= new Date().toISOString();
              if (user.cw2_type === "mo") {
                  const  query = `
                UPDATE ${config.table}
                SET
                  is_mo_approved = $2,
                  mo_approved_at = $3,
                  last_approved_at = $4
                WHERE ${config.column} = $1
                RETURNING *;
              `;
           
              const values = [
                id,                // $1 (WHERE condition)
                true,    // $2
                approvedAt,    // $3
                now                // $4
              ];
              await client.query(query, values);

              } else if (user.cw2_type === "ol") {
                  const  query = `
                UPDATE ${config.table}
                SET
                  is_ol_approved = $2,
                  ol_approved_at = $3,
                  last_approved_at = $4
                WHERE ${config.column} = $1
                RETURNING *;
              `;
           
              const values = [
                id,                // $1 (WHERE condition)
                true,    // $2
                approvedAt,    // $3
                now                // $4
              ];
              await client.query(query, values);
 
              }
         
              const  updateRoleQuery = `
                UPDATE ${config.table}
                SET
                  last_approved_by_role = $2
                WHERE is_mo_approved= $3 AND is_ol_approved= $4 AND ${config.column} = $1
                RETURNING *;`;
           
              const updateRoleValues = [
                id,                // $1 (WHERE condition)
                user.user_role,    // $2
                true, // $3
                true // $4
              ];

              await client.query(updateRoleQuery, updateRoleValues);
            }else {
                if (status !== "rejected") {
                    statusLower = "shortlisted_approved";
                }
                isMemberStatusUpdate = true;
            }
        } else {
            console.log("ℹ️ Not all members signed yet. status_flag unchanged.");
        }
       
        }
      }

      updatedFds = fds;

      await client.query(
        `UPDATE ${config.table}
         SET ${config.fdsColumn} = $1
         WHERE ${config.column} = $2`,
        [updatedFds, id]
      );
    }
    // If status is valid, proceed with updating status_flag
    if (isStatusValid || isMemberStatusUpdate) {
      let query, values;
      const now = new Date();

      if (statusLower === "approved") {
        query = `
          UPDATE ${config.table}
          SET
            status_flag = $1,
            last_approved_by_role = $3,
            last_approved_at = $4
          WHERE ${config.column} = $2
          RETURNING *;
        `;
        values = [statusLower, id, user.user_role, now];
      } else if (statusLower === "shortlisted_approved") {
        query = `
          UPDATE ${config.table}
          SET
            status_flag = $1,
            last_shortlisted_approved_role = $3
          WHERE ${config.column} = $2
          RETURNING *;
        `;
        values = [statusLower, id, user.user_role];
      } else if (statusLower === "rejected") {
        query = `
          UPDATE ${config.table}
          SET
            status_flag = $1,
            last_rejected_by_role = $3,
            last_rejected_at = $4
          WHERE ${config.column} = $2
          RETURNING *;
        `;
        values = [statusLower, id, user.user_role, now];
      } else {
        if (statusLower) {
          // Update if statusLower is provided
          query = `
              UPDATE ${config.table}
              SET status_flag = $1
              WHERE ${config.column} = $2
              RETURNING *;
          `;
          values = [statusLower, id];
        } else {
          // Just get if statusLower is not provided
          query = `
              SELECT *
              FROM ${config.table}
              WHERE ${config.column} = $1;
          `;
          values = [id];
        }
      }

      const result = await client.query(query, values);
      if (result.rowCount === 0)
        throw new Error("Application not found or update failed");

      return result.rows[0];
    } else if (member) {
      // If only member is updated without status change, fetch the current row for consistency
      const result = await client.query(
        `SELECT * FROM ${config.table} WHERE ${config.column} = $1`,
        [id]
      );
      if (result.rowCount === 0) throw new Error("Application not found");

      return result.rows[0];
    } else {
      throw new Error("Invalid status value and no member provided");
    }
  } catch (err) {
    console.error("Error updating status:", err);
    throw new Error(err.message);
  } finally {
    client.release();
  }
};


// START HELPER OF updateApplicationStatus
function getTypeConfig(type) {
  const validTypes = {
    citation: { table: "Citation_tab", column: "citation_id", fdsColumn: "citation_fds" },
    appreciation: { table: "Appre_tab", column: "appreciation_id", fdsColumn: "appre_fds" },
  };
  const config = validTypes[type];
  if (!config) throw new Error("Invalid application type");
  return config;
}

function validateStatus(status) {
  const allowedStatuses = [
    "in_review",
    "in_clarification",
    "approved",
    "rejected",
    "shortlisted_approved",
  ];
  const statusLower = status ? status.toLowerCase() : null;
  const isStatusValid = statusLower && allowedStatuses.includes(statusLower);
  return { isStatusValid, statusLower };
}

async function fetchFds(client, config, id) {
  const res = await client.query(
    `SELECT ${config.fdsColumn} FROM ${config.table} WHERE ${config.column} = $1`,
    [id]
  );
  if (res.rowCount === 0) throw new Error("Application not found");
  return res.rows[0][config.fdsColumn];
}

function clarifyParameters(fds, user) {
  if (Array.isArray(fds?.parameters)) {
    fds.parameters = fds.parameters.map(param => {
      if (param.clarification_id) {
        const { clarification_id, ...rest } = param;
        return {
          ...rest,
          last_clarification_handled_by: user.user_role,
          last_clarification_status: "clarified",
          last_clarification_id: clarification_id,
        };
      }
      return param;
    });
  }
  return fds;
}

async function updateFds(client, config, id, updatedFds) {
  await client.query(
    `UPDATE ${config.table} SET ${config.fdsColumn} = $1 WHERE ${config.column} = $2`,
    [updatedFds, id]
  );
}

async function handleWithdrawRequest(client, config, id, user) {
  const now = new Date();
  const query = `
    UPDATE ${config.table}
    SET
      is_withdraw_requested = TRUE,
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

async function handleWithdrawApproval(client, config, id, withdraw_status, user) {
  const checkRes = await client.query(
    `SELECT is_withdraw_requested FROM ${config.table} WHERE ${config.column} = $1`,
    [id]
  );
  if (checkRes.rowCount === 0) throw new Error("Application not found for withdraw status update");
  if (!checkRes.rows[0].is_withdraw_requested) throw new Error("No withdraw request found on this application.");

  const now = new Date();
  const statusFlag = withdraw_status === "approved" ? "withdrawed" : undefined;
  const query = `
    UPDATE ${config.table}
    SET
      withdraw_status = $1,
      withdraw_approved_by_role = $2,
      withdraw_approved_by_user_id = $3,
      withdraw_approved_at = $4
      ${statusFlag ? ", status_flag = 'withdrawed'" : ""}
    WHERE ${config.column} = $5
    RETURNING *;
  `;
  const values = [withdraw_status, user.user_role, user.user_id, now, id];
  const res = await client.query(query, values);
  if (res.rowCount === 0) throw new Error("Failed to update withdraw status");
  return res.rows[0];
}

async function mergeMemberSignature(fds, member) {
  if (!fds.accepted_members || !Array.isArray(fds.accepted_members)) {
    fds.accepted_members = [];
  }

  const idx = fds.accepted_members.findIndex(m => m.member_id === member.member_id);
  if (idx !== -1) {
    fds.accepted_members[idx] = {
      ...fds.accepted_members[idx],
      ...member,
      is_signature_added: member.is_signature_added ?? fds.accepted_members[idx].is_signature_added ?? false,
    };
  } else {
    fds.accepted_members.push({
      ...member,
      is_signature_added: member.is_signature_added ?? false,
    });
  }

  return fds;
}

async function handleCw2ApprovalCheck(fds, unit, user, config, id, client) {
  if (!unit?.members?.length || !fds.accepted_members?.length) return false;

  const acceptedMap = new Map(fds.accepted_members.map(m => [m.member_id, m]));
  const allSigned = unit.members.every(unitMember => acceptedMap.get(unitMember.id)?.is_signature_added === true);

  if (allSigned && user.user_role === "cw2") {
    const now = new Date().toISOString();
    const approvedAt = now;
    let query;
    const values = [id, true, approvedAt, now];

    if (user.cw2_type === "mo") {
      query = `
        UPDATE ${config.table}
        SET is_mo_approved = $2, mo_approved_at = $3, last_approved_at = $4
        WHERE ${config.column} = $1
      `;
    } else if (user.cw2_type === "ol") {
      query = `
        UPDATE ${config.table}
        SET is_ol_approved = $2, ol_approved_at = $3, last_approved_at = $4
        WHERE ${config.column} = $1
      `;
    } else {
      return false;
    }

    await client.query(query, values);

    await client.query(`
      UPDATE ${config.table}
      SET last_approved_by_role = $2
      WHERE is_mo_approved = TRUE AND is_ol_approved = TRUE AND ${config.column} = $1
    `, [id, user.user_role]);

    return false; // Status update is handled here
  }

  return allSigned;
}

async function updateStatusFlag(client, config, id, statusLower, user, isStatusValid, isMemberStatusUpdate) {
  console.log(isStatusValid, isMemberStatusUpdate, statusLower);
  if (!isStatusValid && !isMemberStatusUpdate) throw new Error("Invalid status value and no member provided");

  let query, values;
  const now = new Date();

  if (statusLower === "approved") {
    query = `
      UPDATE ${config.table}
      SET status_flag = $1, last_approved_by_role = $3, last_approved_at = $4
      WHERE ${config.column} = $2
      RETURNING *;
    `;
    values = [statusLower, id, user.user_role, now];
  } else if (statusLower === "shortlisted_approved") {
    query = `
      UPDATE ${config.table}
      SET status_flag = $1, last_shortlisted_approved_role = $3
      WHERE ${config.column} = $2
      RETURNING *;
    `;
    values = [statusLower, id, user.user_role];
  } else if (statusLower === "rejected") {
    query = `
      UPDATE ${config.table}
      SET status_flag = $1, last_rejected_by_role = $3, last_rejected_at = $4
      WHERE ${config.column} = $2
      RETURNING *;
    `;
    values = [statusLower, id, user.user_role, now];
  } else if (statusLower) {
    query = `
      UPDATE ${config.table}
      SET status_flag = $1
      WHERE ${config.column} = $2
      RETURNING *;
    `;
    values = [statusLower, id];
  } else {
    query = `
      SELECT * FROM ${config.table} WHERE ${config.column} = $1;
    `;
    values = [id];
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

    const isCitation = type === "citation";
    const tableName = isCitation ? "Citation_tab" : "Appre_tab";
    const idColumn = isCitation ? "citation_id" : "appreciation_id";
    const fdsColumn = isCitation ? "citation_fds" : "appre_fds";

    const { rows, rowCount } = await client.query(
      `SELECT ${idColumn}, ${fdsColumn} AS fds, remarks FROM ${tableName} WHERE ${idColumn} = $1`,
      [application_id]
    );

    if (rowCount === 0) {
      return ResponseHelper.error(404, "Application not found");
    }

    const now = new Date();
    let { fds } = rows[0];
    let remarks = rows[0].remarks || [];

    if (Array.isArray(parameters) && parameters.length > 0) {
      fds.parameters = approveParameters(fds.parameters, parameters, user, now);
    }

    if (applicationGraceMarks !== undefined) {
      fds.applicationGraceMarks = updateGraceMarks(applicationGraceMarks, user, now,fds.applicationGraceMarks);
    }

    if (applicationPriorityPoints !== undefined) {
      fds.applicationPriority = updatePriorityPoints( applicationPriorityPoints, user, now,fds.applicationPriority);
    }

    if (remark && typeof remark === "string") {
      remarks = updateRemarks( remark, user, now,remarks);
    }

    await client.query(
      `UPDATE ${tableName} SET ${fdsColumn} = $1, remarks = $2 WHERE ${idColumn} = $3`,
      [JSON.stringify(fds), JSON.stringify(remarks), application_id]
    );

    return ResponseHelper.success(200, "Marks approved successfully");
  } catch (error) {
    return ResponseHelper.error(500, "Failed to approve marks", error.message);
  } finally {
    client.release();
  }
};
// START HELPER OF approveApplicationMarks
function approveParameters(existingParams, approvedParams, user, now) {
  if (!Array.isArray(existingParams)) return [];

  return existingParams.map((param) => {
    const approved = approvedParams.find((p) => p.name === param.name);
    return approved
      ? {
          ...param,
          approved_marks: approved.approved_marks,
          approved_by_user: user.user_id,
          approved_by_role: user.user_role,
          approved_marks_at: now,
        }
      : param;
  });
}

function updateGraceMarks( marks, user, now,existingGraceMarks = [],) {
  const entry = {
    role: user.user_role,
    marksBy: user.user_id,
    marksAddedAt: now,
    marks,
  };

  const idx = existingGraceMarks.findIndex((e) => e.role === user.user_role);
  if (idx !== -1) {
    existingGraceMarks[idx] = entry;
  } else {
    existingGraceMarks.push(entry);
  }
  return existingGraceMarks;
}

function updatePriorityPoints(priorityPoints, user, now,existingPriority = []) {
  const entry = {
    role: user.user_role,
    priority: priorityPoints,
    priorityAddedAt: now,
    ...(user.user_role === "cw2" && user.cw2_type ? { cw2_type: user.cw2_type } : {}),
  };

  const idx = existingPriority.findIndex((e) =>
    e.role === user.user_role && (user.user_role !== "cw2" || e.cw2_type === user.cw2_type)
  );

  if (idx !== -1) {
    existingPriority[idx] = entry;
  } else {
    existingPriority.push(entry);
  }
  return existingPriority;
}

function updateRemarks( remarkText, user, now,existingRemarks = []) {
  const newRemark = {
    remarks: remarkText,
    remark_added_by_role: user.user_role,
    remark_added_by: user.user_id,
    remark_added_at: now,
  };

  const idx = existingRemarks.findIndex((r) => r.remark_added_by_role === user.user_role);
  if (idx !== -1) {
    existingRemarks[idx] = newRemark;
  } else {
    existingRemarks.push(newRemark);
  }
  return existingRemarks;
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

    // ✅ Parameter-level comments
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

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    if (user_role.toLowerCase() === "cw2") {
      return await handleCW2History(client, user, pageInt, limitInt, award_type, search);
    }

    const {
      unitIds,
      queryParams,
    } = await buildRoleBasedQueryParams(user_role, unit, client);

    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No applications found", [], { totalItems: 0 });
    }

    const [citations, appreciations] = await Promise.all([
      fetchApplicationsForApplicationsHistory(client, "Citation_tab", queryParams),
      fetchApplicationsForApplicationsHistory(client, "Appre_tab", queryParams),
    ]);

    let allApps = [...citations, ...appreciations];

    allApps = applyFilters(allApps, award_type, search);
    allApps = await attachClarifications(allApps, client);
    allApps = await attachMarks(allApps, client);

    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    const paginatedData = paginateForApplicationsHistory(allApps, pageInt, limitInt);

    return ResponseHelper.success(
      200,
      "Fetched applications history",
      paginatedData,
      buildPaginationForApplicationsHistory(allApps.length, pageInt, limitInt)
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
async function handleCW2History(client, user, pageInt, limitInt, award_type, search) {
  const offset = (pageInt - 1) * limitInt;
  let approvalField;
  if (user.cw2_type === "mo") {
    approvalField = "is_mo_approved";
  } else if (user.cw2_type === "ol") {
    approvalField = "is_ol_approved";
  } else {
    throw new Error("Invalid cw2_type for CW2 user.");
  }

  const [citationsRes, appreciationsRes] = await Promise.all([
    client.query(buildCW2Query("Citation_tab", approvalField), [limitInt, offset]),
    client.query(buildCW2Query("Appre_tab", approvalField), [limitInt, offset])
  ]);

  let allApps = [...citationsRes.rows, ...appreciationsRes.rows];
  allApps = applyFilters(allApps, award_type, search);

  return ResponseHelper.success(
    200,
    "Fetched CW2 applications history",
    allApps,
    buildPaginationForApplicationsHistory(allApps.length, pageInt, limitInt)
  );
}

function buildCW2Query(table, approvalField) {
  return `
    SELECT 
      ${table === "Citation_tab" ? "citation_id AS id" : "appreciation_id AS id"},
      '${table === "Citation_tab" ? "citation" : "appreciation"}' AS type,
      unit_id, date_init,
      ${table === "Citation_tab" ? "citation_fds AS fds" : "appre_fds AS fds"},
      status_flag, last_approved_by_role, last_approved_at,
      is_withdraw_requested, withdraw_requested_by, withdraw_requested_at,
      withdraw_status, withdraw_requested_by_user_id,
      withdraw_approved_by_role, withdraw_approved_by_user_id, withdraw_approved_at,
      last_rejected_by_role, last_rejected_at
    FROM ${table}
    WHERE ${approvalField} = true
    ORDER BY date_init DESC
    LIMIT $1 OFFSET $2
  `;
}

async function buildRoleBasedQueryParams(user_role, unit, client) {
  const ROLE_HIERARCHY = ["unit", "brigade", "division", "corps", "command"];
  const currentRole = user_role.toLowerCase();
  const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
  if (currentIndex === -1) throw new Error("Invalid user role");

  const subordinateFieldMap = { brigade: "bde", division: "div", corps: "corps", command: "comd" };
  let unitIds = currentRole === "unit" ? [unit.unit_id] : [];

  if (!unitIds.length) {
    const matchField = subordinateFieldMap[currentRole];
    const res = await client.query(`SELECT unit_id FROM Unit_tab WHERE ${matchField} = $1`, [unit.name]);
    unitIds = res.rows.map((u) => u.unit_id);
  }

  const allowedRoles = ROLE_HIERARCHY.slice(currentIndex);
  const lowerRoles = allowedRoles
    .map(role => ROLE_HIERARCHY[ROLE_HIERARCHY.indexOf(role) - 1])
    .filter(Boolean);

  const queryParams = [unitIds, allowedRoles, lowerRoles, [user_role]];

  return { unitIds, allowedRoles, lowerRoles, queryParams };
}

function buildBaseFilters() {
  return `
    unit_id = ANY($1) AND
    (
      (status_flag = 'approved' AND last_approved_by_role = ANY($2)) OR
      (status_flag = 'shortlisted_approved' AND last_approved_by_role = ANY($2)) OR
      (status_flag = 'rejected' AND last_approved_by_role = ANY($3)) OR
      (status_flag = 'withdrawed' AND withdraw_requested_by = ANY($4))
    )
  `;
}

async function fetchApplicationsForApplicationsHistory(client, table, queryParams) {
  const query = `
    SELECT 
      ${table === "Citation_tab" ? "citation_id AS id" : "appreciation_id AS id"},
      '${table === "Citation_tab" ? "citation" : "appreciation"}' AS type,
      unit_id, date_init,
      ${table === "Citation_tab" ? "citation_fds AS fds" : "appre_fds AS fds"},
      status_flag, last_approved_by_role, last_approved_at,
      is_withdraw_requested, withdraw_requested_by, withdraw_requested_at,
      withdraw_status, withdraw_requested_by_user_id,
      withdraw_approved_by_role, withdraw_approved_by_user_id, withdraw_approved_at,
      last_rejected_by_role, last_rejected_at
    FROM ${table}
    WHERE ${buildBaseFilters()}
  `;
  const res = await client.query(query, queryParams);
  return res.rows;
}

function applyFilters(apps, award_type, search) {
  return apps.filter(app => {
    const awardMatch = award_type ? app.fds?.award_type?.toLowerCase() === award_type.toLowerCase() : true;
    const searchMatch = search
      ? app.id.toString().toLowerCase().includes(search.toLowerCase()) ||
        (app.fds?.cycle_period || "").toLowerCase().includes(search.toLowerCase())
      : true;
    return awardMatch && searchMatch;
  });
}

async function attachClarifications(apps, client) {
  const clarIds = apps.flatMap(app =>
    app.fds?.parameters?.filter(p => p.clarification_id).map(p => p.clarification_id) || []
  );

  if (!clarIds.length) return apps;

  const clarRes = await client.query(
    `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
    [clarIds]
  );

  const clarMap = Object.fromEntries(clarRes.rows.map(row => [row.clarification_id, row]));

  return apps.map(app => ({
    ...app,
    fds: {
      ...app.fds,
      parameters: app.fds?.parameters?.map(p =>
        p.clarification_id ? { ...p, clarification: clarMap[p.clarification_id] || null } : p
      ) || []
    }
  }));
}

async function attachMarks(apps, client) {
  const paramIds = [
    ...new Set(apps.flatMap(app => app.fds?.parameters?.map(p => p.id) || []))
  ];

  if (!paramIds.length) return apps;

  const res = await client.query(
    `SELECT param_id, negative FROM Parameter_Master WHERE param_id = ANY($1)`,
    [paramIds]
  );

  const negMap = Object.fromEntries(res.rows.map(row => [row.param_id, row.negative]));

  return apps.map(app => {
    const parameters = app.fds?.parameters || [];
    const totalMarks = parameters.reduce((sum, p) => sum + (!negMap[p.id] ? (p.marks || 0) : 0), 0);
    const totalNegativeMarks = parameters.reduce((sum, p) => sum + (negMap[p.id] ? (p.marks || 0) : 0), 0);
    const netMarks = totalMarks - totalNegativeMarks;

    return { ...app, totalMarks, totalNegativeMarks, netMarks };
  });
}

function paginateForApplicationsHistory(items, pageInt, limitInt) {
  const start = (pageInt - 1) * limitInt;
  return items.slice(start, start + limitInt);
}

function buildPaginationForApplicationsHistory(totalItems, pageInt, limitInt) {
  return {
    totalItems,
    totalPages: Math.ceil(totalItems / limitInt),
    currentPage: pageInt,
    itemsPerPage: limitInt,
  };
}
// END HELPER OF getApplicationsHistory

exports.getAllApplications = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const { award_type, search, page = 1, limit = 10 } = query;

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;
    const {  baseFilters, queryParams } =
      await prepareUnitAndRoleFilters(user_role, unit, client);

    const [citations, appreciations] = await Promise.all([
      fetchApplicationsForAllApplications(client, "Citation_tab", baseFilters, queryParams),
      fetchApplicationsForAllApplications(client, "Appre_tab", baseFilters, queryParams),
    ]);

    let allApps = [...citations, ...appreciations];
    allApps = applyAwardTypeAndSearchFilter(allApps, award_type, search);
    allApps = await attachClarificationsToApplications(allApps, client);
    allApps = await attachMarksToApplications(allApps, client);

    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    const paginatedData = paginateForAllApplications(allApps, parseInt(page), parseInt(limit));

    return ResponseHelper.success(
      200,
      "Fetched all applications",
      paginatedData.data,
      paginatedData.pagination
    );
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to fetch all applications",
      err.message
    );
  } finally {
    client.release();
  }
};
// START HELPER OF getAllApplications
async function prepareUnitAndRoleFilters(user_role, unit, client) {
  const role = user_role.toLowerCase();
  const ROLE_HIERARCHY = ["unit", "brigade", "division", "corps", "command"];
  const fieldMap = { brigade: "bde", division: "div", corps: "corps", command: "comd" };

  const requiredFields = {
    unit: ["bde", "div", "corps", "comd", "name"],
    brigade: ["div", "corps", "comd", "name"],
    division: ["corps", "comd", "name"],
    corps: ["comd", "name"],
    command: ["name"],
  }[role] || [];

  const missingFields = requiredFields.filter(f => !unit?.[f]);
  if (missingFields.length) {
    throw new Error("Please complete your unit profile before proceeding.");
  }

  let unitIds = [];
  let allowedRoles = [];

  if (role === "headquarter") {
    const res = await client.query(`SELECT unit_id FROM Unit_tab`);
    unitIds = res.rows.map(u => u.unit_id);
    allowedRoles = ROLE_HIERARCHY;
  } else {
    const idx = ROLE_HIERARCHY.indexOf(role);
    if (idx === -1) throw new Error("Invalid user role");

    if (role === "unit") {
      unitIds = [unit.unit_id];
    } else {
      const subField = fieldMap[role];
      const res = await client.query(`SELECT unit_id FROM Unit_tab WHERE ${subField} = $1`, [unit.name]);
      unitIds = res.rows.map(u => u.unit_id);
    }

    if (!unitIds.length) {
      throw new Error("No applications found");
    }

    allowedRoles = ROLE_HIERARCHY.slice(0, idx + 1);
  }

  const baseFilters = role === "headquarter"
    ? `unit_id = ANY($1)`
    : `
      (
        (unit_id = ANY($1) AND status_flag IN ('approved', 'rejected', 'shortlisted_approved') AND last_approved_by_role = ANY($2)) OR
        (unit_id = ANY($1) AND status_flag = 'in_review' AND last_approved_by_role IS NULL AND last_approved_at IS NULL) OR
        (unit_id = ANY($1) AND status_flag = 'rejected' AND last_approved_by_role IS NULL AND last_approved_at IS NULL)
      )
    `;

  const queryParams = role === "headquarter" ? [unitIds] : [unitIds, allowedRoles];
  return { unitIds, allowedRoles, baseFilters, queryParams };
}

async function fetchApplicationsForAllApplications(client, table, filters, params) {
  const isCitation = table === "Citation_tab";
  const query = `
    SELECT 
      ${isCitation ? "citation_id AS id" : "appreciation_id AS id"},
      '${isCitation ? "citation" : "appreciation"}' AS type,
      unit_id, date_init,
      ${isCitation ? "citation_fds AS fds" : "appre_fds AS fds"},
      status_flag,
      is_mo_approved, mo_approved_at,
      is_ol_approved, ol_approved_at,
      last_approved_by_role, last_approved_at
    FROM ${table}
    WHERE ${filters}
  `;
  const res = await client.query(query, params);
  return res.rows;
}

function applyAwardTypeAndSearchFilter(apps, awardType, search) {
  const norm = s => s?.toLowerCase().replace(/[\s-]/g, "");
  const searchNorm = norm(search);

  return apps.filter(app => {
    const matchesAward = awardType
      ? app.fds?.award_type?.toLowerCase() === awardType.toLowerCase()
      : true;
    const matchesSearch = search
      ? app.id.toString().includes(searchNorm) || norm(app.fds?.cycle_period).includes(searchNorm)
      : true;
    return matchesAward && matchesSearch;
  });
}

async function attachClarificationsToApplications(apps, client) {
  const clarIds = apps.flatMap(app => app.fds?.parameters?.map(p => p.clarification_id).filter(Boolean) || []);
  if (!clarIds.length) return apps;

  const res = await client.query(
    `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
    [clarIds]
  );
  const clarMap = Object.fromEntries(res.rows.map(row => [row.clarification_id, row]));

  return apps.map(app => ({
    ...app,
    fds: {
      ...app.fds,
      parameters: app.fds?.parameters?.map(p =>
        p.clarification_id ? { ...p, clarification: clarMap[p.clarification_id] || null } : p
      ) || []
    }
  }));
}

async function attachMarksToApplications(apps, client) {
  const paramNames = [
    ...new Set(apps.flatMap(app => app.fds?.parameters?.map(p => p.name?.trim().toLowerCase()) || []))
  ];
  if (!paramNames.length) return apps;

  const res = await client.query(
    `SELECT name, negative FROM Parameter_Master WHERE LOWER(TRIM(name)) = ANY($1)`,
    [paramNames]
  );
  const negMap = Object.fromEntries(res.rows.map(row => [row.name.trim().toLowerCase(), row.negative]));

  return apps.map(app => {
    const params = app.fds?.parameters || [];
    const totalMarks = params.reduce((sum, p) => sum + (p.marks || 0), 0);
    const totalNegMarks = params.reduce(
      (sum, p) => negMap[p.name?.trim().toLowerCase()] ? sum + (p.marks || 0) : sum,
      0
    );
    return {
      ...app,
      totalMarks,
      totalNegativeMarks: totalNegMarks,
      netMarks: totalMarks - totalNegMarks
    };
  });
}

function paginateForAllApplications(items, page, limit) {
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    pagination: {
      totalItems: items.length,
      totalPages: Math.ceil(items.length / limit),
      currentPage: page,
      itemsPerPage: limit
    }
  };
}

// END HELPER OF getAllApplications