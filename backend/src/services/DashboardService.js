const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const ApplicationService = require("../services/ApplicationService");
const AuthService = require("../services/AuthService");
const ClarificationService = require("../services/ClarificationService");

exports.getDashboardStats = async (user) => {
    const client = await dbService.getClient();
    try {
      // Step 1: Get user profile to extract unit name
      const profile = await AuthService.getProfile(user);
      const unitName = profile?.data?.unit?.name;
  
      if (!unitName) {
        throw new Error("User unit name not found in profile.");
      }
  
      // Step 2: Get unit IDs where comd matches user unit name
      const unitsRes = await client.query(
        `SELECT unit_id FROM Unit_tab WHERE comd = $1`,
        [unitName]
      );
  
      const unitIds = unitsRes.rows.map((u) => u.unit_id);
      if (unitIds.length === 0) {
        throw new Error("No subordinate units found for this command.");
      }
  
      // Step 3: Count approved and rejected applications from both tables
      const approvedQuery = `
        SELECT
          (SELECT COUNT(*) FROM Citation_tab WHERE unit_id = ANY($1) AND status_flag = 'approved' AND last_approved_by_role = 'command') AS citation_approved,
          (SELECT COUNT(*) FROM Appre_tab   WHERE unit_id = ANY($1) AND status_flag = 'approved' AND last_approved_by_role = 'command') AS appre_approved
      `;
  
      const rejectedQuery = `
      SELECT
        (SELECT COUNT(*) FROM Citation_tab WHERE unit_id = ANY($1) AND status_flag = 'rejected' AND last_approved_by_role IN ('command', 'corps')) AS citation_rejected,
        (SELECT COUNT(*) FROM Appre_tab   WHERE unit_id = ANY($1) AND status_flag = 'rejected' AND last_approved_by_role IN ('command', 'corps')) AS appre_rejected
    `;
    
  
      const approvedRes = await client.query(approvedQuery, [unitIds]);
      const rejectedRes = await client.query(rejectedQuery, [unitIds]);
  
      const approved =
        parseInt(approvedRes.rows[0].citation_approved) +
        parseInt(approvedRes.rows[0].appre_approved);
  
      const rejected =
        parseInt(rejectedRes.rows[0].citation_rejected) +
        parseInt(rejectedRes.rows[0].appre_rejected);
  
      // Step 4: Fetch pending applications via service
      const query = { page: 1, limit: 10000 };
      const result = await ApplicationService.getApplicationsOfSubordinates(user, query);
      const totalPendingApplications = result.meta?.totalItems || 0;
  
      // Placeholder for clarification count
      let clarificationRaised = 0;
  
      const stats = {
        totalPendingApplications,
        clarificationRaised,
        approved,
        rejected,
      };
  
      return ResponseHelper.success(200, "Fetched dashboard stats", stats);
    } catch (err) {
      return ResponseHelper.error(500, "Failed to fetch dashboard stats", err.message);
    } finally {
      client.release();
    }
  };
  
  exports.getUnitScores = async (user) => {
    try {
      const { user_role } = user;
  
      if (!["command", "headquarter"].includes(user_role.toLowerCase())) {
        return ResponseHelper.error(403, "Access denied. Only 'command' and 'headquarter' roles allowed.");
      }
  
      // Fetch all approved applications with high limit
      const result = await ApplicationService.getApplicationsScoreboard(user, {
        page: 1,
        limit: 10000, // large limit to ensure all data is fetched
      });
  
      if (!result.success || !Array.isArray(result.data)) {
        return ResponseHelper.error(500, "Failed to fetch applications");
      }
  
      const applications = result.data;
  
      // Aggregate total marks by unit_id
      const unitScoresMap = {};
      console.log(applications)
      applications.forEach(app => {
        const { unit_id, total_marks } = app;

        if (!unitScoresMap[unit_id]) {
          unitScoresMap[unit_id] = 0;
        }
  
        unitScoresMap[unit_id] += total_marks || 0;
      });
  
      // Convert to array and sort
      const unitScores = Object.entries(unitScoresMap)
        .map(([unit_id, score]) => ({ unit_id: parseInt(unit_id), score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
  
      // Fetch unit names from DB
      const client = await dbService.getClient();
      try {
        const unitScoreData = await Promise.all(
          unitScores.map(async ({ unit_id, score }) => {
            const unitRes = await client.query(`SELECT name FROM Unit_tab WHERE unit_id = $1`, [unit_id]);
            return {
              name: unitRes.rows[0]?.name || "Unknown",
              score,
            };
          })
        );
  
        return unitScoreData;
      } finally {
        client.release();
      }
    } catch (err) {
      return ResponseHelper.error(500, "Failed to fetch unit score chart", err.message);
    }
  };
  
  exports.getHomeCounts = async (user) => {
    try {
      const { user_role } = user;
      const client = await dbService.getClient();
  
      try {
        let query = { page: 1, limit: 10000 };
  
        if (user_role !== 'unit') {
          query.isGetNotClarifications = true;
        }
        
        const applicationsResult = await ApplicationService.getApplicationsOfSubordinates(user, query);  
        const applicationsToReview = applicationsResult?.meta?.totalItems || 0;
  
        const clarificationsIRaised = Array.isArray(applicationsResult?.data)
          ? applicationsResult.data.filter(app => app.clarifications_count > 0).length
          : 0;
  
        const clarificationsResult = await ClarificationService.getAllApplicationsWithClarificationsForSubordinates(user, query);
  
        const clarificationsToResolve = clarificationsResult?.meta?.totalItems || 0;
  
        const responseData = {
          applicationsToReview,
          clarificationsIRaised,
          clarificationsToResolve
        };
  
        return responseData
      } finally {
        client.release();
      }
    } catch (err) {
      return ResponseHelper.error(500, "Failed to fetch home counts", err.message);
    }
  };
  