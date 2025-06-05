const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");
const { application } = require("express");

exports.getAllApplicationsForUnit = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const unitId = user.unit_id;
    const { award_type, search, page = 1, limit = 10 } = query;

    const citations = await client.query(`
      SELECT 
        citation_id AS id,
        'citation' AS type,
        unit_id,
        date_init,
        citation_fds AS fds,
        status_flag
      FROM Citation_tab
      WHERE unit_id = $1
    `, [unitId]);

    const appreciations = await client.query(`
      SELECT 
        appreciation_id AS id,
        'appreciation' AS type,
        unit_id,
        date_init,
        appre_fds AS fds,
        status_flag
      FROM Appre_tab
      WHERE unit_id = $1
    `, [unitId]);

    let allApps = [...citations.rows, ...appreciations.rows];

    if (award_type) {
      allApps = allApps.filter(app =>
        app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }

    const normalize = str => str?.toString().toLowerCase().replace(/[\s\-]/g, "");
    if (search) {
      const searchLower = normalize(search);
      allApps = allApps.filter(app => {
        const idMatch = app.id.toString().toLowerCase().includes(searchLower);
        const cycleMatch = normalize(app.fds?.cycle_period || "").includes(searchLower);
        return idMatch || cycleMatch;
      });
    }

    const clarificationIdSet = new Set();
    allApps.forEach(app => {
      app.fds?.parameters?.forEach(param => {
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

    allApps = allApps.map(app => {
      const updatedParams = app.fds?.parameters?.map(param => {
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

    let total_pending_clarifications = 0;
    allApps = allApps.map(app => {
      let clarifications_count = 0;
      const cleanedParameters = app.fds.parameters.map(param => {
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
          parameters: cleanedParameters
        }
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

    return ResponseHelper.success(200, "Fetched applications with clarifications",paginatedData,pagination);
  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch data", err.message);
  } finally {
    client.release();
  }
};

exports.getAllApplicationsForHQ = async (query) => {
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
        last_approved_by_role
      FROM Citation_tab
      WHERE status_flag = 'approved' AND last_approved_by_role = 'command'
    `);

    const appreciations = await client.query(`
      SELECT 
        appreciation_id AS id,
        'appreciation' AS type,
        unit_id,
        date_init,
        appre_fds AS fds,
        status_flag,
        last_approved_by_role
      FROM Appre_tab
      WHERE status_flag = 'approved' AND last_approved_by_role = 'command'
    `);

    let allApps = [...citations.rows, ...appreciations.rows];

    if (award_type) {
      allApps = allApps.filter(app =>
        app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }

    const normalize = str => str?.toString().toLowerCase().replace(/[\s\-]/g, "");
    if (search) {
      const searchLower = normalize(search);
      allApps = allApps.filter(app => {
        const idMatch = app.id.toString().toLowerCase().includes(searchLower);
        const cycleMatch = normalize(app.fds?.cycle_period || "").includes(searchLower);
        return idMatch || cycleMatch;
      });
    }

    const clarificationIdSet = new Set();
    allApps.forEach(app => {
      app.fds?.parameters?.forEach(param => {
        if (param.clarification_id) {
          clarificationIdSet.add(param.clarification_id);
        }
      });
    });

    const clarificationIds = Array.from(clarificationIdSet);
    let clarificationsMap = {};

    // Fetch all related clarifications
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

    allApps = allApps.map(app => {
      const updatedParams = app.fds?.parameters?.map(param => {
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

    let total_pending_clarifications = 0;
    allApps = allApps.map(app => {
      let clarifications_count = 0;
      const cleanedParameters = app.fds.parameters.map(param => {
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
          parameters: cleanedParameters
        }
      };
    });

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
      "Fetched HQ applications approved by command",
      paginatedData,
      pagination
    );
  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch HQ applications", err.message);
  } finally {
    client.release();
  }
};


exports.getSingleApplicationForUnit = async (user, { application_id, award_type }) => {
  const client = await dbService.getClient();

  try {
    let query = "";
    let params = [application_id];
    let application;

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
          c.isShortlisted
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
          a.isShortlisted
        FROM Appre_tab a
        JOIN Unit_tab u ON a.unit_id = u.unit_id
        WHERE a.appreciation_id = $1
      `;
    } else {
      return ResponseHelper.error(400, "Invalid award_type provided");
    }

    const res = await client.query(query, params);
    application = res.rows[0];

    if (!application) {
      return ResponseHelper.error(404, "Application not found");
    }
    const roleHierarchy = ["unit", "brigade", "division", "corps", "command"];
    const userRoleIndex = roleHierarchy.indexOf(user.user_role?.toLowerCase());
    
    // Parse fds to manipulate parameters array
    const fds = application.fds;
    for (let param of fds.parameters) {
      const clarificationId = param.clarification_id || param.last_clarification_id;
    
      if (clarificationId) {
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
    
        const clarRes = await client.query(clarificationsQuery, [clarificationId]);
    
        if (clarRes.rows.length > 0) {
          param.clarification_details = clarRes.rows[0];
        } else {
          param.clarification_details = null;
        }
      }
    
      if (param.clarification_details?.clarification_by_role) {
        const clarificationRoleIndex = roleHierarchy.indexOf(
          param.clarification_details.clarification_by_role?.toLowerCase()
        );
    
        if (
          clarificationRoleIndex >= 0 &&
          userRoleIndex > clarificationRoleIndex
        ) {
          // Current user has higher role → remove clarification-related fields
          delete param.clarification_id;
          delete param.last_clarification_id;
          delete param.clarification_details;
        }
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

exports.getApplicationsOfSubordinates = async (user, query) => {
  const client = await dbService.getClient();

  try {
    const { user_role } = user;
    const { award_type, search, page = 1, limit = 10 } = query;

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
    const missingFields = requiredFields.filter(field => !unit?.[field] || unit[field] === "");
    if (missingFields.length > 0) {
      throw new Error("Please complete your unit profile before proceeding.");
    }

    const hierarchy = ["unit", "brigade", "division", "corps", "command"];
    const currentIndex = hierarchy.indexOf(user_role.toLowerCase());

    if (currentIndex === -1 || currentIndex === 0) {
      throw new Error("Invalid or lowest level user role");
    }

    const lowerRole = hierarchy[currentIndex - 1];
    const subordinateFieldMap = {
      brigade: 'bde',
      division: 'div',
      corps: 'corps',
      command: 'comd',
    };
    const matchField = subordinateFieldMap[user_role.toLowerCase()];

    if (!matchField || !unit?.name) {
      throw new Error("Unit data or hierarchy mapping missing");
    }

    const subUnitsRes = await client.query(
      `SELECT unit_id FROM Unit_tab WHERE ${matchField} = $1`,
      [unit.name]
    );

    const unitIds = subUnitsRes.rows.map(u => u.unit_id);
    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No subordinate units found", [], { totalItems: 0 });
    }

    let baseFilters = '';
    const queryParams = [unitIds];

    if (user_role.toLowerCase() === 'brigade') {
      baseFilters = `unit_id = ANY($1) AND status_flag != 'approved' AND (last_approved_by_role IS NULL OR last_approved_at IS NULL)`;
    } else {
      baseFilters = `unit_id = ANY($1) AND status_flag = 'approved' AND last_approved_by_role = $2`;
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
        last_approved_at
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
        last_approved_at
      FROM Appre_tab
      WHERE ${baseFilters}
    `;

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, queryParams),
      client.query(appreQuery, queryParams)
    ]);

    let allApps = [...citations.rows, ...appreciations.rows];

    // Filter by award_type
    if (award_type) {
      allApps = allApps.filter(app =>
        app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }

    // Search filter
    const normalize = str => str?.toString().toLowerCase().replace(/[\s\-]/g, "");
    if (search) {
      const searchLower = normalize(search);
      allApps = allApps.filter(app => {
        const idMatch = app.id.toString().toLowerCase().includes(searchLower);
        const cycleMatch = normalize(app.fds?.cycle_period || "").includes(searchLower);
        return idMatch || cycleMatch;
      });
    }

    // Clarification linking
    const clarificationIds = [];
    allApps.forEach(app => {
      app.fds?.parameters?.forEach(param => {
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

    // Map clarification data to parameters
    allApps = allApps.map(app => {
      const updatedParams = app.fds?.parameters?.map(param => {
        if (param.clarification_id) {
          return {
            ...param,
            clarification: clarificationMap[param.clarification_id] || null,
          };
        }
        return param;
      });

      return {
        ...app,
        fds: {
          ...app.fds,
          parameters: updatedParams,
        }
      };
    });

    // Add clarification count per application
    let total_pending_clarifications = 0;
    allApps = allApps.map(app => {
      let clarifications_count = 0;
      const cleanedParameters = app.fds.parameters.map(param => {
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

    // Sort by date
    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    // ✅ Pagination
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

    return ResponseHelper.success(200, "Fetched subordinate applications", paginatedData, pagination);
  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch subordinate applications", err.message);
  } finally {
    client.release();
  }
};


exports.getApplicationsScoreboard = async (user, query) => {
  const client = await dbService.getClient();

  try {
    const { user_role } = user;
    const { award_type, search, page = 1, limit = 10 } = query;

    if (!["command", "headquarter"].includes(user_role.toLowerCase())) {
      return ResponseHelper.error(403, "Access denied. Only 'command' and 'headquarter' roles allowed.");
    }

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    const profile = await AuthService.getProfile(user);
    const unitName = profile?.data?.unit?.name;

    let unitIds = [];

    if (user_role.toLowerCase() === "command") {
      if (!unitName) {
        throw new Error("Command unit name not found in profile");
      }

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

    // Base filter
    const baseFilter = `
      status_flag = 'approved' AND last_approved_by_role = 'command'
    `;

    const filterForCommand = `unit_id = ANY($1) AND ${baseFilter}`;
    const filterForHQ = baseFilter;

    // We'll dynamically build WHERE clause and params for total count and data fetch
    const isCommand = user_role.toLowerCase() === "command";

    // First, get total count of all matching applications (citations + appreciations)

    // Combine both queries for counting rows separately
    const countParams = isCommand ? [unitIds] : [];
    const countWhereClause = isCommand ? filterForCommand : filterForHQ;

    const countCitationQuery = `
      SELECT COUNT(*) AS count FROM Citation_tab WHERE ${countWhereClause}
      ${award_type ? `AND LOWER(citation_fds->>'award_type') = LOWER($${countParams.length + 1})` : ''}
      ${search ? `AND (CAST(citation_id AS TEXT) ILIKE $${countParams.length + (award_type ? 2 : 1)} OR LOWER(citation_fds->>'cycle_period') ILIKE $${countParams.length + (award_type ? 2 : 1)})` : ''}
    `;

    const countAppreQuery = `
      SELECT COUNT(*) AS count FROM Appre_tab WHERE ${countWhereClause}
      ${award_type ? `AND LOWER(appre_fds->>'award_type') = LOWER($${countParams.length + 1})` : ''}
      ${search ? `AND (CAST(appreciation_id AS TEXT) ILIKE $${countParams.length + (award_type ? 2 : 1)} OR LOWER(appre_fds->>'cycle_period') ILIKE $${countParams.length + (award_type ? 2 : 1)})` : ''}
    `;

    // Build params for count queries
    const countValues = [...countParams];
    if (award_type) countValues.push(award_type);
    if (search) countValues.push(`%${search.toLowerCase()}%`);

    const [citationCountRes, appreCountRes] = await Promise.all([
      client.query(countCitationQuery, countValues),
      client.query(countAppreQuery, countValues),
    ]);

    const totalItems =
      parseInt(citationCountRes.rows[0].count) + parseInt(appreCountRes.rows[0].count);

    if (totalItems === 0) {
      return ResponseHelper.success(200, "No applications found", [], {
        totalItems: 0,
        totalPages: 0,
        currentPage: pageInt,
        itemsPerPage: limitInt,
      });
    }

    // Now fetch paginated data with union of citations + appreciations ordered by date_init desc
    // We'll use OFFSET/LIMIT on the union

    const dataParams = [...countParams];
    if (award_type) dataParams.push(award_type);
    if (search) dataParams.push(`%${search.toLowerCase()}%`);
    dataParams.push(limitInt, offset);

    // Query with UNION ALL to get combined results with pagination
    const dataQuery = `
      (
        SELECT
          citation_id AS id,
          'citation' AS type,
          unit_id,
          date_init,
          citation_fds AS fds,
          status_flag,
          last_approved_by_role,
          last_approved_at,
          isShortlisted
        FROM Citation_tab
        WHERE ${filterWhereClause('citation_fds')}
          ${award_type ? `AND LOWER(citation_fds->>'award_type') = LOWER($${dataParams.length - 1})` : ''}
          ${search ? `AND (CAST(citation_id AS TEXT) ILIKE $${dataParams.length - 0} OR LOWER(citation_fds->>'cycle_period') ILIKE $${dataParams.length - 0})` : ''}
      )
      UNION ALL
      (
        SELECT
          appreciation_id AS id,
          'appreciation' AS type,
          unit_id,
          date_init,
          appre_fds AS fds,
          status_flag,
          last_approved_by_role,
          last_approved_at,
          isShortlisted
        FROM Appre_tab
        WHERE ${filterWhereClause('appre_fds')}
          ${award_type ? `AND LOWER(appre_fds->>'award_type') = LOWER($${dataParams.length - 1})` : ''}
          ${search ? `AND (CAST(appreciation_id AS TEXT) ILIKE $${dataParams.length - 0} OR LOWER(appre_fds->>'cycle_period') ILIKE $${dataParams.length - 0})` : ''}
      )
      ORDER BY date_init DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `;

    // Helper to build base filter depending on role
    function filterWhereClause(fdsField) {
      if (isCommand) {
        return `unit_id = ANY($1) AND status_flag = 'approved' AND last_approved_by_role = 'command'`;
      } else {
        return `status_flag = 'approved' AND last_approved_by_role = 'command'`;
      }
    }

    const dataResult = await client.query(dataQuery, dataParams);

    let allApps = dataResult.rows;

    // Add clarifications
    const clarificationIds = [];
    allApps.forEach(app => {
      app.fds?.parameters?.forEach(param => {
        if (param.clarification_id) {
          clarificationIds.push(param.clarification_id);
        }
      });
    });

    if (clarificationIds.length > 0) {
      const clarRes = await client.query(
        `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
        [clarificationIds]
      );
      const clarMap = clarRes.rows.reduce((acc, cur) => {
        acc[cur.clarification_id] = cur;
        return acc;
      }, {});
      allApps.forEach(app => {
        app.fds?.parameters?.forEach(param => {
          if (param.clarification_id && clarMap[param.clarification_id]) {
            param.clarification_details = clarMap[param.clarification_id];
          }
        });
      });
    }

    // Calculate total_marks for each application
    allApps.forEach(app => {
      if (Array.isArray(app.fds?.parameters)) {
        app.total_marks = app.fds.parameters.reduce((sum, param) => sum + (param.marks || 0), 0);
      } else {
        app.total_marks = 0;
      }
    });

    const pagination = {
      totalItems,
      totalPages: Math.ceil(totalItems / limitInt),
      currentPage: pageInt,
      itemsPerPage: limitInt,
    };
    
    return ResponseHelper.success(200, "Fetched approved applications", allApps, pagination);

  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch scoreboard data", err.message);
  } finally {
    client.release();
  }
};


  exports.updateApplicationStatus = async (id, type, status, user) => {
    const client = await dbService.getClient();
  
    try {
      const validTypes = {
        citation: { table: "Citation_tab", column: "citation_id" },
        appreciation: { table: "Appre_tab", column: "appreciation_id" }
      };
  
      const config = validTypes[type];
      if (!config) throw new Error("Invalid application type");
  
      const allowedStatuses = ['in_review', 'in_clarification', 'approved', 'rejected'];
      const statusLower = status.toLowerCase();
      if (!allowedStatuses.includes(statusLower)) {
        throw new Error("Invalid status value");
      }
  
      let query, values;
  
      if (statusLower === 'approved') {
        // Include approval role and timestamp
        query = `
          UPDATE ${config.table}
          SET 
            status_flag = $1,
            last_approved_by_role = $3,
            last_approved_at = $4
          WHERE ${config.column} = $2
          RETURNING *;
        `;
        values = [statusLower, id, user.user_role, new Date()];
      } else {
        // Normal status update
        query = `
          UPDATE ${config.table}
          SET status_flag = $1
          WHERE ${config.column} = $2
          RETURNING *;
        `;
        values = [statusLower, id];
      }
  
      const result = await client.query(query, values);
  
      if (result.rowCount === 0) {
        throw new Error("Application not found or update failed");
      }
  
      return result.rows[0];
  
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
      const { type, application_id, parameters, applicationGraceMarks } = body;
  
      if (!["citation", "appreciation"].includes(type)) {
        return ResponseHelper.error(400, "Invalid type provided");
      }
  
      const tableName = type === "citation" ? "Citation_tab" : "Appre_tab";
      const idColumn = type === "citation" ? "citation_id" : "appreciation_id";
  
      // 1. Get existing application
      const res = await client.query(
        `SELECT ${idColumn}, ${type === "citation" ? "citation_fds" : "appre_fds"} AS fds FROM ${tableName} WHERE ${idColumn} = $1`,
        [application_id]
      );
  
      if (res.rowCount === 0) {
        return ResponseHelper.error(404, "Application not found");
      }
  
      let fds = res.rows[0].fds;
      const now = new Date();
  console.log(parameters)
      if (Array.isArray(parameters) && parameters.length > 0) {
        const updatedParams = fds.parameters.map((param) => {
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
  
        fds.parameters = updatedParams;
      }
  
      if (applicationGraceMarks !== undefined) {
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
      }
  
      // 4. Update in DB
      await client.query(
        `UPDATE ${tableName}
         SET ${type === "citation" ? "citation_fds" : "appre_fds"} = $1
         WHERE ${idColumn} = $2`,
        [fds, application_id]
      );
  
      return ResponseHelper.success(200, "Marks approved successfully");
    } catch (error) {
      return ResponseHelper.error(500, "Failed to approve marks", error.message);
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
  