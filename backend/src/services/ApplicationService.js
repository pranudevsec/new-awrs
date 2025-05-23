const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");

exports.getAllApplicationsForUnit = async (user, query) => {
    const client = await dbService.getClient();
    try {
      const unitId = user.unit_id;
      const { award_type, search } = query;
  
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
  
      // Filter by award type
      if (award_type) {
        allApps = allApps.filter((app) =>
          app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
        );
      }
  
      // Filter by search keyword
      const normalize = (str) =>
        str?.toString().toLowerCase().replace(/[\s\-]/g, "");
  
      if (search) {
        const searchLower = normalize(search);
        allApps = allApps.filter((app) => {
          const idMatch = app.id.toString().toLowerCase().includes(searchLower);
          const cycleMatch = normalize(app.fds?.cycle_period || "").includes(searchLower);
          return idMatch || cycleMatch;
        });
      }
  
      // Fetch clarifications for all clarification_ids in parameters
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
  
      // Inject clarification into matching parameter
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
      let total_pending_clarifications = 0;

      allApps = allApps.map(app => {
        let clarifications_count = 0;
      
        const cleanedParameters = app.fds.parameters.map(param => {
          const newParam = { ...param };
          if (newParam.clarification && newParam.clarification.clarification_status === "pending") {
            clarifications_count++;
            total_pending_clarifications++;
          }
      
          // Remove clarification and clarification_id
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
      
      // Sort by date_init descending
      allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
        return ResponseHelper.success(200, "Fetched applications with clarifications", allApps);
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
      const unitIds = subUnitsRes.rows.map((u) => u.unit_id);
  
      if (unitIds.length === 0) {
        return ResponseHelper.success(200, "No subordinate units found", []);
      }
  
      const citationQuery = `
        SELECT 
          citation_id AS id,
          'citation' AS type,
          unit_id,
          date_init,
          citation_fds AS fds,
          status_flag
        FROM Citation_tab
        WHERE unit_id = ANY($1)
      `;
  
      const appreQuery = `
        SELECT 
          appreciation_id AS id,
          'appreciation' AS type,
          unit_id,
          date_init,
          appre_fds AS fds,
          status_flag
        FROM Appre_tab
        WHERE unit_id = ANY($1)
      `;
  
      const [citations, appreciations] = await Promise.all([
        client.query(citationQuery, [unitIds]),
        client.query(appreQuery, [unitIds])
      ]);
  
      let allApps = [...citations.rows, ...appreciations.rows];
  
      // Filter by award_type if needed
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
  
      // Gather all clarification_ids from parameters
      const clarificationIds = [];
      allApps.forEach(app => {
        const parameters = app.fds?.parameters || [];
        parameters.forEach(param => {
          if (param.clarification_id) {
            clarificationIds.push(param.clarification_id);
          }
        });
      });
  
      // Fetch clarification records
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
  
      // Attach clarification data to each parameter
      allApps.forEach(app => {
        app.fds?.parameters?.forEach(param => {
          if (param.clarification_id && clarificationMap[param.clarification_id]) {
            param.clarification_details = clarificationMap[param.clarification_id];
          }
        });
      });
  
      // Sort by date
      allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
  
      return ResponseHelper.success(200, "Fetched subordinate applications", allApps);
  
    } catch (err) {
      return ResponseHelper.error(500, "Failed to fetch subordinate applications", err.message);
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
  