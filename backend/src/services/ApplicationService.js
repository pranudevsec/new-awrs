const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");
const { application } = require("express");
const {
  attachFdsToApplications,
  attachSingleFdsToApplication,
} = require("./commonService.js");

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
        fds_id,
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
       fds_id,
        date_init,
        status_flag
      FROM Appre_tab
      WHERE unit_id = $1
    `,
      [unitId]
    );

    let allApps = [...citations.rows, ...appreciations.rows];
    allApps = await attachFdsToApplications(allApps);
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
        
        // Search in fds fields that actually exist
        const awardTypeMatch = normalize(app.fds?.award_type || "").includes(
          searchLower
        );
        const commandMatch = normalize(app.fds?.command || "").includes(
          searchLower
        );
        const brigadeMatch = normalize(app.fds?.brigade || "").includes(
          searchLower
        );
        const divisionMatch = normalize(app.fds?.division || "").includes(
          searchLower
        );
        const corpsMatch = normalize(app.fds?.corps || "").includes(
          searchLower
        );
        const unitTypeMatch = normalize(app.fds?.unit_type || "").includes(
          searchLower
        );
        const matrixUnitMatch = normalize(app.fds?.matrix_unit || "").includes(
          searchLower
        );
        const locationMatch = normalize(app.fds?.location || "").includes(
          searchLower
        );

        return (
          idMatch ||
          cycleMatch ||
          awardTypeMatch ||
          commandMatch ||
          brigadeMatch ||
          divisionMatch ||
          corpsMatch ||
          unitTypeMatch ||
          matrixUnitMatch ||
          locationMatch
        );
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
    console.log("🚀 ~ allApps:", allApps)
    let total_pending_clarifications = 0;
    allApps = allApps?.map((app) => {
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
    
    //  Pagination logic
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
        status_flag,
        last_approved_by_role,
        is_hr_review,
        is_dv_review,
        is_mp_review,
        is_mo_approved,
        is_ol_approved,
        isFinalized
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
        status_flag,
        last_approved_by_role,
        is_hr_review,
        is_dv_review,
        is_mp_review,
         is_mo_approved,
        is_ol_approved,
        isFinalized
      FROM Appre_tab
      WHERE 
        status_flag = 'approved' 
        AND last_approved_by_role = 'command'
    `);

    let allApps = [...citations.rows, ...appreciations.rows];
    allApps = await attachFdsToApplications(allApps);

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

        // Search in fds fields that actually exist
        const awardTypeMatch = normalize(app.fds?.award_type || "").includes(
          searchLower
        );
        const commandMatch = normalize(app.fds?.command || "").includes(
          searchLower
        );
        const brigadeMatch = normalize(app.fds?.brigade || "").includes(
          searchLower
        );
        const divisionMatch = normalize(app.fds?.division || "").includes(
          searchLower
        );
        const corpsMatch = normalize(app.fds?.corps || "").includes(
          searchLower
        );
        const unitTypeMatch = normalize(app.fds?.unit_type || "").includes(
          searchLower
        );
        const matrixUnitMatch = normalize(app.fds?.matrix_unit || "").includes(
          searchLower
        );
        const locationMatch = normalize(app.fds?.location || "").includes(
          searchLower
        );

        return (
          idMatch ||
          cycleMatch ||
          awardTypeMatch ||
          commandMatch ||
          brigadeMatch ||
          divisionMatch ||
          corpsMatch ||
          unitTypeMatch ||
          matrixUnitMatch ||
          locationMatch
        );
      });
    }

    //  Additional filtering based on CW2 role and type
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
    console.log("allAppsallAppsallAppsallApps", allApps);
    
    allApps = allApps.map((app) => {
      let clarifications_count = 0;
    
      const cleanedParameters = Array.isArray(app.fds?.parameters)
        ? app.fds.parameters.map((param) => {
            const newParam = { ...param };
            if (newParam.clarification?.clarification_status === "pending") {
              clarifications_count++;
              total_pending_clarifications++;
            }
            delete newParam.clarification;
            delete newParam.clarification_id;
            return newParam;
          })
        : [];
        
      return {
        ...app,
        clarifications_count,
        total_pending_clarifications,
        fds: app.fds
          ? { ...app.fds, parameters: cleanedParameters }
          : { parameters: [] },
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
    console.log("🚀 ~ err:", err)
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
          c.isfinalized,
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
          a.last_approved_by_role,
          a.last_approved_at,
          a.status_flag,
          a.isShortlisted,
          a.is_mo_approved,
          a.mo_approved_at,
          a.is_ol_approved,
          a.ol_approved_at,
                 a.isfinalized,
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
    let application = res.rows[0];
    application = await attachSingleFdsToApplication(application);
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
    console.log("=== getApplicationsOfSubordinates START ===");
    console.log("User:", JSON.stringify(user, null, 2));
    console.log("Query:", JSON.stringify(query, null, 2));
    
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
    const master = profile?.data?.master;

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
      brigade: {
        table: "brigade_master",
        idCol: "brigade_id",
        nameCol: "brigade_name",
      },
      division: {
        table: "division_master",
        idCol: "division_id",
        nameCol: "division_name",
      },
      corps: {
        table: "corps_master",
        idCol: "corps_id",
        nameCol: "corps_name",
      },
      command: {
        table: "command_master",
        idCol: "command_id",
        nameCol: "command_name",
      },
    };
    const { table, idCol, nameCol } =
      subordinateFieldMap[user_role.toLowerCase()];
    if (!table)
      throw new Error("Unit data or hierarchy mapping missing");

    const matchField = subordinateFieldMap[user_role.toLowerCase()];
    if (!matchField) {
      throw new Error("Unit data or hierarchy mapping missing");
    }

    // Use master object to find subordinate units
    let subUnitsRes;
    if (master?.id) {
      subUnitsRes = await client.query(
        `SELECT unit_id FROM Unit_tab WHERE ${idCol} = $1`,
        [master.id]
      );
    } else {
      // Fallback to name matching if no master data
      subUnitsRes = await client.query(
      `
      SELECT u.unit_id
      FROM unit_tab u
      JOIN ${table} m ON u.${idCol} = m.${idCol}
      WHERE m.${nameCol} = $1
      `,
      [unit.name]
    );
    }
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
    console.log(`Found ${citations.rows.length} citations and ${appreciations.rows.length} appreciations`);
    
    let allApps = [...citations.rows, ...appreciations.rows];
    console.log(`Found ${allApps.length} applications`);
    
    // Attach FDS data using the common service
    console.log("Attaching FDS data...");
    allApps = await attachFdsToApplications(allApps);
    console.log(`After FDS attachment: ${allApps.length} applications`);
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

        // Search in fds fields that actually exist
        const awardTypeMatch = normalize(app.fds?.award_type || "").includes(
          searchLower
        );
        const commandMatch = normalize(app.fds?.command || "").includes(
          searchLower
        );
        const brigadeMatch = normalize(app.fds?.brigade || "").includes(
          searchLower
        );
        const divisionMatch = normalize(app.fds?.division || "").includes(
          searchLower
        );
        const corpsMatch = normalize(app.fds?.corps || "").includes(
          searchLower
        );
        const unitTypeMatch = normalize(app.fds?.unit_type || "").includes(
          searchLower
        );
        const matrixUnitMatch = normalize(app.fds?.matrix_unit || "").includes(
          searchLower
        );
        const locationMatch = normalize(app.fds?.location || "").includes(
          searchLower
        );

        return (
          idMatch ||
          cycleMatch ||
          awardTypeMatch ||
          commandMatch ||
          brigadeMatch ||
          divisionMatch ||
          corpsMatch ||
          unitTypeMatch ||
          matrixUnitMatch ||
          locationMatch
        );
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

    // Always calculate total marks for all applications - use parameter names for consistency
    const allParameterNames = Array.from(
        new Set(
        allApps.flatMap(
          (app) =>
            app.fds?.parameters?.map((p) => p.name?.trim().toLowerCase()) || []
        )
        )
      );
    
    if (allParameterNames.length > 0) {
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
        const totalMarks = parameters.reduce((sum, param) => {
          const isNegative = negativeParamMap[param.name?.trim().toLowerCase()];
          return isNegative ? sum : sum + (param.marks || 0);
        }, 0);
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
        };
      });
      console.log("Marks calculated for applications");
    } else {
      // If no parameters, set default values
      allApps = allApps.map((app) => ({
        ...app,
        totalMarks: 0,
        totalNegativeMarks: 0,
        netMarks: 0,
      }));
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

    console.log("=== getApplicationsOfSubordinates END ===");
    console.log(`Returning ${paginatedData.length} applications out of ${allApps.length} total`);
    console.log("Pagination:", pagination);

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
        `SELECT u.unit_id, u.name, u.brigade_id, u.division_id, u.corps_id
         FROM Unit_tab u
         JOIN Command_Master c ON u.command_id = c.command_id
         WHERE c.command_name = $1`,
        [unitName] // your command name
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
    allApps = await attachFdsToApplications(allApps);

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

    // Marks calculation - use parameter names for consistency
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
    let filteredApps = paginatedData.filter((app) => {
      // Skip apps without fds
      if (!app.fds) return false;

      let match = true;

      //  Filter by award_type
      if (award_type) {
        match =
          match &&
          app.fds.award_type?.toLowerCase() === award_type.toLowerCase();
      }

      //  Filter by search (matches id or cycle_period)
      if (search) {
        const s = search.toLowerCase();
        const idStr =
          (app.type === "citation" ? app.id : app.id)?.toString() || "";
        const cyclePeriod = app.fds.cycle_period?.toLowerCase() || "";
        match = match && (idStr.includes(s) || cyclePeriod.includes(s));
      }

      return match;
    });

    return ResponseHelper.success(
      200,
      "Fetched approved applications",
      filteredApps,
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
      },
      appreciation: {
        table: "Appre_tab",
        column: "appreciation_id",
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
            ${withdraw_status === "approved"
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
        `SELECT * FROM ${config.table} WHERE ${config.column} = $1`,
        [id]
      );
      if (fetchRes.rowCount === 0) throw new Error("Application not found");
      let appData = fetchRes.rows[0];
      appData = await attachSingleFdsToApplication(appData);
      const fds = appData?.fds;

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
        // Validate IC number format (Indian Army: IC-XXXXX[A-Z])
        if (member.ic_number) {
          const icNumberRegex = /^IC-\d{5}[A-Z]$/;
          if (!icNumberRegex.test(member.ic_number)) {
            throw new Error("IC number must be in format IC-XXXXX[A-Z] where XXXXX are 5 digits and last character is any alphabet");
          }
        } else {
          throw new Error("IC number is required and cannot be blank");
        }
        
        const now = new Date();
        const existingRes = await client.query(
          `SELECT * FROM fds_accepted_members WHERE fds_id = $1 AND member_id = $2`,
          [appData.fds_id, member.member_id]
        );
        const memberObjForDB = {
          fds_id: appData.fds_id,
          member_id: member.member_id,
          name: member.name,
          ic_number: member.ic_number,
          member_type: member.member_type,
          is_signature_added: member.is_signature_added ?? false,
          sign_digest: member.sign_digest || null,
        };
        if (existingRes.rows.length > 0) {
          // Update existing member
          await client.query(
            `
            UPDATE fds_accepted_members
            SET name = $1,
                ic_number = $2,
                member_type = $3,
                is_signature_added = $4,
                sign_digest = $5,
                updated_at = NOW()
            WHERE fds_id = $6 AND member_id = $7
            `,
            [
              memberObjForDB.name,
              memberObjForDB.ic_number,
              memberObjForDB.member_type,
              memberObjForDB.is_signature_added,
              memberObjForDB.sign_digest,
              appData.fds_id,
              member.member_id,
            ]
          );
        } else {
          // Insert new member
          await client.query(
            `
            INSERT INTO fds_accepted_members
              (fds_id, member_id, name, ic_number, member_type, is_signature_added, sign_digest)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
              appData.fds_id,
              memberObjForDB.member_id,
              memberObjForDB.name,
              memberObjForDB.ic_number,
              memberObjForDB.member_type,
              memberObjForDB.is_signature_added,
              memberObjForDB.sign_digest,
            ]
          );
        }
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
              if (user.cw2_type === "mo") {
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
      // await client.query(
      //   `UPDATE ${config.table}
      //    SET ${config.fdsColumn} = $1
      //    WHERE ${config.column} = $2`,
      //   [updatedFds, id]
      // );
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
        query = `
          UPDATE ${config.table}
          SET status_flag = $1,
              last_rejected_by_role = $3,
              last_rejected_at = $4
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

    // Select base query
    let query;
    if (type === "citation") {
      query = `
        SELECT 
          c.citation_id AS id,
          c.fds_id AS fds_id,
          'citation' AS type,
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
          c.isfinalized,
          c.last_rejected_by_role,
          c.remarks
        FROM Citation_tab c
        JOIN Unit_tab u ON c.unit_id = u.unit_id
        WHERE c.citation_id = $1
      `;
    } else {
      query = `
        SELECT 
          a.appreciation_id AS id,
                    a.fds_id AS fds_id,
          'appreciation' AS type,
          a.unit_id,
          u.name AS unit_name,
          a.date_init,
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
          a.isfinalized,
          a.last_rejected_by_role,
          a.remarks
        FROM Appre_tab a
        JOIN Unit_tab u ON a.unit_id = u.unit_id
        WHERE a.appreciation_id = $1
      `;
    }

    // Fetch application
    const res = await client.query(query, [application_id]);
    if (res.rowCount === 0) {
      return ResponseHelper.error(404, "Application not found");
    }

    // Attach FDS
    const application = await attachSingleFdsToApplication(res.rows[0]);
    const fds = application.fds;
    const now = new Date();
    //  Update parameters both in-memory and in DB
    async function updateParameterMarks(params, approvedParams) {
      if (!Array.isArray(params) || !Array.isArray(approvedParams))
        return params;
      for (const param of params) {
        const approvedParam = approvedParams.find((p) => p.id == param.id);
        if (approvedParam) {
          // Update local param object
          param.approved_marks = approvedParam.approved_marks ?? 0;
          param.approved_count = approvedParam.approved_count ?? 0;
          param.approved_marks_documents =
            approvedParam.approved_marks_documents || [];
          param.approved_marks_reason =
            approvedParam.approved_marks_reason || "";
          param.approved_by_user = user.user_id;
          param.approved_by_role = user.user_role;
          param.approved_marks_at = now;

          // 🔥 Update the fds_parameters table
          await client.query(
            `
            UPDATE fds_parameters
            SET 
              approved_marks = $1,
              approved_count = $2,
              approved_marks_documents = $3,
              approved_marks_reason = $4,
              approved_by_user = $5,
              approved_by_role = $6,
              approved_marks_at = $7,
              updated_at = NOW()
            WHERE fds_id = $8 AND param_id = $9
            `,
            [
              param.approved_marks,
              param.approved_count,
              JSON.stringify(param.approved_marks_documents || []),
              param.approved_marks_reason,
              user.user_id,
              user.user_role,
              now,
              application.fds_id,
              param.id, // param.id corresponds to param_id in fds_parameters
            ]
          );
        }
      }

      return params;
    }
    // Helper for updating grace marks
    async function updateGraceMarks(fds_id, graceMarksArr, marks) {
      if (marks === undefined) return graceMarksArr;
      const now = new Date().toISOString();

      if (!Array.isArray(graceMarksArr)) graceMarksArr = [];

      // Find if current role already exists
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
        // Update local array
        graceMarksArr[existingIndex] = graceEntry;

        // Update DB
        await client.query(
          `
          UPDATE fds_grace_marks
          SET 
            marks = $1,
            marks_by = $2,
            marks_added_at = $3,
            updated_at = NOW()
          WHERE fds_id = $4 AND role = $5
          `,
          [marks, user.user_id, now, fds_id, user.user_role]
        );
      } else {
        // Add new entry locally
        graceMarksArr.push(graceEntry);

        // Insert new record in DB
        await client.query(
          `
          INSERT INTO fds_grace_marks (fds_id, role, marks_by, marks_added_at, marks, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          `,
          [fds_id, user.user_role, user.user_id, now, marks]
        );
      }

      return graceMarksArr;
    }
    // Helper for updating priority points
    async function updatePriorityDB(fds_id, priorityArr, points) {
      const now = new Date().toISOString();

      if (points === undefined) return priorityArr;
      if (!Array.isArray(priorityArr)) priorityArr = [];

      // Check if there is an existing entry for this role (and cw2_type if applicable)
      const existingIndex = priorityArr.findIndex((entry) => {
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

      if (existingIndex !== -1) {
        priorityArr[existingIndex] = priorityEntry;

        // 🔥 Update the DB
        await client.query(
          `
          UPDATE fds_application_priority
          SET priority = $1, priority_added_at = $2, updated_at = NOW()
          WHERE fds_id = $3 AND role = $4
          ${user.user_role === "cw2" ? "AND cw2_type = $5" : ""}
          `,
          user.user_role === "cw2"
            ? [points, now, fds_id, user.user_role, user.cw2_type]
            : [points, now, fds_id, user.user_role]
        );
      } else {
        priorityArr.push(priorityEntry);

        // 🔥 Insert new row into DB
        await client.query(
          `
          INSERT INTO fds_application_priority
            (fds_id, role, priority, priority_added_at, created_at, updated_at${user.user_role === "cw2" ? ", cw2_type" : ""
          })
          VALUES
            ($1, $2, $3, $4, NOW(), NOW()${user.user_role === "cw2" ? ", $5" : ""
          })
          `,
          user.user_role === "cw2"
            ? [fds_id, user.user_role, points, now, user.cw2_type]
            : [fds_id, user.user_role, points, now]
        );
      }

      return priorityArr;
    }
    // Helper for updating remarks
    async function updateRemarks(remarkStr) {
      if (!remarkStr || typeof remarkStr !== "string") return;

      const now = new Date();

      try {
        // Upsert remark: insert if not exists, update if exists for same application, type, and role
        const upsertQuery = `
          INSERT INTO application_remarks
            (application_id, type, remarks, remark_added_by, remark_added_by_role, remark_added_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (application_id, type, remark_added_by_role)
          DO UPDATE SET
            remarks = EXCLUDED.remarks,
            remark_added_by = EXCLUDED.remark_added_by,
            remark_added_at = EXCLUDED.remark_added_at
          RETURNING *;
        `;

        const res = await client.query(upsertQuery, [
          application_id,
          type,
          remarkStr,
          user.user_id,
          user.user_role,
          now,
        ]);

        return res.rows[0];
      } catch (err) {
        console.error("Error in updateRemarks:", err);
        throw err; // or return some error object
      }
    }

    // Update FDS and remarks
    if (Array.isArray(parameters) && parameters.length > 0) {
      fds.parameters = updateParameterMarks(fds.parameters, parameters);
    }
    fds.applicationGraceMarks = updateGraceMarks(
      application.fds_id,
      fds.applicationGraceMarks,
      applicationGraceMarks
    );
    fds.applicationPriority = updatePriorityDB(
      application.fds_id,
      fds.applicationPriority,
      applicationPriorityPoints
    );
    remarks = updateRemarks(remark);
    return ResponseHelper.success(200, "Marks approved successfully");
  } catch (error) {
    console.log(error);
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
    // Get FDS data from the fds table instead of JSON columns
    const res = await client.query(
      `SELECT fds_id, application_id, award_type, corps_id, brigade_id, division_id, command_id, location, last_date, unit_type, matrix_unit, unit_remarks, arms_service_id, cycle_period
       FROM fds WHERE application_id = $1 AND award_type = $2`,
      [application_id, type]
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

    // Check signing order: Members must sign before presiding officer
    if (userRole === "presiding_officer" || userRole === "cw2") {
      // Get unit members to check if all have signed
      const profile = await AuthService.getProfile(user);
      const unit = profile?.data?.unit;
      
      if (unit?.members?.length) {
        // Check if all unit members have signed
        const allMembersSigned = unit.members.every((unitMember) => {
          // Look for member signatures in any role
          const memberHasSigned = fds.signatures.some(roleSig => 
            roleSig.signatures_of_members.some(memberSig => 
              memberSig.id === unitMember.id && memberSig.added_signature
            )
          );
          return memberHasSigned;
        });

        if (!allMembersSigned) {
          return ResponseHelper.error(
            400,
            "All unit members must sign before presiding officer can sign"
          );
        }
      }
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
    // Update FDS data in the fds table instead of JSON columns
    await client.query(
      `UPDATE fds
       SET corps_id = $1, brigade_id = $2, division_id = $3, command_id = $4, location = $5, last_date = $6, unit_type = $7, matrix_unit = $8, unit_remarks = $9, arms_service_id = $10, cycle_period = $11
       WHERE application_id = $12 AND award_type = $13`,
      [fds.corps_id, fds.brigade_id, fds.division_id, fds.command_id, fds.location, fds.last_date, fds.unit_type, fds.matrix_unit, fds.unit_remarks, fds.arms_service_id, fds.cycle_period, application_id, type]
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

// exports.addApplicationComment = async (user, body) => {
//   const client = await dbService.getClient();
//   try {
//     const { type, application_id, parameters } = body;

//     if (!["citation", "appreciation"].includes(type)) {
//       return ResponseHelper.error(400, "Invalid type provided");
//     }

//     const tableName = type === "citation" ? "Citation_tab" : "Appre_tab";
//     const idColumn = type === "citation" ? "citation_id" : "appreciation_id";
//     const fdsColumn = type === "citation" ? "citation_fds" : "appre_fds";

//     const res = await client.query(
//       `SELECT ${idColumn}, ${fdsColumn} AS fds FROM ${tableName} WHERE ${idColumn} = $1`,
//       [application_id]
//     );

//     if (res.rowCount === 0) {
//       return ResponseHelper.error(404, "Application not found");
//     }

//     let fds = res.rows[0].fds;
//     const now = new Date();

//     if (!Array.isArray(parameters) || parameters.length === 0) {
//       return ResponseHelper.error(400, "Parameters array is required");
//     }

//     fds.parameters = fds.parameters.map((param) => {
//       const incomingParam = parameters.find((p) => p.name === param.name);
//       if (incomingParam) {
//         if (!Array.isArray(param.comments)) {
//           param.comments = [];
//         }

//         const existingCommentIndex = param.comments.findIndex(
//           (c) => c.commented_by === user.user_id
//         );

//         const newComment = {
//           comment: incomingParam.comment || "",
//           commented_by_role_type: user.cw2_type || null,
//           commented_by_role: user.user_role || null,
//           commented_at: now,
//           commented_by: user.user_id,
//         };

//         if (existingCommentIndex >= 0) {
//           param.comments[existingCommentIndex] = newComment;
//         } else {
//           param.comments.push(newComment);
//         }
//       }
//       return param;
//     });

//     await client.query(
//       `UPDATE ${tableName}
//          SET ${fdsColumn} = $1
//          WHERE ${idColumn} = $2`,
//       [fds, application_id]
//     );

//     return ResponseHelper.success(200, "Comment added successfully");
//   } catch (error) {
//     return ResponseHelper.error(500, "Failed to add comments", error.message);
//   } finally {
//     client.release();
//   }
// };

exports.addApplicationComment = async (user, body) => {
  const client = await dbService.getClient();

  try {
    const { type, application_id, comment } = body;

    //  Validate type
    if (!["citation", "appreciation"].includes(type)) {
      return ResponseHelper.error(400, "Invalid type provided");
    }

    const tableName = type === "citation" ? "Citation_tab" : "Appre_tab";
    const idColumn = type === "citation" ? "citation_id" : "appreciation_id";

    //  Fetch FDS data
    const res = await client.query(
      `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`,
      [application_id]
    );

    if (res.rowCount === 0) {
      return ResponseHelper.error(404, "Application not found");
    }
    let appData = res.rows[0];
    appData = await attachSingleFdsToApplication(appData);

    const fds = appData.fds;
    const fdsId = appData?.fds_id;

    if (!fdsId) {
      return ResponseHelper.error(
        400,
        "FDS reference not found for this application"
      );
    }

    //  Validate comment
    if (!comment || typeof comment !== "string" || comment.trim() === "") {
      return ResponseHelper.error(400, "Comment text is required");
    }

    const now = new Date();

    //  Upsert comment in `fds_comments`
    await client.query(
      `
      INSERT INTO fds_comments (
        fds_id,
        comment,
        commented_by,
        commented_by_role,
        commented_by_role_type,
        commented_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (fds_id, commented_by, commented_by_role, commented_by_role_type)
      DO UPDATE
      SET comment = EXCLUDED.comment,
          commented_at = EXCLUDED.commented_at,
          updated_at = NOW();
      `,
      [
        fdsId,
        comment.trim(),
        user.user_id,
        user.user_role || null,
        user.cw2_type || null,
        now,
      ]
    );

    return ResponseHelper.success(200, "Comment added or updated successfully");
  } catch (error) {
    return ResponseHelper.error(500, "Failed to add comment", error.message);
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
          `SELECT citation_id AS id, 'citation' AS type, unit_id, date_init, status_flag FROM Citation_tab WHERE ${approvalField} = true ORDER BY date_init DESC LIMIT $1 OFFSET $2`,
          [limitInt, offset]
        ),
        client.query(
          `SELECT appreciation_id AS id, 'appreciation' AS type, unit_id, date_init, status_flag FROM Appre_tab WHERE ${approvalField} = true ORDER BY date_init DESC LIMIT $1 OFFSET $2`,
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

    const subordinateFieldMap = {
      brigade: "brigade_id",
      division: "division_id",
      corps: "corps_id",
      command: "command_id",
    };

    let unitIds = [];
    if (user_role.toLowerCase() === "unit") {
      unitIds = [unit.unit_id];
    } else {
      const matchField = subordinateFieldMap[user_role.toLowerCase()];
      if (!matchField) throw new Error(`Invalid mapping for role: ${user_role.toLowerCase()}`);

      const parentId = unit[matchField]; 

      const subUnitsRes = await client.query(
        `SELECT unit_id FROM Unit_tab WHERE "${matchField}" = $1`,
        [parentId]
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
    WHERE ${baseFilters.replace(/unit_id/g, "c.unit_id")}
  `;

    const appreQuery = `
    SELECT 
      a.appreciation_id AS id,
      'appreciation' AS type,
      a.unit_id,
      row_to_json(u) AS unit_details,
      a.date_init,
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
    WHERE ${baseFilters.replace(/unit_id/g, "a.unit_id")}
  `;

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, queryParams),
      client.query(appreQuery, queryParams),
    ]);

    let allApps = [...citations.rows, ...appreciations.rows];
    allApps = await attachFdsToApplications(allApps);
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
    console.log("🚀 ~ err:", err)
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
    console.log("=== getAllApplications START ===");
    console.log("User:", JSON.stringify(user, null, 2));
    console.log("Query:", JSON.stringify(query, null, 2));
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
    const master = profile?.data?.master;

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
      // Headquarter sees all units
      const allUnitsRes = await client.query(`
        SELECT 
          u.unit_id,
          u.name AS unit_name,
          u.sos_no,
          u.unit_type,
          u.matrix_unit,
          u.location,
          u.awards,
          u.members,
          c.command_name,
          b.brigade_name,
          d.division_name,
          co.corps_name
        FROM Unit_tab u
        LEFT JOIN Command_Master c ON u.command_id = c.command_id
        LEFT JOIN Brigade_Master b ON u.brigade_id = b.brigade_id
        LEFT JOIN Division_Master d ON u.division_id = d.division_id
        LEFT JOIN Corps_Master co ON u.corps_id = co.corps_id
      `);

      unitIds = allUnitsRes.rows.map((u) => u.unit_id);
      allowedRoles = ROLE_HIERARCHY;
    } else {
      // Other roles see subordinate units
      const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
      if (currentIndex === -1) throw new Error("Invalid user role");

      const subordinateFieldMap = {
        unit: "unit_id",
        brigade: "brigade_id",
        division: "division_id",
        corps: "corps_id",
        command: "command_id",
      };

      if (currentRole === "unit") {
        // Only their own unit
        unitIds = [unit.unit_id];
      } else if (currentRole === "brigade") {
        console.log(`Fetching units for brigade with master ID: ${master?.id}`);
        if (master?.id) {
          const unitsRes = await client.query(
            `SELECT unit_id FROM Unit_tab WHERE brigade_id = $1`,
            [master.id]
          );
          console.log(`Found ${unitsRes.rows.length} units for brigade`);
          unitIds = unitsRes.rows.map((row) => row.unit_id);
      } else {
          console.log("No master data found for brigade role");
          unitIds = [];
        }
      } else if (currentRole === "division") {
        console.log(`Fetching units for division with master ID: ${master?.id}`);
        if (master?.id) {
          const unitsRes = await client.query(
            `SELECT unit_id FROM Unit_tab WHERE division_id = $1`,
            [master.id]
          );
          unitIds = unitsRes.rows.map((row) => row.unit_id);
        } else {
          console.log("No master data found for division role");
          unitIds = [];
        }
      } else if (currentRole === "command") {
        console.log(`Fetching units for command with master ID: ${master?.id}`);
        if (master?.id) {
          const unitsRes = await client.query(
            `SELECT unit_id FROM Unit_tab WHERE command_id = $1`,
            [master.id]
          );
          unitIds = unitsRes.rows.map((row) => row.unit_id);
        } else {
          console.log("No master data found for command role");
          unitIds = [];
        }
      } else if (currentRole === "corps") {
        console.log(`Fetching units for corps with master ID: ${master?.id}`);
        if (master?.id) {
          const unitsRes = await client.query(
            `SELECT unit_id FROM Unit_tab WHERE corps_id = $1`,
            [master.id]
          );
          unitIds = unitsRes.rows.map((row) => row.unit_id);
        } else {
          console.log("No master data found for corps role");
          unitIds = [];
        }
      } else {
        // For other roles, assume they can only see their own unit's applications
        unitIds = [user.unit_id];
      }
    
      console.log(`Unit IDs found: ${JSON.stringify(unitIds)}`);
      if (unitIds.length === 0) {
        console.log("No units found, returning empty result");
        return ResponseHelper.success(200, "No applications found", [], {
          totalItems: 0,
        });
      }
    }


    let baseFilters;
    let queryParams = [unitIds];

    if (currentRole === "headquarter") {
      // Exclude draft for HQ
      baseFilters = `unit_id = ANY($1) AND status_flag != 'draft'`;
    } else {
      // For non-HQ, use the same logic as getApplicationsOfSubordinates
      baseFilters = `unit_id = ANY($1) AND status_flag != 'draft'`;
    }

    const citationQuery = `
    SELECT 
      c.citation_id AS id,
      'citation' AS type,
      c.unit_id,
      row_to_json(u) AS unit_details,
      c.date_init,
      c.status_flag,
      c.is_mo_approved,
      c.mo_approved_at,
      c.is_ol_approved,
      c.last_rejected_by_role,
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
    WHERE ${baseFilters.replace(/unit_id/g, "c.unit_id")}
    `;

    const appreQuery = `
    SELECT 
      a.appreciation_id AS id,
      'appreciation' AS type,
      a.unit_id,
      row_to_json(u) AS unit_details,
      a.date_init,
      a.status_flag,
      a.is_mo_approved,
      a.mo_approved_at,
      a.last_rejected_by_role,
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
    WHERE ${baseFilters.replace(/unit_id/g, "a.unit_id")}
    `;

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, queryParams),
      client.query(appreQuery, queryParams),
    ]);

    console.log(`Found ${citations.rows.length} citations and ${appreciations.rows.length} appreciations`);
    let allApps = [...citations.rows, ...appreciations.rows];
    console.log(`Total applications before FDS: ${allApps.length}`);
    
    // Preserve unit details before attaching FDS data
    console.log("=== UNIT DETAILS DEBUG ===");
    allApps.forEach((app, index) => {
      console.log(`App ${index + 1}:`);
      console.log(`  - unit_id: ${app.unit_id}`);
      console.log(`  - unit_details:`, JSON.stringify(app.unit_details, null, 2));
      console.log(`  - unit_details.name: ${app.unit_details?.name}`);
    });
    
    allApps = allApps.map(app => ({
      ...app,
      unit_name: app.unit_details?.name || 'Unknown Unit',
      unit_sos_no: app.unit_details?.sos_no || null,
      unit_type: app.unit_details?.unit_type || null,
      unit_location: app.unit_details?.location || null
    }));
    
    console.log("=== AFTER UNIT NAME EXTRACTION ===");
    allApps.forEach((app, index) => {
      console.log(`App ${index + 1}: unit_name = ${app.unit_name}`);
    });
    
    allApps=await attachFdsToApplications(allApps)
    console.log(`Total applications after FDS: ${allApps.length}`);
    
    console.log("=== AFTER FDS ATTACHMENT ===");
    allApps.forEach((app, index) => {
      console.log(`App ${index + 1}:`);
      console.log(`  - unit_name: ${app.unit_name}`);
      console.log(`  - fds.brigade: ${app.fds?.brigade}`);
      console.log(`  - fds.division: ${app.fds?.division}`);
      console.log(`  - fds.corps: ${app.fds?.corps}`);
    });
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
          normalize(app.fds?.award_type || "").includes(searchNorm) ||
          normalize(app.fds?.brigade || "").includes(searchNorm) ||
          normalize(app.fds?.division || "").includes(searchNorm) ||
          normalize(app.fds?.corps || "").includes(searchNorm) ||
          normalize(app.fds?.command || "").includes(searchNorm) ||
          normalize(app.fds?.unit_type || "").includes(searchNorm) ||
          normalize(app.fds?.matrix_unit || "").includes(searchNorm) ||
          normalize(app.fds?.location || "").includes(searchNorm)
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
      const totalMarks = parameters.reduce((sum, param) => {
        const isNegative = negativeParamMap[param.name?.trim().toLowerCase()];
        return isNegative ? sum : sum + (param.marks || 0);
      }, 0);
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
      let updatedRole = app.last_approved_by_role;
      if (app.is_ol_approved && app.is_mo_approved) {
        updatedRole = "CW2";
      } else if (app.is_mo_approved) {
        updatedRole = "Mo";
      } else if (app.is_ol_approved) {
        updatedRole = "OL";
      } else if (app.status_flag !== "draft" && !updatedRole) {
        updatedRole = "brigade";
      } else if (app.updatedRole == "brigade") {
        updatedRole = "division";
      } else if (app.updatedRole == "division") {
        updatedRole = "corps";
      } else if (app.updatedRole == "corps") {
        updatedRole = "command";
      } else if (app.updatedRole == "command") {
        updatedRole = "MO/OL";
      } else if (app.is_ol_approved && app.is_mo_approved) {
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

    console.log("=== getAllApplications END ===");
    console.log(`Returning ${paginatedData.length} applications out of ${allApps.length} total`);
    console.log("Pagination:", pagination);

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
    let s;

    if (roleLc === 'headquarter') {
      // ---------------- HQ role: use same logic as non-HQ for consistency ----------------
      s = {
        totalApplications: 0,
        pendingApplications: 0,
        rejectedApplications: 0,
        finalisedApplications: 0,
        finalizedApprovedApplications: 0,
        approvedApplications: 0
      };

      // --- totalApplications from getAllApplications ---
      const totalRes = await exports.getAllApplications(user, { ..._query, page: 1, limit: 1000 });
      if (totalRes && ((totalRes.statusCode || totalRes.status) === 200)) {
        s.totalApplications = totalRes.data.length;
      }

      // --- pendingApplications from getAllApplications with filtering ---
      if (totalRes && ((totalRes.statusCode || totalRes.status) === 200)) {
        s.pendingApplications = totalRes.data.filter(app => 
          (app.status_flag !== 'approved' && app.last_approved_by_role !== 'command') ||
          app.status_flag === 'rejected'
        ).length;
      }

      // --- rejectedApplications from getAllApplications ---
      if (totalRes && ((totalRes.statusCode || totalRes.status) === 200)) {
        s.rejectedApplications = totalRes.data.filter(app => app.status_flag === 'rejected').length;
      }

      // --- finalisedApplications (shortlisted) from listFinalisedApplications API ---
      const finalisedRes = await exports.listFinalisedApplications(user, { ..._query, page: 1, limit: 1000 });
      if (finalisedRes && ((finalisedRes.statusCode || finalisedRes.status) === 200)) {
        s.finalisedApplications = finalisedRes.data.length;
      }

      // --- finalizedApprovedApplications from listApprovedApplications API ---
      const finalizedApprovedRes = await exports.listApprovedApplications(user, { ..._query, page: 1, limit: 1000, isFinalized: true });
      if (finalizedApprovedRes && ((finalizedApprovedRes.statusCode || finalizedApprovedRes.status) === 200)) {
        s.finalizedApprovedApplications = finalizedApprovedRes.data.length;
      }

      // --- approvedApplications from getAllApplications ---
      if (totalRes && ((totalRes.statusCode || totalRes.status) === 200)) {
        s.approvedApplications = totalRes.data.filter(app => 
          app.last_approved_by_role === 'command'
        ).length;
      }
    } else {
      // ---------------- Non-HQ role: fetch counts from API ----------------
      s = {
        totalApplications: 0,
        pendingApplications: 0,
        rejectedApplications: 0,
        finalisedApplications: 0,
        finalizedApprovedApplications: 0,
        approvedApplications: 0
      };

      // --- totalApplications from getAllApplications ---
      const totalRes = await exports.getAllApplications(user, { ..._query, page: 1, limit: 1000 });
      if (totalRes && ((totalRes.statusCode || totalRes.status) === 200)) {
        s.totalApplications = totalRes.data.length;
      }

      // --- pendingApplications from subordinate API ---
      const pendRes = await exports.getApplicationsOfSubordinates(user, {
        page: 1,
        limit: 100,
        isGetNotClarifications: true
      });
      console.log("=== PENDING APPLICATIONS SUBORDINATE API DEBUG ===");
      console.log("API Response:", JSON.stringify({
        statusCode: pendRes?.statusCode,
        success: pendRes?.success,
        dataLength: pendRes?.data?.length,
        totalItems: pendRes?.meta?.totalItems,
        data: pendRes?.data
      }, null, 2));
      if (pendRes && ((pendRes.statusCode || pendRes.status) === 200)) {
        s.pendingApplications = pendRes.data.length;
        console.log("Set pendingApplications to:", s.pendingApplications);
      }

      // --- recommendedApplications from subordinate API ---
      const recRes = await exports.getApplicationsOfSubordinates(user, {
        page: 1,
        limit: 100,
        isShortlisted: true
      });
      console.log("=== RECOMMENDED APPLICATIONS SUBORDINATE API DEBUG ===");
      console.log("API Response:", JSON.stringify({
        statusCode: recRes?.statusCode,
        success: recRes?.success,
        dataLength: recRes?.data?.length,
        totalItems: recRes?.meta?.totalItems,
        data: recRes?.data
      }, null, 2));
      if (recRes && ((recRes.statusCode || recRes.status) === 200)) {
        s.approvedApplications = recRes.data.length;
        console.log("Set approvedApplications to:", s.approvedApplications);
      }

      // --- rejectedApplications from listRejectedApplications API ---
      const rejectRes = await exports.listRejectedApplications(user, { ..._query, page: 1, limit: 1000 });
      if (rejectRes && ((rejectRes.statusCode || rejectRes.status) === 200)) {
        s.rejectedApplications = rejectRes.data.length;
      }

      // --- finalisedApplications (mo and ol true, isFinalized false) ---
      const finalisedRes = await exports.listFinalisedApplications(user, { ..._query, page: 1, limit: 1000 });
      if (finalisedRes && ((finalisedRes.statusCode || finalisedRes.status) === 200)) {
        s.finalisedApplications = finalisedRes.data.length;
      }

      // --- finalizedApprovedApplications (isFinalized true) ---
      const finalizedApprovedRes = await exports.listApprovedApplications(user, { ..._query, page: 1, limit: 1000, isFinalized: true });
      if (finalizedApprovedRes && ((finalizedApprovedRes.statusCode || finalizedApprovedRes.status) === 200)) {
        s.finalizedApprovedApplications = finalizedApprovedRes.data.length;
      }
    }

    // ---------------- Finalize shared logic ----------------
    const acceptedApplications =
      roleLc === 'headquarter'
        ? parseInt(s.approvedApplications || 0, 10)
        : (s.approvedApplications || 0);

    const totalPendingApplications =
      roleLc === 'headquarter'
        ? parseInt(s.pendingApplications || 0, 10)
        : (s.pendingApplications || 0);
    

    const finalResponse = {
      clarificationRaised: s.totalApplications || 0,
      totalPendingApplications,
      rejected: parseInt(s.rejectedApplications || 0, 10),
      approved: parseInt(s.finalisedApplications || 0, 10),
      finalizedApproved: parseInt(s.finalizedApprovedApplications || 0, 10),
      acceptedApplications,
    };
    
    console.log("=== FINAL APPLICATION STATS DEBUG ===");
    console.log("Role:", roleLc);
    console.log("Final response:", JSON.stringify(finalResponse, null, 2));
    
    return ResponseHelper.success(200, 'Application stats', finalResponse);
  } catch (err) {
    return ResponseHelper.error(500, 'Failed to compute application stats', err.message);
  } finally {
    client.release();
  }
};

async function loadApplications(whereSql = "", params = [], user) {
  const client = await dbService.getClient();
  try {
    let citationQuery, appreQuery;
    if (user && user?.user_role === "headquarter") {
      citationQuery = `
      SELECT 
        c.citation_id AS id,
        'citation' AS type,
        c.unit_id,
        row_to_json(u) AS unit_details,
        c.date_init,
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
          unit_id, sos_no, name, adm_channel, tech_channel, brigade_id, command_id,
          unit_type, matrix_unit, location, awards, members, is_hr_review, is_dv_review,
          is_mp_review, created_at, updated_at
        FROM Unit_tab
      ) u ON c.unit_id = u.unit_id
      ${whereSql ? `WHERE ${whereSql.replace(/^\s*AND\s*/i, "")}` : ""}
    `;

      appreQuery = `
      SELECT 
        a.appreciation_id AS id,
        'appreciation' AS type,
        a.unit_id,
        row_to_json(u) AS unit_details,
        a.date_init,
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
          unit_id, sos_no, name, adm_channel, tech_channel, brigade_id, command_id,
          unit_type, matrix_unit, location, awards, members, is_hr_review, is_dv_review,
          is_mp_review, created_at, updated_at
        FROM Unit_tab
      ) u ON a.unit_id = u.unit_id
      ${whereSql ? `WHERE ${whereSql.replace(/^\s*AND\s*/i, "")}` : ""}
    `;
    } else {
      citationQuery = `
      SELECT 
        c.citation_id AS id,
        'citation' AS type,
        c.unit_id,
        row_to_json(u) AS unit_details,
        c.date_init,
        c.status_flag,
        c.is_mo_approved,
        c.mo_approved_at,
        c.is_ol_approved,
        c.ol_approved_at,
        c.last_approved_by_role,
        c.last_approved_at
      FROM Citation_tab c
      LEFT JOIN Unit_tab u ON c.unit_id = u.unit_id
      ${whereSql ? `WHERE ${whereSql.replace(/^\s*AND\s*/i, "")}` : ""}
    `;

      appreQuery = `
      SELECT 
        a.appreciation_id AS id,
        'appreciation' AS type,
        a.unit_id,
        row_to_json(u) AS unit_details,
        a.date_init,
        a.status_flag,
        a.is_mo_approved,
        a.mo_approved_at,
        a.is_ol_approved,
        a.ol_approved_at,
        a.last_approved_by_role,
        a.last_approved_at
      FROM Appre_tab a
      LEFT JOIN Unit_tab u ON a.unit_id = u.unit_id
      ${whereSql ? `WHERE ${whereSql.replace(/^\s*AND\s*/i, "")}` : ""}
    `;
    }

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, params),
      client.query(appreQuery, params),
    ]);

    let allApps = [...citations.rows, ...appreciations.rows];
    allApps = await attachFdsToApplications(allApps);
    // ----- Clarification linking -----
    const clarificationIds = [];
    for (const app of allApps) {
      for (const p of app.fds?.parameters || []) {
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
        allApps.flatMap((app) =>
          (app.fds?.parameters || []).map((p) => p.name?.trim().toLowerCase())
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

exports.listAllApplications = async (user, query = {}) => {
  try {
    const client = await dbService.getClient();
    const { user_role } = user;
    const { page = 1, limit = 10 } = query;

    // Get user's profile and unit information
    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    if (!unit) {
      return ResponseHelper.error(400, "User profile not found");
    }

    // Build command-based filtering
    let unitIds = [];
    let whereClause = "";

    if (user_role.toLowerCase() === "headquarter") {
      // HQ can see all applications - no filtering needed
      whereClause = "";
    } else {
      // For other roles, filter by command hierarchy
      const ROLE_HIERARCHY = [
        "unit",
        "brigade",
        "division",
        "corps",
        "command",
      ];
      const currentRole = user_role.toLowerCase();
      const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);

      if (currentIndex === -1) {
        throw new Error("Invalid user role");
      }

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
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
        });
      }

      whereClause = `unit_id = ANY($1)`;
    }

    // Load applications with proper filtering
    const allApps = await loadApplications(
      whereClause,
      unitIds.length > 0 ? [unitIds] : []
    );
    const { data, meta } = paginate(allApps, page, limit);
    return ResponseHelper.success(200, "All applications", data, meta);
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to list all applications",
      err.message
    );
  }
};

// 2) Pending applications: NOT command-approved AND status != rejected
exports.listPendingApplications = async (user, query = {}) => {
  try {
    const client = await dbService.getClient();
    const { user_role } = user;
    const { page = 1, limit = 10 } = query;

    // Get user's profile and unit information
    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    if (!unit) {
      return ResponseHelper.error(400, "User profile not found");
    }

    // Build command-based filtering
    let unitIds = [];
    let whereClause = `
      (last_approved_by_role IS DISTINCT FROM 'command')
      AND (status_flag IS DISTINCT FROM 'rejected')
    `;

    if (user_role.toLowerCase() === "headquarter") {
      // HQ can see all pending applications - no additional filtering needed
      whereClause = `
        (last_approved_by_role IS DISTINCT FROM 'command')
        AND (status_flag IS DISTINCT FROM 'rejected')
      `;
    } else {
      // For other roles, filter by command hierarchy
      const ROLE_HIERARCHY = [
        "unit",
        "brigade",
        "division",
        "corps",
        "command",
      ];
      const currentRole = user_role.toLowerCase();
      const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);

      if (currentIndex === -1) {
        throw new Error("Invalid user role");
      }

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
        return ResponseHelper.success(
          200,
          "No pending applications found",
          [],
          {
            totalItems: 0,
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
          }
        );
      }

      whereClause += ` AND unit_id = ANY($1)`;
    }

    // Load applications with proper filtering
    const allApps = await loadApplications(
      whereClause,
      unitIds.length > 0 ? [unitIds] : []
    );
    const { data, meta } = paginate(allApps, page, limit);
    return ResponseHelper.success(200, "Pending applications", data, meta);
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to list pending applications",
      err.message
    );
  }
};

// 3) Rejected applications
exports.listRejectedApplications = async (user, query = {}) => {
  try {
    let allApps;

    if (user.user_role === "headquarter") {
      const whereSql = `status_flag = 'rejected'`;
      // Pass empty array since there are no $1 placeholders
      allApps = await loadApplications(whereSql, [], user);
    } else {
      // For brigade, division, corps, command roles, use the same logic as getAllApplications
      if (['brigade', 'division', 'corps', 'command'].includes(user.user_role?.toLowerCase())) {
        // Use the same logic as getAllApplications to get filtered applications
        const allApplicationsResult = await exports.getAllApplications(user, {
          ...query,
          page: 1,
          limit: 100000, // Fetch all to get accurate counts
        });

        if (!allApplicationsResult.success) {
          throw new Error(allApplicationsResult.message);
        }

        // Filter for rejected applications
        allApps = allApplicationsResult.data.filter(app => app.status_flag === 'rejected');
      } else {
        // For unit role users
        if (!user.unit_id) {
          return ResponseHelper.error(404, "Unit not found");
        }
        
      // Step 1: Get the user's unit and its COMD
      const unitRes = await dbService.query(
        `SELECT name FROM Unit_tab WHERE unit_id = $1`,
        [user.unit_id]
      );
      if (!unitRes.rows.length) {
        return ResponseHelper.error(404, "Unit not found");
      }
      const userComd = unitRes.rows[0].name;

      // Step 2: Build WHERE clause to filter rejected + matching comd
      const whereSql = `status_flag = 'rejected' AND fds->>'command' = $1`;

      // Step 3: Load applications using this filter
      allApps = await loadApplications(whereSql, [userComd]);
      }
    }

    const { data, meta } = paginate(allApps, query.page, query.limit);
    return ResponseHelper.success(200, "Rejected applications", data, meta);
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to list rejected applications",
      err.message
    );
  }
};

exports.listFinalisedApplications = async (user, query = {}) => {
  const client = await dbService.getClient();
  try {
    console.log("=== listFinalisedApplications START ===");
    console.log("User:", JSON.stringify(user, null, 2));
    console.log("Query:", JSON.stringify(query, null, 2));

    // Show applications where both mo and ol are approved (finalized applications)
    // but NOT yet marked as isFinalized = true (i.e., isFinalized = false or NULL)
    let whereSql = `is_mo_approved = true AND is_ol_approved = true AND (isFinalized = false OR isFinalized IS NULL)`;

    // If isFinalized parameter is provided, filter by isFinalized status
    if (query.isFinalized !== undefined) {
      const finalized = query.isFinalized === "true" || query.isFinalized === true;
      whereSql = `is_mo_approved = true AND is_ol_approved = true AND isFinalized = ${finalized}`;
    }

    console.log("Final whereSql:", whereSql);

    const allApps = await loadApplications(whereSql, [], user);

    console.log("Found applications:", allApps.length);

    const { data, meta } = paginate(allApps, query.page, query.limit);

    console.log("=== listFinalisedApplications END ===");
    return ResponseHelper.success(200, "Finalised applications", data, meta);
  } catch (err) {
    console.error("Error in listFinalisedApplications:", err);
    return ResponseHelper.error(
      500,
      "Failed to list finalised applications",
      err.message
    );
  } finally {
    client.release();
  }
};

// 5) Approved applications (approved by command)
exports.listApprovedApplications = async (user, query = {}) => {
  const client = await dbService.getClient();
  try {
    let whereSql = `last_approved_by_role = 'command'`;
    
    // If isFinalized parameter is provided, filter by isFinalized status
    if (query.isFinalized !== undefined) {
      const finalized = query.isFinalized === "true" || query.isFinalized === true;
      whereSql += ` AND isFinalized = ${finalized}`;
    }
    
    const allApps = await loadApplications(whereSql, [], user);
    const { data, meta } = paginate(allApps, query.page, query.limit);
    return ResponseHelper.success(200, "Approved applications", data, meta);
  } catch (err) {
    return ResponseHelper.error(
      500,
      "Failed to list approved applications",
      err.message
    );
  } finally {
    client.release();
  }
};

exports.getApplicationsSummary = async (user, query) => {
  const client = await dbService.getClient();
  try {
    console.log("=== getApplicationsSummary START ===");
    console.log("User:", JSON.stringify(user, null, 2));
    console.log("Query:", JSON.stringify(query, null, 2));

    const { user_role } = user;
    const {
      award_type,
      command_type,
      corps_type,
      division_type,
      brigade_type,
      search,
      group_by = "arms_service", // Default to arms_service
    } = query || {};

    // Get unit IDs based on user role
    let unitIds = [];
    const user_role_lower = user_role?.toLowerCase();

    if (user_role_lower === "headquarter") {
      // HQ can see all applications
      const allUnitsRes = await client.query(`SELECT unit_id FROM Unit_tab`);
      unitIds = allUnitsRes.rows.map((u) => u.unit_id);
    } else if (user_role_lower === "unit" || user.is_special_unit) {
      // Unit role - only their own applications
      unitIds = [user.unit_id];
    } else {
      // For brigade, division, corps, command roles - get subordinate units
      const profile = await AuthService.getProfile(user);
      const master = profile?.data?.master;

      if (master) {
      const subordinateFieldMap = {
          brigade: { table: 'brigade_master', idCol: 'brigade_id', nameCol: 'brigade_name' },
          division: { table: 'division_master', idCol: 'division_id', nameCol: 'division_name' },
          corps: { table: 'corps_master', idCol: 'corps_id', nameCol: 'corps_name' },
          command: { table: 'command_master', idCol: 'command_id', nameCol: 'command_name' }
        };

        const { table, idCol } = subordinateFieldMap[user_role_lower];
        if (table && master[idCol]) {
        const subUnitsRes = await client.query(
            `SELECT unit_id FROM Unit_tab WHERE ${idCol} = $1`,
            [master[idCol]]
        );
          unitIds = subUnitsRes.rows.map(u => u.unit_id);
      }
      }
    }

      if (unitIds.length === 0) {
        return ResponseHelper.success(200, "Applications grouped", {
          x: [],
          y: [],
        });
    }

    // Build WHERE clause
    const whereConditions = [`apps.unit_id = ANY($1)`];
    const params = [unitIds];
    let paramIndex = 1;

    if (award_type) {
      paramIndex++;
      params.push(award_type);
      whereConditions.push(`LOWER(apps.fds->>'award_type') = LOWER($${paramIndex})`);
    }
    if (command_type) {
      paramIndex++;
      params.push(command_type);
      whereConditions.push(`LOWER(COALESCE(NULLIF(apps.fds->>'command',''), cm.command_name)) = LOWER($${paramIndex})`);
    }
    if (corps_type) {
      paramIndex++;
      params.push(corps_type);
      whereConditions.push(`LOWER(COALESCE(NULLIF(apps.fds->>'corps',''), cms.corps_name)) = LOWER($${paramIndex})`);
    }
    if (division_type) {
      paramIndex++;
      params.push(division_type);
      whereConditions.push(`LOWER(COALESCE(NULLIF(apps.fds->>'division',''), dm.division_name)) = LOWER($${paramIndex})`);
    }
    if (brigade_type) {
      paramIndex++;
      params.push(brigade_type);
      whereConditions.push(`LOWER(COALESCE(NULLIF(apps.fds->>'brigade',''), bm.brigade_name)) = LOWER($${paramIndex})`);
    }
    if (search) {
      paramIndex++;
      params.push(`%${search}%`);
      whereConditions.push(`(
        CAST(apps.id AS TEXT) ILIKE $${paramIndex} OR
        apps.fds->>'cycle_period' ILIKE $${paramIndex} OR
        apps.fds->>'unit_name' ILIKE $${paramIndex} OR
        u.name ILIKE $${paramIndex} OR
        bm.brigade_name ILIKE $${paramIndex} OR
        dm.division_name ILIKE $${paramIndex} OR
        cms.corps_name ILIKE $${paramIndex} OR
        cm.command_name ILIKE $${paramIndex}
      )`);
    }

    const whereClause = whereConditions.join(" AND ");

    // Determine grouping expression
    const key = String(group_by || "arms_service").toLowerCase();
    let groupExpr;
    let groupByClause;

    switch (key) {
      case "command":
      case "comd":
        groupExpr = "COALESCE(cm.command_name, 'Unspecified')";
        groupByClause = "cm.command_name";
        break;
      case "corps":
        groupExpr = "COALESCE(cms.corps_name, 'Unspecified')";
        groupByClause = "cms.corps_name";
        break;
      case "division":
      case "div":
        groupExpr = "COALESCE(dm.division_name, 'Unspecified')";
        groupByClause = "dm.division_name";
        break;
      case "brigade":
      case "bde":
        groupExpr = "COALESCE(bm.brigade_name, 'Unspecified')";
        groupByClause = "bm.brigade_name";
        break;
      case "arms_service":
      default:
        groupExpr = "COALESCE(asm.arms_service_name, 'Unspecified')";
        groupByClause = "asm.arms_service_name";
        break;
    }

    const sql = `
      WITH apps AS (
        SELECT c.citation_id AS id,'citation'::text AS type,c.unit_id,c.date_init,c.status_flag,
               c.last_approved_by_role,c.last_approved_at,c.fds_id
        FROM Citation_tab c
        UNION ALL
        SELECT a.appreciation_id AS id,'appreciation'::text AS type,a.unit_id,a.date_init,a.status_flag,
               a.last_approved_by_role,a.last_approved_at,a.fds_id
        FROM Appre_tab a
      )
      SELECT ${groupExpr} AS label, COUNT(*) AS total
      FROM apps
      JOIN Unit_tab u ON u.unit_id = apps.unit_id
      LEFT JOIN brigade_master bm ON u.brigade_id = bm.brigade_id
      LEFT JOIN division_master dm ON u.division_id = dm.division_id
      LEFT JOIN corps_master cms ON u.corps_id = cms.corps_id
      LEFT JOIN command_master cm ON u.command_id = cm.command_id
      LEFT JOIN fds f ON f.application_id = apps.id AND f.award_type = apps.type
      LEFT JOIN arms_service_master asm ON f.arms_service_id = asm.arms_service_id
      WHERE ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY label ASC
    `;

    console.log("SQL Query:", sql);
    console.log("Params:", params);

    const { rows } = await client.query(sql, params);
    const x = rows.map((r) => r.label);
    const y = rows.map((r) => Number(r.total));

    console.log("=== getApplicationsSummary END ===");
    console.log("Result:", { x, y });

    return ResponseHelper.success(
      200,
      "Applications grouped",
      { x, y },
      {
        group_by: key,
        totalGroups: x.length,
        totalApplications: y.reduce((a, b) => a + b, 0),
      }
    );
  } catch (err) {
    console.error("Error in getApplicationsSummary:", err);
    return ResponseHelper.error(
      500,
      "Failed to group applications",
      err.message
    );
  } finally {
    client.release();
  }
};

exports.applicationFinalize = async (user, body) => {
  const client = await dbService.getClient();
  try {
    await client.query("BEGIN");

    const { applicationsForFinalized } = body;

    console.log("=== applicationFinalize START ===");
    console.log("User:", JSON.stringify(user, null, 2));
    console.log("Body:", JSON.stringify(body, null, 2));

    for (const app of applicationsForFinalized) {
      console.log(`Processing application: ${app.type} with id: ${app.id}`);
      
      if (app.type === "citation") {
        await client.query(
          `UPDATE Citation_tab 
           SET isFinalized = true 
           WHERE citation_id = $1`,
          [app.id]
        );
        console.log(`Updated Citation_tab citation_id ${app.id} to isFinalized = true`);
      } else if (app.type === "appre" || app.type === "appreciation") {
        await client.query(
          `UPDATE Appre_tab 
           SET isFinalized = true 
           WHERE appreciation_id = $1`,
          [app.id]
        );
        console.log(`Updated Appre_tab appreciation_id ${app.id} to isFinalized = true`);
      }
    }

    await client.query("COMMIT");

    console.log("=== applicationFinalize END ===");
    return ResponseHelper.success(
      200,
      "Applications finalized successfully",
      {
        updated: applicationsForFinalized.length,
      }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in applicationFinalize:", err);
    return ResponseHelper.error(
      500,
      "Failed to finalize applications",
      err.message
    );
  } finally {
    client.release();
  }
};
