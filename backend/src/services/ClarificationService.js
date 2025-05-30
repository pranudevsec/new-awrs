const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");

exports.addClarification = async (user, data) => {
    const client = await dbService.getClient();
  
    try {
      const {
        type, // 'citation' or 'appreciation'
        application_id,
        parameter_name,
        clarification,
        clarification_doc,
        reviewer_comment, // new field added
      } = data;
  
      await client.query('BEGIN');
  
      const insertQuery = `
        INSERT INTO Clarification_tab (
          application_type, application_id, parameter_name,
          clarification_by_id, clarification_by_role,
          clarification_status, clarification, clarification_doc, reviewer_comment, clarification_sent_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, NOW())
        RETURNING clarification_id;
      `;
  
      const values = [
        type,
        application_id,
        parameter_name,
        user.user_id,
        user.user_role,
        clarification,
        clarification_doc,
        reviewer_comment,  // included in insert values
      ];
  
      const result = await client.query(insertQuery, values);
      const clarificationId = result.rows[0].clarification_id;
  
      // Choose table and column based on type
      const table = type === 'citation' ? 'Citation_tab' : 'Appre_tab';
      const jsonColumn = type === 'citation' ? 'citation_fds' : 'appre_fds';
  
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
        parameters: fds.parameters.map(param => {
          if (param.name === parameter_name) {
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
      await client.query(updateQuery, [JSON.stringify(updatedFds), application_id]);
  
      await client.query('COMMIT');
  
      return ResponseHelper.success(200, "Clarification added and linked successfully", {
        clarification_id: clarificationId,
      });
  
    } catch (err) {
      await client.query('ROLLBACK');
      return ResponseHelper.error(500, "Failed to insert and link clarification", err.message);
    } finally {
      client.release();
    }
  };
  

  exports.updateClarification = async (user, data, clarification_id) => {
    const client = await dbService.getClient();
    try {
      const {
        clarification,
        clarification_doc,
        clarification_status,
      } = data;
  
      if (!clarification_id) {
        return ResponseHelper.error(400, "clarification_id is required");
      }
  
      const clarificationRes = await client.query(
        `SELECT * FROM Clarification_tab WHERE clarification_id = $1`,
        [clarification_id]
      );
  
      if (clarificationRes.rowCount === 0) {
        return ResponseHelper.error(404, "Clarification not found");
      }
  
      const clarificationRow = clarificationRes.rows[0];
      const { application_type, application_id } = clarificationRow;
  
      const updates = [];
      const values = [];
      let i = 1;
  
      if (["unit", "brigade", "division", "corps", "command"].includes(user.user_role) && !clarification_status) {
        if (clarification !== undefined) {
          updates.push(`clarification = $${i++}`);
          values.push(clarification);
        }
  
        if (clarification_doc !== undefined) {
          updates.push(`clarification_doc = $${i++}`);
          values.push(clarification_doc);
        }
      } else {
        if (clarification_status !== undefined) {
          updates.push(`clarification_status = $${i++}`);
          values.push(clarification_status);
        }
      }
  
      if (updates.length === 0) {
        return ResponseHelper.error(400, "No permitted update fields provided");
      }
  
      updates.push(`clarified_at = NOW()`);
  
      const updateQuery = `
        UPDATE Clarification_tab
        SET ${updates.join(", ")}
        WHERE clarification_id = $${i}
        RETURNING *;
      `;
      values.push(clarification_id);
  
      const updateResult = await client.query(updateQuery, values);
  
      if (
        ["clarified", "rejected"].includes(clarification_status) &&
        application_type &&
        application_id
      ) {
        let appQuery = "";
        let tableName = "";
        let jsonField = "";
        let idField = "";
      
        if (application_type === "citation") {
          appQuery = `SELECT citation_fds FROM Citation_tab WHERE citation_id = $1`;
          tableName = "Citation_tab";
          jsonField = "citation_fds";
          idField = "citation_id";
        } else if (application_type === "appreciation") {
          appQuery = `SELECT appre_fds FROM Appre_tab WHERE appreciation_id = $1`;
          tableName = "Appre_tab";
          jsonField = "appre_fds";
          idField = "appreciation_id";
        }
      
        if (appQuery) {
          const appResult = await client.query(appQuery, [application_id]);
      
          if (appResult.rowCount > 0) {
            const fds = appResult.rows[0][jsonField];
          
            if (fds?.parameters && Array.isArray(fds.parameters)) {
              let wasClarificationRemoved = false;
          
              fds.parameters = fds.parameters.map(param => {
                if (param.clarification_id == clarification_id) {
                  wasClarificationRemoved = true;
          
                  // Destructure and add two new fields
                  const { clarification_id, ...rest } = param;
          
                  return {
                    ...rest,
                    last_clarification_handled_by: 'brigade',
                    last_clarification_status: 'clarified',
                    last_clarification_id: clarification_id
                  };
                }
                return param;
              });
          
              if (wasClarificationRemoved) {
                const updateJSONQuery = `
                  UPDATE ${tableName}
                  SET ${jsonField} = $1
                  WHERE ${application_type === "citation" ? "citation_id" : "appreciation_id"} = $2
                `;
          
                await client.query(updateJSONQuery, [fds, application_id]);
          
                const clarifiedEntry = {
                  clarification_id,
                  removed_at: new Date().toISOString(),
                  action: 'clarification_id_clarified',
                };
          
                const updateHistoryQuery = `
                  UPDATE Clarification_tab
                  SET clarified_history = COALESCE(clarified_history, '[]'::jsonb) || $1::jsonb
                  WHERE clarification_id = $2
                `;
          
                await client.query(updateHistoryQuery, [JSON.stringify([clarifiedEntry]), clarification_id]);
              }
            }
          
            const updatedFdsRes = await client.query(appQuery, [application_id]);
            const updatedFds = updatedFdsRes.rows[0][jsonField];
          }
          
        }
      }
      
      return ResponseHelper.success(
        200,
        "Clarification updated successfully",
        updateResult.rows[0]
      );
    } catch (err) {
      return ResponseHelper.error(500, "Failed to update clarification", err.message);
    } finally {
      client.release();
    }
  };
  
  
  exports.getAllApplicationsWithClarificationsForUnit = async (user, query) => {
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
  
      // Sort by date_init descending
      allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
      const filteredApplications = allApps.filter(app =>
        app.fds?.parameters?.some(param =>
          param.clarification?.clarification_by_role?.toLowerCase() === "brigade"
        )
      );
      
      return ResponseHelper.success(200, "Fetched applications with clarifications", filteredApplications);
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
      const roleHierarchy = ['unit', 'brigade', 'division', 'corps', 'command'];
      const currentRoleIndex = roleHierarchy.indexOf(user_role.toLowerCase());
  
      if (currentRoleIndex === -1 || currentRoleIndex >= roleHierarchy.length - 1) {
        return ResponseHelper.error(400, 'Invalid or top-level role');
      }
  
      const seniorRole = roleHierarchy[currentRoleIndex + 1];
      const matchingField = {
        brigade: 'bde',
        division: 'div',
        corps: 'corps',
        command: 'comd',
      }[user_role.toLowerCase()];
  
      const ownUnitRes = await client.query(`SELECT * FROM Unit_tab WHERE unit_id = $1`, [unit_id]);
      const ownUnitData = ownUnitRes.rows[0];
      if (!ownUnitData) return ResponseHelper.error(404, 'Unit not found');
  
      const ownUnitName = ownUnitData.name;
  
      const clarificationQuery = `
        SELECT * FROM Clarification_tab 
        WHERE clarification_by_role = $1 AND clarification_status = 'pending'
      `;
      const clarifications = (await client.query(clarificationQuery, [seniorRole])).rows;
  
      const responseData = [];
  
      for (const clarification of clarifications) {
        let appQuery, appTable, appIdField, fdsField;
        if (clarification.application_type === 'citation') {
          appTable = 'Citation_tab';
          appIdField = 'citation_id';
          fdsField = 'citation_fds';
        } else {
          appTable = 'Appre_tab';
          appIdField = 'appreciation_id';
          fdsField = 'appre_fds';
        }
  
        const appRes = await client.query(
          `SELECT * FROM ${appTable} WHERE ${appIdField} = $1`, [clarification.application_id]
        );
        const application = appRes.rows[0];
        if (!application) continue;
  
        const unitRes = await client.query(`SELECT * FROM Unit_tab WHERE unit_id = $1`, [application.unit_id]);
        const unit = unitRes.rows[0];
        if (!unit || unit[matchingField] !== ownUnitName) continue;
  
        // Decrypt if necessary, or use directly
        const fds = typeof application[fdsField] === 'string'
          ? JSON.parse(application[fdsField])
          : application[fdsField];
  
        // Inject clarification into the right parameter
        if (Array.isArray(fds.parameters)) {
          fds.parameters = fds.parameters.map(param => {
            if (param.name === clarification.parameter_name) {
              return {
                ...param,
                clarification_id: clarification.clarification_id,
                last_clarification_id: clarification.clarification_id,
                last_clarification_status: clarification.clarification_status,
                last_clarification_handled_by: clarification.clarification_by_role,
                clarification
              };
            }
            return param;
          });
        }
  
        responseData.push({
          id: application[appIdField],
          type: clarification.application_type,
          unit_id: application.unit_id,
          date_init: application.date_init,
          fds
        });
      }
  
      return ResponseHelper.success(200, 'Fetched pending clarifications', responseData);
    } catch (err) {
      console.error(`[Clarification API] Error: ${err.message}`);
      return ResponseHelper.error(500, 'Failed to fetch clarifications', err.message);
    } finally {
      client.release();
    }
  };