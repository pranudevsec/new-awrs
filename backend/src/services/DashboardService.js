const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const ApplicationService = require("../services/ApplicationService");
const AuthService = require("../services/AuthService");
const ClarificationService = require("../services/ClarificationService");

exports.getDashboardStats = async (user) => {
  const client = await dbService.getClient();
  try {

    const profile = await AuthService.getProfile(user);
    const unitName = profile?.data?.unit?.name;
    let approved;
    let rejected;
    if (user.user_role === "command") {
      if (!unitName) {
        throw new Error("User unit name not found in profile.");
      }


      const unitsRes = await client.query(
        `SELECT unit_id FROM Unit_tab WHERE comd = $1`,
        [unitName]
      );

      const unitIds = unitsRes.rows.map((u) => u.unit_id);
      if (unitIds.length === 0) {
        throw new Error("No subordinate units found for this command.");
      }


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

      approved =
        parseInt(approvedRes.rows[0].citation_approved) +
        parseInt(approvedRes.rows[0].appre_approved);

      rejected =
        parseInt(rejectedRes.rows[0].citation_rejected) +
        parseInt(rejectedRes.rows[0].appre_rejected);
    }


    const query = { page: 1, limit: 10000 };

    let result;
    if (user.user_role === "command") {
      result = await ApplicationService.getApplicationsOfSubordinates(
        user,
        query
      );
    } else {
      result = await ApplicationService.getAllApplications(user, query);
      approved = result.data.filter(
        (app) =>
          app.status_flag === "approved" &&
          app.last_approved_by_role === "command"
      ).length;

      rejected = result.data.filter(
        (app) => app.status_flag === "rejected"
      ).length;
    }

    let totalPendingApplications = result.meta?.totalItems || 0;
    if (user.user_role === "headquarter") {
      totalPendingApplications = result.data.filter(
        (app) =>
          (app.status_flag !== "approved" &&
            app.last_approved_by_role !== "command") ||
          app.status_flag === "rejected"
      ).length;
    }
    const clarificationRaised = result.data.filter(
      (app) => app.clarifications_count >= 1
    ).length;

    const stats = {
      totalPendingApplications,
      clarificationRaised,
      approved,
      rejected,
    };

    return ResponseHelper.success(200, "Fetched dashboard stats", stats);
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to fetch dashboard stats",
      err.message
    );
  } finally {
    client.release();
  }
};

exports.getUnitScores = async (user) => {
  try {
    const { user_role } = user;

    if (!["command", "headquarter"].includes(user_role.toLowerCase())) {
      return ResponseHelper.error(
        403,
        "Access denied. Only 'command' and 'headquarter' roles allowed."
      );
    }


    const result = await ApplicationService.getApplicationsScoreboard(user, {
      page: 1,
      limit: 10000, // large limit to ensure all data is fetched
    });

    if (!result.success || !Array.isArray(result.data)) {
      return ResponseHelper.error(500, "Failed to fetch applications");
    }

    const applications = result.data;


    const unitScoresMap = {};
    applications.forEach((app) => {
      const { unit_id, total_marks } = app;

      if (!unitScoresMap[unit_id]) {
        unitScoresMap[unit_id] = 0;
      }

      unitScoresMap[unit_id] += total_marks || 0;
    });


    const unitScores = Object.entries(unitScoresMap)
      .map(([unit_id, score]) => ({ unit_id: parseInt(unit_id), score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);


    const client = await dbService.getClient();
    try {
      const unitScoreData = await Promise.all(
        unitScores.map(async ({ unit_id, score }) => {
          const unitRes = await client.query(
            `SELECT name FROM Unit_tab WHERE unit_id = $1`,
            [unit_id]
          );
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
    return ResponseHelper.error(
      500,
      "Failed to fetch unit score chart",
      err.message
    );
  }
};

exports.getHomeCounts = async (user) => {
  try {
    

    const statsResult = await ApplicationService.getApplicationStats(user, { page: 1, limit: 10000 });
  
  
    if (!statsResult || statsResult.statusCode !== 200) {
      return ResponseHelper.error(500, "Failed to fetch application stats for home counts");
    }
    
    const stats = statsResult.data;
    

    const clarificationsResult = await ClarificationService.getAllApplicationsWithClarificationsForSubordinates(
      user,
      { page: 1, limit: 10000 }
    );

    const clarificationsToResolve = clarificationsResult?.meta?.totalItems || 0;
    

    const clarificationsIRaised = 0; // This would need to be calculated from the applications data

    const responseData = {
      totalPendingApplications: stats.totalPendingApplications || 0,
      clarificationRaised: stats.clarificationRaised || 0,
      rejected: stats.rejected || 0,
      acceptedApplications: stats.acceptedApplications || 0,
      applicationsToReview: stats.totalPendingApplications || 0, // Use same logic as pending applications
      clarificationsIRaised,
      clarificationsToResolve,
    };


    return responseData;
  } catch (err) {
    console.error("Error in getHomeCounts:", err);
    return ResponseHelper.error(
      500,
      "Failed to fetch home counts",
      err.message
    );
  }
};
