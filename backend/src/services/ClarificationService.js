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
  
      // Build dynamic SET clause based on user role
      const updates = [];
      const values = [];
      let i = 1;
  
      if (user.user_role === "unit") {
        // unit can update only clarification and clarification_doc
        if (clarification !== undefined) {
          updates.push(`clarification = $${i++}`);
          values.push(clarification);
        }
  
        if (clarification_doc !== undefined) {
          updates.push(`clarification_doc = $${i++}`);
          values.push(clarification_doc);
        }
      } else {
        // others can update only clarification_status
        if (clarification_status !== undefined) {
          updates.push(`clarification_status = $${i++}`);
          values.push(clarification_status);
        }
      }
  
      // If no valid fields provided, return error
      if (updates.length === 0) {
        return ResponseHelper.error(400, "No permitted update fields provided");
      }
  
      // Always update clarified_at timestamp when status changes or unit edits text/doc
      updates.push(`clarified_at = NOW()`);
  
      const query = `
        UPDATE Clarification_tab
        SET ${updates.join(", ")}
        WHERE clarification_id = $${i}
        RETURNING *;
      `;
      values.push(clarification_id);
  
      const result = await client.query(query, values);
  
      if (result.rowCount === 0) {
        return ResponseHelper.error(404, "Clarification not found");
      }
  
      return ResponseHelper.success(
        200,
        "Clarification updated successfully",
        result.rows[0]
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
      const filteredApplications = allApps.map(app => {
        const clarifiedParams = app.fds?.parameters?.filter(param => param.clarification_id);
        return {
          id: app.id,
          parameters: clarifiedParams
        };
      }).filter(app => app.parameters.length > 0);
      
      return ResponseHelper.success(200, "Fetched applications with clarifications", filteredApplications);
    } catch (err) {
      return ResponseHelper.error(500, "Failed to fetch data", err.message);
    } finally {
      client.release();
    }
  };
  