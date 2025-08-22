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
    const roleHierarchy = ["unit", "brigade", "division", "corps", "command"];
    const userRoleIndex = roleHierarchy.indexOf(user.user_role?.toLowerCase());

    let query = "";
    let params = [application_id];
    if (award_type === "citation") {
      query = `
        SELECT 
          c.citation_id AS id,
          'citation' AS type,
          c.unit_id,
          u.name AS unit_name,
          c.date_init,
          c.citation_fds AS fds,
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
          c.last_rejected_by_role,
          c.remarks
        FROM Citation_tab c
        JOIN Unit_tab u ON c.unit_id = u.unit_id
        WHERE c.citation_id = $1
      `;
    } else if (award_type === "appreciation") {
      query = `
        SELECT 
          a.appreciation_id AS id,
          'appreciation' AS type,
          a.unit_id,
          u.name AS unit_name,
          a.date_init,
          a.appre_fds AS fds,
          a.last_approved_by_role,
          a.last_approved_at,
          a.status_flag,
          a.isShortlisted,
          a.is_mo_approved,
          a.mo_approved_at,
          a.is_ol_approved,
          a.ol_approved_at,
          a.is_hr_review,
          a.is_dv_review,
          a.is_mp_review,
             a.last_rejected_by_role,
          a.remarks
        FROM Appre_tab a
        JOIN Unit_tab u ON a.unit_id = u.unit_id
        WHERE a.appreciation_id = $1
      `;
    } else {
      return ResponseHelper.error(400, "Invalid award_type provided");
    }

    const res = await client.query(query, params);
    const application = res.rows[0];
    if (!application) {
      return ResponseHelper.error(404, "Application not found");
    }

    // Helper to fetch clarification details
    async function fetchClarificationDetails(clarificationId) {
      if (!clarificationId) return null;
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
      const clarRes = await client.query(clarificationsQuery, [
        clarificationId,
      ]);
      return clarRes.rows[0] || null;
    }

    // Helper to clean clarification fields
    function shouldCleanClarification(param, userRoleIndex) {
      if (!param.clarification_details?.clarification_by_role) return false;
      const clarificationRoleIndex = roleHierarchy.indexOf(
        param.clarification_details.clarification_by_role?.toLowerCase()
      );
      return (
        clarificationRoleIndex >= 0 && userRoleIndex > clarificationRoleIndex
      );
    }

    // Attach and clean clarifications for all parameters
    const fds = application.fds;
    if (Array.isArray(fds.parameters)) {
      for (let i = 0; i < fds.parameters.length; i++) {
        const param = fds.parameters[i];
        const clarificationId =
          param.clarification_id || param.last_clarification_id;
        param.clarification_details = await fetchClarificationDetails(
          clarificationId
        );
        if (shouldCleanClarification(param, userRoleIndex)) {
          delete param.clarification_id;
          delete param.last_clarification_id;
          delete param.clarification_details;
        }
      }
    }
    application.fds = fds;

    return ResponseHelper.success(
      200,
      "Fetched single application",
      application
    );
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to fetch application",
      err.message
    );
  } finally {
    client.release();
  }
};

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
      isGetWithdrawRequests,
    } = query;

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

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

    const hierarchy = ["unit", "brigade", "division", "corps", "command"];
    const currentIndex = hierarchy.indexOf(user_role.toLowerCase());
    if (currentIndex <= 0) {
      throw new Error("Invalid or lowest level user role");
    }

    const lowerRole = hierarchy[currentIndex - 1];
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
    const unitIds = subUnitsRes.rows.map((u) => u.unit_id);
    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No subordinate units found", [], {
        totalItems: 0,
      });
    }

    let baseFilters = "";
    const queryParams = [unitIds];
    const roleLC = user_role.toLowerCase();

    if (isGetWithdrawRequests) {
      baseFilters = `
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
      queryParams.push(user_role, user.user_id, lowerRole);
    } else if (isShortlisted && roleLC === "command") {
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
    } else if (roleLC === "brigade") {
      baseFilters = `unit_id = ANY($1) AND status_flag NOT IN ('approved', 'draft', 'shortlisted_approved', 'rejected') AND (last_approved_by_role IS NULL OR last_approved_at IS NULL)`;
    } else {
      baseFilters = `unit_id = ANY($1) AND status_flag = 'approved' AND status_flag NOT IN ('draft', 'shortlisted_approved', 'rejected') AND last_approved_by_role = $2`;
      queryParams.push(lowerRole);
    }

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
      WHERE ${baseFilters}
    `;
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
      WHERE ${baseFilters}
    `;

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, queryParams),
      client.query(appreQuery, queryParams),
    ]);
    let allApps = [...citations.rows, ...appreciations.rows];

    const normalize = (str) =>
      str?.toString().toLowerCase().replace(/[\s-]/g, "");

    if (award_type) {
      allApps = allApps.filter(
        (app) => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
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

    const clarificationIds = [];
    allApps.forEach((app) => {
      app.fds?.parameters?.forEach((param) => {
        if (param.clarification_id)
          clarificationIds.push(param.clarification_id);
      });
    });

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

    allApps = allApps.map((app) => ({
      ...app,
      fds: {
        ...app.fds,
        parameters: (app.fds?.parameters || []).map((param) =>
          param.clarification_id
            ? {
                ...param,
                clarification: clarificationMap[param.clarification_id] || null,
              }
            : param
        ),
      },
    }));

    let total_pending_clarifications = 0;
    allApps = allApps.map((app) => {
      let clarifications_count = 0;
      const cleanedParameters = (app.fds.parameters || []).map((param) => {
        const newParam = { ...param };
        if (newParam.clarification?.clarification_status === "pending") {
          clarifications_count++;
          total_pending_clarifications++;
        }
        delete newParam.clarification;
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

    if (isGetNotClarifications) {
      allApps = allApps.filter((app) => app.clarifications_count === 0);
    }

    if (isShortlisted) {
      const unitIdSet = [...new Set(allApps.map((app) => app.unit_id))];
      const unitDetailsRes = await client.query(
        `SELECT * FROM Unit_tab WHERE unit_id = ANY($1)`,
        [unitIdSet]
      );
      const unitDetailsMap = unitDetailsRes.rows.reduce((acc, unit) => {
        acc[unit.unit_id] = unit;
        return acc;
      }, {});
      allApps = allApps.map((app) => ({
        ...app,
        unit_details: unitDetailsMap[app.unit_id] || null,
      }));

      const allParameterIds = Array.from(
        new Set(
          allApps.flatMap((app) => app.fds?.parameters?.map((p) => p.id) || [])
        )
      );
      const parameterMasterRes = await client.query(
        `SELECT param_id, name, negative FROM Parameter_Master WHERE param_id = ANY($1)`,
        [allParameterIds]
      );
      const negativeParamMap = parameterMasterRes.rows.reduce((acc, row) => {
        acc[row.param_id] = row.negative;
        return acc;
      }, {});
      allApps = allApps.map((app) => {
        const parameters = app.fds?.parameters || [];
        const totalMarks = parameters.reduce(
          (sum, param) =>
            !negativeParamMap[param.id] ? sum + (param.marks || 0) : sum,
          0
        );
        const totalNegativeMarks = parameters.reduce(
          (sum, param) =>
            negativeParamMap[param.id] ? sum + (param.marks || 0) : sum,
          0
        );
        const netMarks = totalMarks - totalNegativeMarks;
        return {
          ...app,
          totalMarks,
          totalNegativeMarks,
          netMarks,
        };
      });

      const currentRoleIndex = hierarchy.indexOf(roleLC);
      if (currentRoleIndex > 0) {
        const lowerRole = hierarchy[currentRoleIndex - 1];
        allApps.sort((a, b) => {
          const aPriority =
            a.fds?.applicationPriority?.find((p) => p.role === lowerRole)
              ?.priority ?? Number.MAX_SAFE_INTEGER;
          const bPriority =
            b.fds?.applicationPriority?.find((p) => p.role === lowerRole)
              ?.priority ?? Number.MAX_SAFE_INTEGER;
          return aPriority - bPriority;
        });
      }
    }

    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
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
      "Fetched subordinate applications",
      paginatedData,
      pagination
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

exports.getApplicationsScoreboard = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const { award_type, search, page = 1, limit = 10, isShortlisted } = query;

    if (!["command", "headquarter"].includes(user_role.toLowerCase())) {
      return ResponseHelper.error(
        403,
        "Access denied. Only 'command' and 'headquarter' roles allowed."
      );
    }

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    const profile = await AuthService.getProfile(user);
    const unitName = profile?.data?.unit?.name;
    let unitIds = [];

    if (user_role.toLowerCase() === "command") {
      if (!unitName) throw new Error("Command unit name not found in profile");
      const res = await client.query(
        `SELECT unit_id FROM Unit_tab WHERE comd = $1`,
        [unitName]
      );
      unitIds = res.rows.map((u) => u.unit_id);
      if (unitIds.length === 0) {
        return ResponseHelper.success(200, "No subordinate units found", [], {
          totalItems: 0,
          totalPages: 0,
          currentPage: pageInt,
          itemsPerPage: limitInt,
        });
      }
    }

    // Helper to build WHERE clause
    function buildWhereClause(table, ids, award_type, search, isCommand) {
      let clauses = [];
      if (isCommand) {
        clauses.push(`${table}.unit_id = ANY($1)`);
        clauses.push(`${table}.status_flag = 'approved'`);
        clauses.push(`${table}.last_approved_by_role = 'command'`);
      } else {
        clauses.push(`${table}.status_flag = 'approved'`);
        clauses.push(`${table}.last_approved_by_role = 'cw2'`);
      }
      if (award_type) {
        clauses.push(
          `LOWER(${table}.${
            table === "c" ? "citation_fds" : "appre_fds"
          }->>'award_type') = LOWER($2)`
        );
      }
      if (search) {
        clauses.push(
          `(CAST(${table}.${
            table === "c" ? "citation_id" : "appreciation_id"
          } AS TEXT) ILIKE $3 OR LOWER(${table}.${
            table === "c" ? "citation_fds" : "appre_fds"
          }->>'cycle_period') ILIKE $3)`
        );
      }
      return clauses.join(" AND ");
    }

    const isCommand = user_role.toLowerCase() === "command";
    const citationWhere = buildWhereClause(
      "c",
      unitIds,
      award_type,
      search,
      isCommand
    );
    const appreWhere = buildWhereClause(
      "a",
      unitIds,
      award_type,
      search,
      isCommand
    );

    // Params for queries
    let params = isCommand ? [unitIds] : [];
    if (award_type) params.push(award_type);
    if (search) params.push(`%${search.toLowerCase()}%`);

    // Data query
    const dataQuery = `
      (
        SELECT
          c.citation_id AS id,
          'citation' AS type,
          c.unit_id,
          c.date_init,
          c.citation_fds AS fds,
          c.status_flag,
          c.last_approved_by_role,
          c.last_approved_at,
          c.isShortlisted,
          u.sos_no,
          u.name AS unit_name,
          u.adm_channel,
          u.tech_channel,
          u.bde,
          u.div,
          u.corps,
          u.comd,
          u.unit_type,
          u.matrix_unit,
          u.location
        FROM Citation_tab c
        JOIN Unit_tab u ON u.unit_id = c.unit_id
        WHERE ${citationWhere}
      )
      UNION ALL
      (
        SELECT
          a.appreciation_id AS id,
          'appreciation' AS type,
          a.unit_id,
          a.date_init,
          a.appre_fds AS fds,
          a.status_flag,
          a.last_approved_by_role,
          a.last_approved_at,
          a.isShortlisted,
          u.sos_no,
          u.name AS unit_name,
          u.adm_channel,
          u.tech_channel,
          u.bde,
          u.div,
          u.corps,
          u.comd,
          u.unit_type,
          u.matrix_unit,
          u.location
        FROM Appre_tab a
        JOIN Unit_tab u ON u.unit_id = a.unit_id
        WHERE ${appreWhere}
      )
      ORDER BY date_init DESC
      OFFSET $${params.length + 1} LIMIT $${params.length + 2}
    `;
    const dataParams = [...params, offset, limitInt];

    const dataResult = await client.query(dataQuery, dataParams);
    let allApps = dataResult.rows;

    // Clarifications
    const clarificationIds = [];
    allApps.forEach((app) => {
      app.fds?.parameters?.forEach((param) => {
        if (param.clarification_id)
          clarificationIds.push(param.clarification_id);
      });
    });

    let clarMap = {};
    if (clarificationIds.length > 0) {
      const clarRes = await client.query(
        `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
        [clarificationIds]
      );
      clarMap = clarRes.rows.reduce((acc, cur) => {
        acc[cur.clarification_id] = cur;
        return acc;
      }, {});
      allApps.forEach((app) => {
        app.fds?.parameters?.forEach((param) => {
          if (param.clarification_id && clarMap[param.clarification_id]) {
            param.clarification_details = clarMap[param.clarification_id];
          }
        });
      });
    }

    // Marks calculation
    const allParameterIds = Array.from(
      new Set(
        allApps.flatMap((app) => app.fds?.parameters?.map((p) => p.id) || [])
      )
    );
    const parameterMasterRes = await client.query(
      `SELECT param_id, name, negative FROM Parameter_Master WHERE param_id = ANY($1)`,
      [allParameterIds]
    );
    const negativeParamMap = parameterMasterRes.rows.reduce((acc, row) => {
      acc[row.param_id] = row.negative;
      return acc;
    }, {});

    allApps = allApps.map((app) => {
      const parameters = app.fds?.parameters || [];
      const totalMarks = parameters.reduce(
        (sum, param) =>
          !negativeParamMap[param.id] ? sum + (param.marks || 0) : sum,
        0
      );
      const totalNegativeMarks = parameters.reduce(
        (sum, param) =>
          negativeParamMap[param.id] ? sum + (param.marks || 0) : sum,
        0
      );
      const netMarks = totalMarks - totalNegativeMarks;
      const commandPriorityObj = app.fds?.applicationPriority?.find(
        (p) => p.role?.toLowerCase() === "command"
      );
      const commandPriority = commandPriorityObj?.priority ?? Infinity;
      return {
        ...app,
        totalMarks,
        totalNegativeMarks,
        netMarks,
        commandPriority,
      };
    });

    allApps.sort((a, b) => a.commandPriority - b.commandPriority);

    // Pagination
    const totalItems = allApps.length;
    const paginatedData = allApps.slice(0, limitInt);
    
    const pagination = {
      totalItems,
      totalPages: Math.ceil(totalItems / limitInt),
      currentPage: pageInt,
      itemsPerPage: limitInt,
    };

    return ResponseHelper.success(
      200,
      "Fetched approved applications",
      paginatedData,
      pagination
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

    // Withdraw logic
    if (withdrawRequested) {
      const now = new Date();
      const withdrawQuery = `
        UPDATE ${config.table}
        SET is_withdraw_requested = TRUE,
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

    // Withdraw status update logic
    if (["approved", "rejected"].includes(withdraw_status)) {
      const checkRes = await client.query(
        `SELECT is_withdraw_requested FROM ${config.table} WHERE ${config.column} = $1`,
        [id]
      );
      if (checkRes.rowCount === 0)
        throw new Error("Application not found for withdraw status update");
      if (!checkRes.rows[0].is_withdraw_requested)
        throw new Error("No withdraw request found on this application.");

      const now = new Date();
      const updateWithdrawStatusQuery = `
        UPDATE ${config.table}
        SET withdraw_status = $1,
            withdraw_approved_by_role = $2,
            withdraw_approved_by_user_id = $3,
            withdraw_approved_at = $4
            ${
              withdraw_status === "approved"
                ? ", status_flag = 'withdrawed'"
                : ""
            }
        WHERE ${config.column} = $5
        RETURNING *;
      `;
      const updateValues = [
        withdraw_status,
        user.user_role,
        user.user_id,
        now,
        id,
      ];
      const updateResult = await client.query(
        updateWithdrawStatusQuery,
        updateValues
      );
      if (updateResult.rowCount === 0)
        throw new Error("Failed to update withdraw status");
      return updateResult.rows[0];
    }

    // Status validation
    const allowedStatuses = [
      "in_review",
      "in_clarification",
      "approved",
      "rejected",
      "shortlisted_approved",
    ];
    let statusLower = status ? status.toLowerCase() : null;
    const isStatusValid = statusLower && allowedStatuses.includes(statusLower);

    // Fetch FDS if needed
    let updatedFds = null;
    let isMemberStatusUpdate = false;
    if (statusLower === "approved" || member) {
      const fetchRes = await client.query(
        `SELECT ${config.fdsColumn} FROM ${config.table} WHERE ${config.column} = $1`,
        [id]
      );
      if (fetchRes.rowCount === 0) throw new Error("Application not found");
      const fds = fetchRes.rows[0][config.fdsColumn];

      // Clarification handling for approved status
      if (statusLower === "approved" && Array.isArray(fds?.parameters)) {
        fds.parameters = fds.parameters.map((param) => {
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

      // Member signature logic
      if (member && !iscdr) {
        if (!Array.isArray(fds.accepted_members)) fds.accepted_members = [];
        const existingIndex = fds.accepted_members.findIndex(
          (m) => m.member_id === member.member_id
        );
        const memberObj = {
          ...member,
          is_signature_added: member.is_signature_added ?? false,
        };
        if (existingIndex !== -1) {
          fds.accepted_members[existingIndex] = {
            ...fds.accepted_members[existingIndex],
            ...memberObj,
          };
        } else {
          fds.accepted_members.push(memberObj);
        }

        // Check if all members signed
        const profile = await AuthService.getProfile(user);
        const unit = profile?.data?.unit;
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
              let approvedAt = now;
              if (user.cw2_type === "mo" ) {
                await client.query(
                  `UPDATE ${config.table}
                   SET is_mo_approved = $2, mo_approved_at = $3, last_approved_at = $4
                   WHERE ${config.column} = $1 RETURNING *;`,
                  [id, true, approvedAt, now]
                );
              } else if (user.cw2_type === "ol") {
                await client.query(
                  `UPDATE ${config.table}
                   SET is_ol_approved = $2, ol_approved_at = $3, last_approved_at = $4
                   WHERE ${config.column} = $1 RETURNING *;`,
                  [id, true, approvedAt, now]
                );
              }
              if (user.user_role !== "cw2" && user.cw2_type !== "ol") {
                await client.query(
                  `UPDATE ${config.table}
                   SET last_approved_by_role = $2
                   WHERE is_mo_approved = $3 AND is_ol_approved = $4 AND ${config.column} = $1 RETURNING *;`,
                  [id, user.user_role, true, true]
                );
              }
            } else {
              if (status !== "rejected") statusLower = "shortlisted_approved";
              isMemberStatusUpdate = true;
            }
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

    // Status update logic
    if (isStatusValid || isMemberStatusUpdate) {
      let query, values;
      const now = new Date();
      if (statusLower === "approved") {
        query = `
          UPDATE ${config.table}
          SET status_flag = $1,
              last_approved_by_role = $3,
              last_approved_at = $4
          WHERE ${config.column} = $2
          RETURNING *;
        `;
        values = [statusLower, id, user.user_role, now];
      } else if (statusLower === "shortlisted_approved") {
        query = `
          UPDATE ${config.table}
          SET status_flag = $1,
              last_shortlisted_approved_role = $3
          WHERE ${config.column} = $2
          RETURNING *;
        `;
        values = [statusLower, id, user.user_role];
      } else if (statusLower === "rejected") {
        // preprocess role
        let role = user.user_role;
        if (role === "cw2" && (user.cw2_type === "mo" || user.cw2_type === "ol")) {
          role = `${role}_${user.cw2_type}`;
        }
      
        query = `
          UPDATE ${config.table}
          SET status_flag = $1,
              last_rejected_by_role = $3,
              last_rejected_at = $4
          WHERE ${config.column} = $2
          RETURNING *;
        `;
      
        values = [statusLower, id, role, now];
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
          SELECT *
          FROM ${config.table}
          WHERE ${config.column} = $1;
        `;
        values = [id];
      }
      const result = await client.query(query, values);
      if (result.rowCount === 0)
        throw new Error("Application not found or update failed");
      return result.rows[0];
    } else if (member) {
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

    // Get existing application
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

    // Helper for updating marks
    function updateParameterMarks(params, approvedParams) {
      if (!Array.isArray(params) || !Array.isArray(approvedParams))
        return params;
      return params.map((param) => {
        const approvedParam = approvedParams.find((p) => p.id === param.id);
        if (approvedParam) {
          return {
            ...param,
            approved_marks: approvedParam.approved_marks,
            approved_count: approvedParam.approved_count,
            approved_marks_documents: approvedParam.approved_marks_documents || [],
            approved_marks_reason: approvedParam.approved_marks_reason,
            approved_by_user: user.user_id,
            approved_by_role: user.user_role,
            approved_marks_at: now,
          };
        }
        return param;
      });
    }

    // Helper for updating grace marks
    function updateGraceMarks(graceMarksArr, marks) {
      if (marks === undefined) return graceMarksArr;
      if (!Array.isArray(graceMarksArr)) graceMarksArr = [];
      const existingIndex = graceMarksArr.findIndex(
        (entry) => entry.role === user.user_role
      );
      const graceEntry = {
        role: user.user_role,
        marksBy: user.user_id,
        marksAddedAt: now,
        marks,
      };
      if (existingIndex !== -1) {
        graceMarksArr[existingIndex] = graceEntry;
      } else {
        graceMarksArr.push(graceEntry);
      }
      return graceMarksArr;
    }

    // Helper for updating priority points
    function updatePriority(priorityArr, points) {
      if (points === undefined) return priorityArr;
      if (!Array.isArray(priorityArr)) priorityArr = [];
      const existingPriorityIndex = priorityArr.findIndex((entry) => {
        if (entry.role !== user.user_role) return false;
        if (user.user_role === "cw2") {
          return entry.cw2_type === user.cw2_type;
        }
        return true;
      });
      const priorityEntry = {
        role: user.user_role,
        priority: points,
        priorityAddedAt: now,
        ...(user.user_role === "cw2" && user.cw2_type
          ? { cw2_type: user.cw2_type }
          : {}),
      };
      if (existingPriorityIndex !== -1) {
        priorityArr[existingPriorityIndex] = priorityEntry;
      } else {
        priorityArr.push(priorityEntry);
      }
      return priorityArr;
    }

    // Helper for updating remarks
    function updateRemarks(remarksArr, remarkStr) {
      if (!remarkStr || typeof remarkStr !== "string") return remarksArr;
      if (!Array.isArray(remarksArr)) remarksArr = [];
      const newRemark = {
        remarks: remarkStr,
        remark_added_by_role: user.user_role,
        remark_added_by: user.user_id,
        remark_added_at: now,
      };
      const existingIndex = remarksArr.findIndex(
        (r) => r.remark_added_by_role === user.user_role
      );
      if (existingIndex !== -1) {
        remarksArr[existingIndex] = newRemark;
      } else {
        remarksArr.push(newRemark);
      }
      return remarksArr;
    }

    // Update FDS and remarks
    if (Array.isArray(parameters) && parameters.length > 0) {
      fds.parameters = updateParameterMarks(fds.parameters, parameters);
    }
    fds.applicationGraceMarks = updateGraceMarks(
      fds.applicationGraceMarks,
      applicationGraceMarks
    );
    fds.applicationPriority = updatePriority(
      fds.applicationPriority,
      applicationPriorityPoints
    );
    remarks = updateRemarks(remarks, remark);

    await client.query(
      `UPDATE ${tableName}
       SET ${fdsColumn} = $1, remarks = $2
       WHERE ${idColumn} = $3`,
      [JSON.stringify(fds), JSON.stringify(remarks), application_id]
    );
    return ResponseHelper.success(200, "Marks approved successfully");
  } catch (error) {
    return ResponseHelper.error(500, "Failed to approve marks", error.message);
  } finally {
    client.release();
  }
};

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
    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    // CW2 role shortcut
    if (user_role.toLowerCase() === "cw2") {
      const approvalField =
        user.cw2_type === "mo"
          ? "is_mo_approved"
          : user.cw2_type === "ol"
          ? "is_ol_approved"
          : null;
      if (!approvalField) throw new Error("Invalid cw2_type for CW2 user.");

      const [citationsRes, appreciationsRes] = await Promise.all([
        client.query(
          `SELECT citation_id AS id, 'citation' AS type, unit_id, date_init, citation_fds AS fds, status_flag FROM Citation_tab WHERE ${approvalField} = true ORDER BY date_init DESC LIMIT $1 OFFSET $2`,
          [limitInt, offset]
        ),
        client.query(
          `SELECT appreciation_id AS id, 'appreciation' AS type, unit_id, date_init, appre_fds AS fds, status_flag FROM Appre_tab WHERE ${approvalField} = true ORDER BY date_init DESC LIMIT $1 OFFSET $2`,
          [limitInt, offset]
        ),
      ]);
      let allApps = [...citationsRes.rows, ...appreciationsRes.rows];

      if (award_type) {
        allApps = allApps.filter(
          (app) =>
            app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
        );
      }
      if (search) {
        const normalize = (s) => s?.toLowerCase().replace(/[\s-]/g, "");
        const searchNorm = normalize(search);
        allApps = allApps.filter(
          (app) =>
            app.id.toString().toLowerCase().includes(searchNorm) ||
            normalize(app.fds?.cycle_period || "").includes(searchNorm)
        );
      }
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

    // For other roles
    const ROLE_HIERARCHY = ["unit", "brigade", "division", "corps", "command"];
    const currentRole = user_role.toLowerCase();
    const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
    if (currentIndex === -1) throw new Error("Invalid user role");

    const subordinateFieldMap = {
      brigade: "bde",
      division: "div",
      corps: "corps",
      command: "comd",
    };

    let unitIds = [];
    if (currentRole === "unit") {
      unitIds = [unit.unit_id];
    } else {
      const matchField = subordinateFieldMap[currentRole];
      const subUnitsRes = await client.query(
        `SELECT unit_id FROM Unit_tab WHERE ${matchField} = $1`,
        [unit.name]
      );
      unitIds = subUnitsRes.rows.map((u) => u.unit_id);
    }
    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No applications found", [], {
        totalItems: 0,
      });
    }

    const allowedRoles = ROLE_HIERARCHY.slice(currentIndex);
    const lowerRoles = allowedRoles
      .map((role, idx) =>
        idx > 0 ? ROLE_HIERARCHY[currentIndex + idx - 1] : null
      )
      .filter(Boolean);

    const baseFilters = `
      unit_id = ANY($1) AND (
        (status_flag = 'approved' AND last_approved_by_role = ANY($2)) OR
        (status_flag = 'shortlisted_approved' AND last_approved_by_role = ANY($2)) OR
        (status_flag = 'rejected' AND last_rejected_by_role = ANY($3)) OR
        (status_flag = 'withdrawed' AND withdraw_requested_by = ANY($4))
      )
    `;
    const queryParams = [unitIds, allowedRoles, lowerRoles, [user.user_role]];
    const citationQuery = `
    SELECT 
      c.citation_id AS id,
      'citation' AS type,
      c.unit_id,
      row_to_json(u) AS unit_details,
      c.date_init,
      c.citation_fds AS fds,
      c.status_flag,
      c.is_mo_approved,
      c.mo_approved_at,
      c.is_ol_approved,
      c.ol_approved_at,
      c.last_approved_by_role,
      c.last_approved_at
    FROM Citation_tab c
    LEFT JOIN (
      SELECT 
        unit_id,
        sos_no,
        name,
        adm_channel,
        tech_channel,
        bde,
        div,
        corps,
        comd,
        unit_type,
        matrix_unit,
        location,
        awards,
        members,
        is_hr_review,
        is_dv_review,
        is_mp_review,
        created_at,
        updated_at
      FROM Unit_tab
    ) u ON c.unit_id = u.unit_id
    WHERE ${baseFilters.replace(/unit_id/g, 'c.unit_id')}
  `;
  
  const appreQuery = `
    SELECT 
      a.appreciation_id AS id,
      'appreciation' AS type,
      a.unit_id,
      row_to_json(u) AS unit_details,
      a.date_init,
      a.appre_fds AS fds,
      a.status_flag,
      a.is_mo_approved,
      a.mo_approved_at,
      a.is_ol_approved,
      a.ol_approved_at,
      a.last_approved_by_role,
      a.last_approved_at
    FROM Appre_tab a
    LEFT JOIN (
      SELECT 
        unit_id,
        sos_no,
        name,
        adm_channel,
        tech_channel,
        bde,
        div,
        corps,
        comd,
        unit_type,
        matrix_unit,
        location,
        awards,
        members,
        is_hr_review,
        is_dv_review,
        is_mp_review,
        created_at,
        updated_at
      FROM Unit_tab
    ) u ON a.unit_id = u.unit_id
    WHERE ${baseFilters.replace(/unit_id/g, 'a.unit_id')}
  `;
  
  const [citations, appreciations] = await Promise.all([
    client.query(citationQuery, queryParams),
    client.query(appreQuery, queryParams)
  ]);
  
    let allApps = [...citations.rows, ...appreciations.rows];

    if (award_type) {
      allApps = allApps.filter(
        (app) => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }
    if (search) {
      const normalize = (s) => s?.toLowerCase().replace(/[\s-]/g, "");
      const searchNorm = normalize(search);
      allApps = allApps.filter(
        (app) =>
          app.id.toString().toLowerCase().includes(searchNorm) ||
          normalize(app.fds?.cycle_period || "").includes(searchNorm)
      );
    }

    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
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
      "Fetched applications history",
      paginatedData,
      pagination
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

exports.getAllApplications = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const {
      award_type,
      command_type,
      corps_type,
      division_type,
      brigade_type,
      search,
      page = 1,
      limit = 10,
    } = query;

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

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

    const ROLE_HIERARCHY = ["unit", "brigade", "division", "corps", "command"];
    const currentRole = user_role.toLowerCase();

    let unitIds = [];
    let allowedRoles = [];

    if (currentRole === "headquarter") {
      const allUnitsRes = await client.query(`SELECT unit_id FROM Unit_tab`);
      unitIds = allUnitsRes.rows.map((u) => u.unit_id);
      allowedRoles = ROLE_HIERARCHY;
    } else {
      const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
      if (currentIndex === -1) throw new Error("Invalid user role");

      const subordinateFieldMap = {
        brigade: "bde",
        division: "div",
        corps: "corps",
        command: "comd",
      };

      if (currentRole === "unit") {
        unitIds = [unit.unit_id];
      } else {
        const matchField = subordinateFieldMap[currentRole];
        const subUnitsRes = await client.query(
          `SELECT unit_id FROM Unit_tab WHERE ${matchField} = $1`,
          [unit.name]
        );
        unitIds = subUnitsRes.rows.map((u) => u.unit_id);
      }

      if (unitIds.length === 0) {
        return ResponseHelper.success(200, "No applications found", [], {
          totalItems: 0,
        });
      }

      allowedRoles = ROLE_HIERARCHY.slice(0, currentIndex + 1);
    }

    let baseFilters;
    let queryParams = [unitIds];

    if (currentRole === "headquarter") {
      baseFilters = `unit_id = ANY($1)`;
    } else {
      baseFilters = `
        (
          (
            unit_id = ANY($1) AND
            status_flag IN ('approved', 'rejected','shortlisted_approved') AND
            last_approved_by_role = ANY($2)
          )
          OR
          (
            unit_id = ANY($1) AND
            status_flag = 'in_review' AND
            last_approved_by_role IS NULL AND
            last_approved_at IS NULL
          )
          OR
          (
            unit_id = ANY($1) AND
            status_flag = 'rejected' AND
            last_approved_by_role IS NULL AND
            last_approved_at IS NULL
          )
        )
      `;
      queryParams.push(allowedRoles);
    }

    const citationQuery = `
    SELECT 
      c.citation_id AS id,
      'citation' AS type,
      c.unit_id,
      row_to_json(u) AS unit_details,
      c.date_init,
      c.citation_fds AS fds,
      c.status_flag,
      c.is_mo_approved,
      c.mo_approved_at,
      c.is_ol_approved,
      c.ol_approved_at,
      c.last_approved_by_role,
      c.last_approved_at
    FROM Citation_tab c
    LEFT JOIN (
      SELECT 
        unit_id,
        sos_no,
        name,
        adm_channel,
        tech_channel,
        bde,
        div,
        corps,
        comd,
        unit_type,
        matrix_unit,
        location,
        awards,
        members,
        is_hr_review,
        is_dv_review,
        is_mp_review,
        created_at,
        updated_at
      FROM Unit_tab
    ) u ON c.unit_id = u.unit_id
    WHERE ${baseFilters.replace(/unit_id/g, 'c.unit_id')}
    `;
    
    const appreQuery = `
    SELECT 
      a.appreciation_id AS id,
      'appreciation' AS type,
      a.unit_id,
      row_to_json(u) AS unit_details,
      a.date_init,
      a.appre_fds AS fds,
      a.status_flag,
      a.is_mo_approved,
      a.mo_approved_at,
      a.is_ol_approved,
      a.ol_approved_at,
      a.last_approved_by_role,
      a.last_approved_at
    FROM Appre_tab a
    LEFT JOIN (
      SELECT 
        unit_id,
        sos_no,
        name,
        adm_channel,
        tech_channel,
        bde,
        div,
        corps,
        comd,
        unit_type,
        matrix_unit,
        location,
        awards,
        members,
        is_hr_review,
        is_dv_review,
        is_mp_review,
        created_at,
        updated_at
      FROM Unit_tab
    ) u ON a.unit_id = u.unit_id
    WHERE ${baseFilters.replace(/unit_id/g, 'a.unit_id')}
    `;
    

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, queryParams),
      client.query(appreQuery, queryParams),
    ]);

    let allApps = [...citations.rows, ...appreciations.rows];

    // Filtering helpers
    const normalize = (s) => s?.toLowerCase().replace(/[\s-]/g, "");
    if (award_type) {
      allApps = allApps.filter(
        (app) => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }
    if (command_type) {
      allApps = allApps.filter(
        (app) => app.fds?.command?.toLowerCase() === command_type.toLowerCase()
      );
    }
    if (corps_type) {
      allApps = allApps.filter(
        (app) => app.fds?.corps?.toLowerCase() === corps_type.toLowerCase()
      );
    }
    if (division_type) {
      allApps = allApps.filter(
        (app) =>
          app.fds?.division?.toLowerCase() === division_type.toLowerCase()
      );
    }
    if (brigade_type) {
      allApps = allApps.filter(
        (app) => app.fds?.brigade?.toLowerCase() === brigade_type.toLowerCase()
      );
    }

    if (search) {
      const searchNorm = normalize(search);
      allApps = allApps.filter(
        (app) =>
          app.id.toString().toLowerCase().includes(searchNorm) ||
          normalize(app.fds?.cycle_period || "").includes(searchNorm) ||
          normalize(app.fds?.unit_name || "").includes(searchNorm) ||
          normalize(app.fds?.brigade || "").includes(searchNorm) ||
          normalize(app.fds?.division || "").includes(searchNorm) ||
          normalize(app.fds?.corps || "").includes(searchNorm) ||
          normalize(app.fds?.command || "").includes(searchNorm)
      );
    }

    // Clarifications linking
    const clarificationIds = [];
    allApps.forEach((app) => {
      app.fds?.parameters?.forEach((param) => {
        if (param.clarification_id) {
          clarificationIds.push(param.clarification_id);
        }
      });
    });

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

    // Attach clarifications
    allApps = allApps.map((app) => {
      const updatedParams =
        app.fds?.parameters?.map((param) => {
          if (param.clarification_id) {
            return {
              ...param,
              clarification: clarificationMap[param.clarification_id] || null,
            };
          }
          return param;
        }) || [];

      return {
        ...app,
        fds: {
          ...app.fds,
          parameters: updatedParams,
        },
      };
    });

    // Marks calculation
    const allParameterNames = Array.from(
      new Set(
        allApps.flatMap(
          (app) =>
            app.fds?.parameters?.map((p) => p.name?.trim().toLowerCase()) || []
        )
      )
    );

    const parameterMasterRes = await client.query(
      `SELECT name, negative FROM Parameter_Master WHERE LOWER(TRIM(name)) = ANY($1)`,
      [allParameterNames]
    );

    const negativeParamMap = parameterMasterRes.rows.reduce((acc, row) => {
      acc[row.name.trim().toLowerCase()] = row.negative;
      return acc;
    }, {});

    allApps = allApps.map((app) => {
      const parameters = app.fds?.parameters || [];
      const totalMarks = parameters.reduce(
        (sum, param) => sum + (param.marks || 0),
        0
      );
      const totalNegativeMarks = parameters.reduce((sum, param) => {
        const isNegative = negativeParamMap[param.name?.trim().toLowerCase()];
        return isNegative ? sum + (param.marks || 0) : sum;
      }, 0);
      const netMarks = totalMarks - totalNegativeMarks;

      return {
        ...app,
        totalMarks,
        totalNegativeMarks,
        netMarks,
        fds: {
          ...app.fds,
          parameters: parameters.map((p) => {
            const param = { ...p };
            delete param.clarification;
            return param;
          }),
        },
      };
    });
// Fix last_approved_by_role logic
allApps = allApps.map((app) => {
  // Skip if status is draft
 
  let updatedRole = app.last_approved_by_role;
   console.log(updatedRole)
     if (app.is_ol_approved && app.is_mo_approved) {
    updatedRole = "CW2";
  }
  else if (app.is_mo_approved) {
    updatedRole = "Mo";
  } else if (app.is_ol_approved) {
    updatedRole = "OL";
  } else if (app.status_flag !== "draft" && !updatedRole) {
    updatedRole = "brigade";
  }
else if (app.updatedRole == "brigade") {
    updatedRole = "division";
  }
  else if (app.updatedRole == "division") {
    updatedRole = "corps";
  }
   else if (app.updatedRole == "corps") {
    updatedRole = "command";
  }
   else if (app.updatedRole == "command") {
    updatedRole = "MO/OL";
  }
  else if (app.is_ol_approved && app.is_mo_approved) {
    updatedRole = "CW2";
  }
  return {
    ...app,
    last_approved_by_role: updatedRole,
  };
});

    // Sort and paginate
    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

   
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
      "Fetched all applications",
      paginatedData,
      pagination
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




// In the same file where both APIs live (service module)

exports.getApplicationStats = async (user, _query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user || {};
    const roleLc = (user_role || '').toLowerCase();

    // Base aggregates (unchanged)
    const { rows } = await client.query(`
      SELECT 
        -- total
        (SELECT COUNT(*) FROM Citation_tab) +
        (SELECT COUNT(*) FROM Appre_tab) AS totalApplications,

        -- pending: not command-approved AND status != rejected (NULL-safe)
        (SELECT COUNT(*) FROM Citation_tab 
           WHERE last_approved_by_role IS DISTINCT FROM 'command'
             AND status_flag IS DISTINCT FROM 'rejected') +
        (SELECT COUNT(*) FROM Appre_tab 
           WHERE last_approved_by_role IS DISTINCT FROM 'command'
             AND status_flag IS DISTINCT FROM 'rejected') AS pendingApplications,

        -- rejected
        (SELECT COUNT(*) FROM Citation_tab WHERE status_flag = 'rejected') +
        (SELECT COUNT(*) FROM Appre_tab   WHERE status_flag = 'rejected') AS rejectedApplications,

        -- finalised
        (SELECT COUNT(*) FROM Citation_tab WHERE is_ol_approved = true) +
        (SELECT COUNT(*) FROM Appre_tab   WHERE is_ol_approved = true) AS finalisedApplications,

        -- approved by command
        (SELECT COUNT(*) FROM Citation_tab WHERE last_approved_by_role = 'command') +
        (SELECT COUNT(*) FROM Appre_tab   WHERE last_approved_by_role = 'command') AS approvedApplications
    `);

    const s = rows[0];
    let totalFromApi = parseInt(s.totalapplications, 10);
    try {
      const totalRes = await exports.getAllApplications(user, { ..._query, page: 1, limit: 1000 });
      const ok = totalRes && ((totalRes.statusCode || totalRes.status) === 200);
      if (ok) {
        totalFromApi = totalRes.data.length
          
      }
    } catch (_) {
      // fallback to DB total already in totalFromApi
    }
    // --- recommendedApplications ---
    let recommendedApplications = 0;
    if (roleLc === 'headquarter') {
      // HQ: recommended == approved by command
      recommendedApplications = parseInt(s.approvedapplications, 10);
    } else if (roleLc) {
      // Non-HQ: use subordinate listing as source of truth
      const subRes = await exports.getApplicationsOfSubordinates(user, {
        page: 1,
        limit: 100,           // use meta.totalItems to avoid fetching everything
        isShortlisted: true // matches your "recommended" listing logic
      });

      const ok = (subRes.data !=[] && ((subRes.statusCode || subRes.status) === 200));
      if (ok) {
        recommendedApplications = subRes.data.length
      }
    }

    // --- pending ---
    // HQ: keep SQL pending
    // Non-HQ: total - rejected - recommended
    let totalPendingApplications = parseInt(s.pendingapplications, 10);
    if (roleLc && roleLc !== 'headquarter') {
      const pendRes = await exports.getApplicationsOfSubordinates(user, {
        page: 1,
        limit: 100,                 // use meta.totalItems
        isGetNotClarifications: true
      });
      const ok = pendRes && ((pendRes.statusCode || pendRes.status) === 200);
      if (ok) {
        totalPendingApplications = pendRes.data.length
       
      }}
    
  

    // --- acceptedApplications ---
    // Non-HQ: acceptedApplications = recommendedApplications (your request)
    // HQ: acceptedApplications = approved by command (unchanged)
    const acceptedApplications = (roleLc && roleLc !== 'headquarter')
      ? recommendedApplications
      : parseInt(s.approvedapplications, 10);
if(totalFromApi==0){
  s.rejectedapplications =0
}
    return ResponseHelper.success(200, 'Application stats', {
      clarificationRaised:     totalFromApi,       // total
      totalPendingApplications,                                          // pending (role-aware)
      rejected:                 parseInt(s.rejectedapplications, 10),    // rejected
      approved:                 parseInt(s.finalisedapplications, 10),   // finalised (unchanged)
      acceptedApplications,                                             // now role-aware                                         // new/role-aware
    });
  } catch (err) {
    return ResponseHelper.error(500, 'Failed to compute application stats', err.message);
  } finally {
    client.release();
  }
};



async function loadApplications(whereSql = '', params = []) {
  const client = await dbService.getClient();
  try {
    const citationQuery = `
      SELECT 
        c.citation_id AS id,
        'citation' AS type,
        c.unit_id,
        row_to_json(u) AS unit_details,
        c.date_init,
        c.citation_fds AS fds,
        c.status_flag,
        c.is_mo_approved,
        c.mo_approved_at,
        c.is_ol_approved,
        c.ol_approved_at,
        c.last_approved_by_role,
        c.last_approved_at
      FROM Citation_tab c
      LEFT JOIN (
        SELECT 
          unit_id, sos_no, name, adm_channel, tech_channel, bde, div, corps, comd,
          unit_type, matrix_unit, location, awards, members, is_hr_review, is_dv_review,
          is_mp_review, created_at, updated_at
        FROM Unit_tab
      ) u ON c.unit_id = u.unit_id
      ${whereSql ? `WHERE ${whereSql.replace(/^\s*AND\s*/i, '')}` : ''}
    `;

    const appreQuery = `
      SELECT 
        a.appreciation_id AS id,
        'appreciation' AS type,
        a.unit_id,
        row_to_json(u) AS unit_details,
        a.date_init,
        a.appre_fds AS fds,
        a.status_flag,
        a.is_mo_approved,
        a.mo_approved_at,
        a.is_ol_approved,
        a.ol_approved_at,
        a.last_approved_by_role,
        a.last_approved_at
      FROM Appre_tab a
      LEFT JOIN (
        SELECT 
          unit_id, sos_no, name, adm_channel, tech_channel, bde, div, corps, comd,
          unit_type, matrix_unit, location, awards, members, is_hr_review, is_dv_review,
          is_mp_review, created_at, updated_at
        FROM Unit_tab
      ) u ON a.unit_id = u.unit_id
      ${whereSql ? `WHERE ${whereSql.replace(/^\s*AND\s*/i, '')}` : ''}
    `;

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, params),
      client.query(appreQuery, params),
    ]);

    let allApps = [...citations.rows, ...appreciations.rows];

    // ----- Clarification linking -----
    const clarificationIds = [];
    for (const app of allApps) {
      for (const p of (app.fds?.parameters || [])) {
        if (p.clarification_id) clarificationIds.push(p.clarification_id);
      }
    }

    let clarificationMap = {};
    if (clarificationIds.length > 0) {
      const clarRes = await client.query(
        `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
        [clarificationIds]
      );
      clarificationMap = clarRes.rows.reduce((acc, cur) => {
        acc[cur.clarification_id] = cur;
        return acc;
      }, {});
    }

    allApps = allApps.map((app) => {
      const updatedParams = (app.fds?.parameters || []).map((param) => {
        if (param.clarification_id) {
          return {
            ...param,
            clarification: clarificationMap[param.clarification_id] || null,
          };
        }
        return param;
      });
      return { ...app, fds: { ...app.fds, parameters: updatedParams } };
    });

    // ----- Marks calculation -----
    const allParamNames = Array.from(
      new Set(
        allApps.flatMap(
          (app) => (app.fds?.parameters || []).map((p) => p.name?.trim().toLowerCase())
        )
      )
    );

    let negativeParamMap = {};
    if (allParamNames.length > 0) {
      const pmRes = await client.query(
        `SELECT name, negative FROM Parameter_Master WHERE LOWER(TRIM(name)) = ANY($1)`,
        [allParamNames]
      );
      negativeParamMap = pmRes.rows.reduce((acc, row) => {
        acc[row.name.trim().toLowerCase()] = row.negative;
        return acc;
      }, {});
    }

    allApps = allApps.map((app) => {
      const parameters = app.fds?.parameters || [];
      const totalMarks = parameters.reduce((sum, p) => sum + (p.marks || 0), 0);
      const totalNegativeMarks = parameters.reduce((sum, p) => {
        const isNeg = negativeParamMap[p.name?.trim().toLowerCase()];
        return isNeg ? sum + (p.marks || 0) : sum;
      }, 0);
      const netMarks = totalMarks - totalNegativeMarks;

      // remove embedded clarification blob in final output (optional—kept here)
      const cleanedParams = parameters.map((p) => {
        const { clarification, ...rest } = p;
        return rest;
      });

      return {
        ...app,
        totalMarks,
        totalNegativeMarks,
        netMarks,
        fds: { ...app.fds, parameters: cleanedParams },
      };
    });

    // Sort newest first
    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
    return allApps;
  } finally {
    client.release();
  }
}

// ---------------------------
// Pagination helper
// ---------------------------
function paginate(items, page = 1, limit = 10) {
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.max(parseInt(limit) || 10, 1);
  const start = (p - 1) * l;
  const end = start + l;
  const slice = items.slice(start, end);
  return {
    data: slice,
    meta: {
      totalItems: items.length,
      totalPages: Math.ceil(items.length / l),
      currentPage: p,
      itemsPerPage: l,
    },
  };
}

exports.listAllApplications = async (query = {}) => {
  try {
    const allApps = await loadApplications();
    const { data, meta } = paginate(allApps, query.page, query.limit);
    return ResponseHelper.success(200, 'All applications', data, meta);
  } catch (err) {
    return ResponseHelper.error(500, 'Failed to list all applications', err.message);
  }
};

// 2) Pending applications: NOT command-approved AND status != rejected
exports.listPendingApplications = async (query = {}) => {
  try {
    const whereSql = `
      (last_approved_by_role IS DISTINCT FROM 'command')
      AND (status_flag IS DISTINCT FROM 'rejected')
    `;
    const allApps = await loadApplications(whereSql);
    const { data, meta } = paginate(allApps, query.page, query.limit);
    return ResponseHelper.success(200, 'Pending applications', data, meta);
  } catch (err) {
    return ResponseHelper.error(500, 'Failed to list pending applications', err.message);
  }
};

// 3) Rejected applications
exports.listRejectedApplications = async (query = {}) => {
  try {
    const whereSql = `status_flag = 'rejected'`;
    const allApps = await loadApplications(whereSql);
    const { data, meta } = paginate(allApps, query.page, query.limit);
    return ResponseHelper.success(200, 'Rejected applications', data, meta);
  } catch (err) {
    return ResponseHelper.error(500, 'Failed to list rejected applications', err.message);
  }
};

// 4) Finalised applications (is_ol_approved = true)
exports.listFinalisedApplications = async (query = {}) => {
  try {
    const whereSql = `is_ol_approved = true`;
    const allApps = await loadApplications(whereSql);
    const { data, meta } = paginate(allApps, query.page, query.limit);
    return ResponseHelper.success(200, 'Finalised applications', data, meta);
  } catch (err) {
    return ResponseHelper.error(500, 'Failed to list finalised applications', err.message);
  }
};

// 5) Approved applications (approved by command)
exports.listApprovedApplications = async (query = {}) => {
  try {
    const whereSql = `last_approved_by_role = 'command'`;
    const allApps = await loadApplications(whereSql);
    const { data, meta } = paginate(allApps, query.page, query.limit);
    return ResponseHelper.success(200, 'Approved applications', data, meta);
  } catch (err) {
    return ResponseHelper.error(500, 'Failed to list approved applications', err.message);
  }
};


exports.getApplicationsSummary = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const {
      award_type,
      command_type,
      corps_type,
      division_type,
      brigade_type,
      search,
      group_by = "comd", // comd | corps | div | bde | arms_service
    } = query || {};

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    const roleFieldRequirements = {
      unit: ["bde", "div", "corps", "comd", "name"],
      brigade: ["div", "corps", "comd", "name"],
      division: ["corps", "comd", "name"],
      corps: ["comd", "name"],
      command: ["name"],
    };
    const requiredFields = roleFieldRequirements[user_role.toLowerCase()] || [];
    const missingFields = requiredFields.filter((f) => !unit?.[f] || unit[f] === "");
    if (missingFields.length > 0) {
      return ResponseHelper.error(400, "Please complete your unit profile before proceeding.",
        "Missing fields: " + missingFields.join(", "));
    }

    const ROLE_HIERARCHY = ["unit", "brigade", "division", "corps", "command"];
    const currentRole = user_role.toLowerCase();

    let unitIds = [];
    let allowedRoles = [];

    if (currentRole === "headquarter") {
      const allUnitsRes = await client.query(`SELECT unit_id FROM Unit_tab`);
      unitIds = allUnitsRes.rows.map((u) => u.unit_id);
      allowedRoles = ROLE_HIERARCHY;
    } else {
      const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
      if (currentIndex === -1) throw new Error("Invalid user role");

      const subordinateFieldMap = { brigade: "bde", division: "div", corps: "corps", command: "comd" };
      if (currentRole === "unit") {
        unitIds = [unit.unit_id];
      } else {
        const matchField = subordinateFieldMap[currentRole];
        const subUnitsRes = await client.query(`SELECT unit_id FROM Unit_tab WHERE ${matchField} = $1`, [unit.name]);
        unitIds = subUnitsRes.rows.map((u) => u.unit_id);
      }
      if (unitIds.length === 0) {
        return ResponseHelper.success(200, "Applications grouped", { x: [], y: [] });
      }
      allowedRoles = ROLE_HIERARCHY.slice(0, currentIndex + 1);
    }

    // ---------- KEY CHANGE: build params conditionally ----------
    const params = [unitIds];         // $1 always exists
    let baseAccess;
    if (currentRole === "headquarter") {
      baseAccess = `apps.unit_id = ANY($1)`;                  // uses only $1
    } else {
      params.push(allowedRoles);                               // now $2 exists
      baseAccess = `
        (
          (
            apps.unit_id = ANY($1) AND
            apps.status_flag IN ('approved','rejected','shortlisted_approved') AND
            apps.last_approved_by_role = ANY($2)
          )
          OR
          (
            apps.unit_id = ANY($1) AND
            apps.status_flag = 'in_review' AND
            apps.last_approved_by_role IS NULL AND
            apps.last_approved_at IS NULL
          )
          OR
          (
            apps.unit_id = ANY($1) AND
            apps.status_flag = 'rejected' AND
            apps.last_approved_by_role IS NULL AND
            apps.last_approved_at IS NULL
          )
        )
      `;
    }

    // keep numbering correct based on what's already in params
    let p = params.length; // 1 for HQ, 2 for others

    const extra = [];
    if (award_type) {
      params.push(award_type); p++;
      extra.push(`LOWER(apps.fds->>'award_type') = LOWER($${p})`);
    }
    if (command_type) {
      params.push(command_type); p++;
      extra.push(`LOWER(COALESCE(NULLIF(apps.fds->>'command',''), u.comd)) = LOWER($${p})`);
    }
    if (corps_type) {
      params.push(corps_type); p++;
      extra.push(`LOWER(COALESCE(NULLIF(apps.fds->>'corps',''), u.corps)) = LOWER($${p})`);
    }
    if (division_type) {
      params.push(division_type); p++;
      extra.push(`LOWER(COALESCE(NULLIF(apps.fds->>'division',''), u.div)) = LOWER($${p})`);
    }
    if (brigade_type) {
      params.push(brigade_type); p++;
      extra.push(`LOWER(COALESCE(NULLIF(apps.fds->>'brigade',''), u.bde)) = LOWER($${p})`);
    }
    if (search) {
      params.push(`%${search}%`); p++;
      extra.push(`(
        CAST(apps.id AS TEXT) ILIKE $${p} OR
        apps.fds->>'cycle_period' ILIKE $${p} OR
        apps.fds->>'unit_name' ILIKE $${p} OR
        u.bde ILIKE $${p} OR u.div ILIKE $${p} OR u.corps ILIKE $${p} OR u.comd ILIKE $${p}
      )`);
    }

    const key = String(group_by || "comd").toLowerCase();
    const normKey = key === "brigade" || key === "brig" ? "bde" : key === "corp" ? "corps" : key;

    const groupExprMap = {
      comd: "u.comd",
      corps: "u.corps",
      div: "u.div",
      bde: "u.bde",
      arms_service: "NULLIF(apps.fds->>'arms_service','')"
    };
    const groupExpr = groupExprMap[normKey];
    if (!groupExpr) {
      return ResponseHelper.error(400, "Invalid group_by. Use: comd | corps | div | bde | arms_service");
    }

    const whereAll = [baseAccess, ...extra].filter(Boolean).join(" AND ");

    const sql = `
      WITH apps AS (
        SELECT c.citation_id AS id,'citation'::text AS type,c.unit_id,c.date_init,c.status_flag,
               c.last_approved_by_role,c.last_approved_at,c.citation_fds AS fds
        FROM Citation_tab c
        UNION ALL
        SELECT a.appreciation_id AS id,'appreciation'::text AS type,a.unit_id,a.date_init,a.status_flag,
               a.last_approved_by_role,a.last_approved_at,a.appre_fds AS fds
        FROM Appre_tab a
      )
      SELECT COALESCE(${groupExpr}, 'Unspecified') AS label, COUNT(*) AS total
      FROM apps
      JOIN Unit_tab u ON u.unit_id = apps.unit_id
      WHERE ${whereAll}
      GROUP BY label
      ORDER BY label ASC
    `;

    const { rows } = await client.query(sql, params);
    const x = rows.map(r => r.label);
    const y = rows.map(r => Number(r.total));

    return ResponseHelper.success(200, "Applications grouped", { x, y }, {
      group_by: normKey,
      totalGroups: x.length,
      totalApplications: y.reduce((a,b)=>a+b,0),
    });
  } catch (err) {
    return ResponseHelper.error(500, "Failed to group applications", err.message);
  } finally {
    client.release();
  }
};