const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");
const { createDecipheriv } = require("crypto");

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

exports.getApplicationsOfSubordinates = async (user, query) => {
  const client = await dbService.getClient();

  try {
    const { user_role } = user;
    const { award_type, search } = query;
    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    const hierarchy = ["unit", "brigade", "division", "corps", "command"];
    const currentIndex = hierarchy.indexOf(user_role.toLowerCase());

    if (currentIndex === -1 || currentIndex === 0) {
      throw new Error("Invalid or lowest level user role");
    }

    let lowerRole = hierarchy[currentIndex - 1];
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
    const unitIds = subUnitsRes.rows.map((u) => u.unit_id);

    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No subordinate units found", []);
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

    if (award_type) {
      allApps = allApps.filter(app =>
        app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }

    const normalize = (str) => str?.toString().toLowerCase().replace(/[\s\-]/g, "");
    if (search) {
      const searchLower = normalize(search);
      allApps = allApps.filter(app => {
        const idMatch = app.id.toString().toLowerCase().includes(searchLower);
        const cycleMatch = normalize(app.fds?.cycle_period || "").includes(searchLower);
        return idMatch || cycleMatch;
      });
    }

    const clarificationIds = [];
    allApps.forEach(app => {
      const parameters = app.fds?.parameters || [];
      parameters.forEach(param => {
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

    allApps.forEach(app => {
      app.fds?.parameters?.forEach(param => {
        if (param.clarification_id && clarificationMap[param.clarification_id]) {
          param.clarification_details = clarificationMap[param.clarification_id];
        }
      });
    });

    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    return ResponseHelper.success(200, "Fetched subordinate applications", allApps);

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
    const { award_type, search } = query;

    if (!["command", "headquarter"].includes(user_role.toLowerCase())) {
      return ResponseHelper.error(403, "Access denied. Only 'command' and 'headquarter' roles allowed.");
    }

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
        return ResponseHelper.success(200, "No subordinate units found", []);
      }
    }

    // Base filter
    const baseFilter = `
      status_flag = 'approved' AND last_approved_by_role = 'command'
    `;

    const filterForCommand = `unit_id = ANY($1) AND ${baseFilter}`;
    const filterForHQ = baseFilter;

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
        isShortlisted
      FROM Citation_tab
      WHERE ${user_role.toLowerCase() === "command" ? filterForCommand : filterForHQ}
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
        isShortlisted
      FROM Appre_tab
      WHERE ${user_role.toLowerCase() === "command" ? filterForCommand : filterForHQ}
    `;

    const queryParams = user_role.toLowerCase() === "command" ? [unitIds] : [];

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, queryParams),
      client.query(appreQuery, queryParams),
    ]);

    let allApps = [...citations.rows, ...appreciations.rows];

    // Award type filter
    if (award_type) {
      allApps = allApps.filter(app =>
        app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
      );
    }

    // Search filter
    const normalize = (str) => str?.toString().toLowerCase().replace(/[\s\-]/g, "");
    if (search) {
      const searchLower = normalize(search);
      allApps = allApps.filter(app => {
        const idMatch = app.id.toString().toLowerCase().includes(searchLower);
        const cycleMatch = normalize(app.fds?.cycle_period || "").includes(searchLower);
        return idMatch || cycleMatch;
      });
    }

    // Optional: Add clarifications
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

    // Sort by date_init
    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    // Calculate total_marks for each application
    allApps.forEach(app => {
      if (Array.isArray(app.fds?.parameters)) {
        app.total_marks = app.fds.parameters.reduce((sum, param) => sum + (param.marks || 0), 0);
      } else {
        app.total_marks = 0;
      }
    });
    
    return ResponseHelper.success(200, "Fetched approved applications", allApps);

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
  