const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");

exports.getAllApplicationsForUnit = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const unitId = user.unit_id;
    const { award_type, search } = query;

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

    if (award_type) {
      allApps = allApps.filter((app) => {
        const fds = app.fds;
        return fds?.award_type?.toLowerCase() === award_type.toLowerCase();
      });
    }

    const normalize = (str) =>
      str
        ?.toString()
        .toLowerCase()
        .replace(/[\s\-]/g, "");

    if (search) {
      const searchLower = normalize(search);
      allApps = allApps.filter((app) => {
        const idMatch = app.id.toString().toLowerCase().includes(searchLower);
        const cyclePeriodMatch = normalize(
          app.fds?.cycle_period || ""
        ).includes(searchLower);
        return idMatch || cyclePeriodMatch;
      });
    }

    if (user.user_role === "unit") {
      allApps = allApps.map(({ status_flag, ...rest }) => rest);
    }

    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));

    return ResponseHelper.success(200, "Fetched applications", allApps);
  } catch (err) {
    return ResponseHelper.error(400, err.message);
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
  
      const lowerRole = hierarchy[currentIndex - 1]; // One level down
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
  
      const citations = await client.query(citationQuery, [unitIds]);
      const appreciations = await client.query(appreQuery, [unitIds]);
  
      let allApps = [...citations.rows, ...appreciations.rows];
  
      if (award_type) {
        allApps = allApps.filter((app) => {
          return app.fds?.award_type?.toLowerCase() === award_type.toLowerCase();
        });
      }
  
      const normalize = (str) => str?.toString().toLowerCase().replace(/[\s\-]/g, "");
      if (search) {
        const searchLower = normalize(search);
        allApps = allApps.filter((app) => {
          const idMatch = app.id.toString().toLowerCase().includes(searchLower);
          const cycleMatch = normalize(app.fds?.cycle_period || "").includes(searchLower);
          return idMatch || cycleMatch;
        });
      }
  
      allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
  
      return ResponseHelper.success(200, "Fetched subordinate applications", allApps);
  
    } catch (err) {
      return ResponseHelper.error(500, "Failed to fetch subordinate applications", err.message);
    } finally {
      client.release();
    }
  };
