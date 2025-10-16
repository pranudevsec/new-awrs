const dbService = require("../utils/postgres/dbService");
const ResponseHelper = require("../utils/responseHelper");
const AuthService = require("../services/AuthService.js");
const { application } = require("express");
const {
  attachFdsToApplications,
  attachSingleFdsToApplication,
} = require("./commonService.js");
const { LOGIN_SUCCESS } = require("../utils/MSG.js");

// Get all applications for a specific unit
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
        status_flag,
        rejected_reason
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
        status_flag,
        rejected_reason
      FROM Appre_tab
      WHERE unit_id = $1
    `,
      [unitId]
    );

    // Combine citations and appreciations
    let allApps = [...citations.rows, ...appreciations.rows];
    allApps = await attachFdsToApplications(allApps);
    
    // Filter by award type if specified
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
    
    // Gather clarification IDs from all parameters
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
    
    // Fetch clarification details if any exist
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
    
    // For unit role, show status_flag only for draft applications
    if (user.user_role === "unit") {
      allApps = allApps.map(({ status_flag, ...rest }) => {
        if (status_flag === "draft") {
          return { status_flag, ...rest };
        }
        return rest;
      });
    }
    
    // Count pending clarifications and clean up clarification data
    let total_pending_clarifications = 0;
    allApps = allApps?.map((app) => {
      let clarifications_count = 0;
      const cleanedParameters = app.fds.parameters.map((param) => {
        const newParam = { ...param };
        if (newParam.clarification?.clarification_status === "pending") {
          clarifications_count++;
          total_pending_clarifications++;
        }
        // Remove clarification data from final response
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


    if (award_type) {
      allApps = allApps.filter(
        (app) => app.type?.toLowerCase() === award_type.toLowerCase()
      );
    }


    const normalize = (str) =>
      str?.toString().toLowerCase().replace(/[\s-]/g, "");

    if (search) {
      const searchLower = normalize(search);
      allApps = allApps.filter((app) => {
        const idMatch = app.id.toString().toLowerCase().includes(searchLower);
        const cycleMatch = normalize(app.fds?.cycle_period || "").includes(
          searchLower
        );


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


    let total_pending_clarifications = 0;
    
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
          c.rejected_reason,
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
                       a.rejected_reason,
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


    function shouldCleanClarification(param, userRoleIndex) {
      if (!param.clarification_details?.clarification_by_role) return false;
      const clarificationRoleIndex = roleHierarchy.indexOf(
        param.clarification_details.clarification_by_role?.toLowerCase()
      );
      return (
        clarificationRoleIndex >= 0 && userRoleIndex > clarificationRoleIndex
      );
    }


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

// Helper function to validate user profile and role
const validateUserProfileAndRole = (user, profile) => {
  const { user_role } = user;
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

  return { hierarchy, currentIndex, lowerRole: hierarchy[currentIndex - 1] };
};

// Helper function to get subordinate unit IDs
const getSubordinateUnitIds = async (client, user, profile, user_role) => {
  const unit = profile?.data?.unit;
  const master = profile?.data?.master;
  
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
  
  const { table, idCol, nameCol } = subordinateFieldMap[user_role.toLowerCase()];
  if (!table) {
    throw new Error("Unit data or hierarchy mapping missing");
  }

  let subUnitsRes;
  if (master?.id) {
    subUnitsRes = await client.query(
      `SELECT unit_id FROM Unit_tab WHERE ${idCol} = $1`,
      [master.id]
    );
  } else {
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
  
  return subUnitsRes.rows.map((u) => u.unit_id);
};

// Helper function to build base filters
const buildBaseFilters = (query, user, lowerRole) => {
  const { isGetWithdrawRequests, isShortlisted } = query;
  const { user_role, user_id } = user;
  const roleLC = user_role.toLowerCase();
  
  let baseFilters = "";
  const queryParams = [query.unitIds];

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
    queryParams.push(user_role, user_id, lowerRole);
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

  return { baseFilters, queryParams };
};

// Helper function to filter applications by search criteria
const filterApplicationsBySearch = (allApps, search, award_type) => {
  const normalize = (str) => str?.toString().toLowerCase().replace(/[\s-]/g, "");

  if (award_type) {
    allApps = allApps.filter(
      (app) => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase()
    );
  }

  if (search) {
    const searchLower = normalize(search);
    allApps = allApps.filter((app) => {
      const searchFields = [
        app.id.toString().toLowerCase(),
        normalize(app.fds?.cycle_period || ""),
        normalize(app.fds?.award_type || ""),
        normalize(app.fds?.command || ""),
        normalize(app.fds?.brigade || ""),
        normalize(app.fds?.division || ""),
        normalize(app.fds?.corps || ""),
        normalize(app.fds?.unit_type || ""),
        normalize(app.fds?.matrix_unit || ""),
        normalize(app.fds?.location || "")
      ];
      
      return searchFields.some(field => field.includes(searchLower));
    });
  }

  return allApps;
};

// Helper function to process clarifications
const processClarifications = async (client, allApps) => {
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

  let total_pending_clarifications = 0;
  allApps = allApps.map((app) => {
    let clarifications_count = 0;
    const cleanedParameters = (app.fds.parameters || []).map((param) => {
      const newParam = { ...param };
      if (param.clarification_id) {
        newParam.clarification = clarificationMap[param.clarification_id] || null;
      }
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

  return { allApps, total_pending_clarifications };
};

// Helper function to calculate marks
const calculateMarks = (parameters) => {
  const hasApprovedMarks = (param) => {
    return param.approved_marks !== null && 
           param.approved_marks !== undefined && 
           param.approved_marks !== "" &&
           !isNaN(Number(param.approved_marks)) &&
           Number(param.approved_marks) > 0 &&
           param.approved_by_user !== null;
  };

  const isZeroApproval = (param) => {
    return param.approved_marks === 0 && param.approved_by_user === null;
  };

  const getMarksToUse = (param) => {
    const finalHasApprovedMarks = hasApprovedMarks(param) && !isZeroApproval(param);
    return finalHasApprovedMarks ? Number(param.approved_marks) : (param.marks || 0);
  };

  const totalMarks = parameters.reduce((sum, param) => {
    const isNegative = param.negative === true;
    if (isNegative) return sum;
    return sum + getMarksToUse(param);
  }, 0);

  const totalNegativeMarks = parameters.reduce((sum, param) => {
    const isNegative = param.negative === true;
    if (!isNegative) return sum;
    return sum + getMarksToUse(param);
  }, 0);

  return {
    totalMarks,
    totalNegativeMarks,
    netMarks: totalMarks - totalNegativeMarks
  };
};

// Helper function to add marks to applications
const addMarksToApplications = async (client, allApps) => {
  const allParameterNames = Array.from(
    new Set(
      allApps.flatMap(
        (app) => app.fds?.parameters?.map((p) => p.name?.trim().toLowerCase()) || []
      )
    )
  );
  
  if (allParameterNames.length === 0) {
    return allApps.map((app) => ({
      ...app,
      totalMarks: 0,
      totalNegativeMarks: 0,
      netMarks: 0,
    }));
  }

  const parameterMasterRes = await client.query(
    `SELECT name, negative FROM Parameter_Master WHERE LOWER(TRIM(name)) = ANY($1)`,
    [allParameterNames]
  );
  
  const negativeParamMap = parameterMasterRes.rows.reduce((acc, row) => {
    acc[row.name.trim().toLowerCase()] = row.negative;
    return acc;
  }, {});
  
  return allApps.map((app) => {
    const parameters = app.fds?.parameters || [];
    const marks = calculateMarks(parameters);
    return { ...app, ...marks };
  });
};

// Helper function to handle shortlisted applications
const handleShortlistedApplications = async (client, allApps, hierarchy, roleLC) => {
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
      const aPriority = a.fds?.applicationPriority?.find((p) => p.role === lowerRole)?.priority ?? Number.MAX_SAFE_INTEGER;
      const bPriority = b.fds?.applicationPriority?.find((p) => p.role === lowerRole)?.priority ?? Number.MAX_SAFE_INTEGER;
      return aPriority - bPriority;
    });
  }

  return allApps;
};

// Helper function to paginate results
const paginateResults = (allApps, page, limit) => {
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const startIndex = (pageInt - 1) * limitInt;
  const endIndex = pageInt * limitInt;
  const paginatedData = allApps.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      totalItems: allApps.length,
      totalPages: Math.ceil(allApps.length / limitInt),
      currentPage: pageInt,
      itemsPerPage: limitInt,
    }
  };
};

exports.getApplicationsOfSubordinates = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const { page = 1, limit = 10, isShortlisted, isGetNotClarifications, isGetWithdrawRequests } = query;

    // Validate user profile and role
    const profile = await AuthService.getProfile(user);
    const { hierarchy, lowerRole } = validateUserProfileAndRole(user, profile);

    // Get subordinate unit IDs
    const unitIds = await getSubordinateUnitIds(client, user, profile, user_role);
    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No subordinate units found", [], {
        totalItems: 0,
      });
    }

    // Build base filters and query parameters
    const { baseFilters, queryParams } = buildBaseFilters({ ...query, unitIds }, user, lowerRole);

    // Execute queries for citations and appreciations
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
    
    let allApps = [...citations.rows, ...appreciations.rows];
    allApps = await attachFdsToApplications(allApps);

    // Filter applications by search criteria
    allApps = filterApplicationsBySearch(allApps, query.search, query.award_type);

    // Process clarifications
    const { allApps: processedApps } = await processClarifications(client, allApps);
    allApps = processedApps;

    // Filter out applications with clarifications if requested
    if (isGetNotClarifications) {
      allApps = allApps.filter((app) => app.clarifications_count === 0);
    }

    // Add marks to applications
    allApps = await addMarksToApplications(client, allApps);

    // Handle shortlisted applications
    if (isShortlisted) {
      allApps = await handleShortlistedApplications(client, allApps, hierarchy, user_role.toLowerCase());
    }

    // Sort by date and paginate
    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
    const { data: paginatedData, pagination } = paginateResults(allApps, page, limit);

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


    let params = isCommand ? [unitIds] : [];
    if (award_type) params.push(award_type);
    if (search) params.push(`%${search.toLowerCase()}%`);


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


    const totalItems = allApps.length;
    const paginatedData = allApps.slice(0, limitInt);

    const pagination = {
      totalItems,
      totalPages: Math.ceil(totalItems / limitInt),
      currentPage: pageInt,
      itemsPerPage: limitInt,
    };
    let filteredApps = paginatedData.filter((app) => {

      if (!app.fds) return false;

      let match = true;


      if (award_type) {
        match =
          match &&
          app.fds.award_type?.toLowerCase() === award_type.toLowerCase();
      }


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

// Helper function to validate and resolve application type
const validateAndResolveType = (type) => {
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
  return config;
};

// Helper function to handle withdraw request
const handleWithdrawRequest = async (client, config, user, id) => {
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
};

// Helper function to handle withdraw decision
const handleWithdrawDecision = async (client, config, withdraw_status, user, id) => {
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
};

// Helper function to fetch application with FDS data
const fetchApplicationWithFds = async (client, config, id) => {
  const fetchRes = await client.query(
    `SELECT * FROM ${config.table} WHERE ${config.column} = $1`,
    [id]
  );
  if (fetchRes.rowCount === 0) throw new Error("Application not found");
  let appData = fetchRes.rows[0];
  appData = await attachSingleFdsToApplication(appData);
  return appData;
};

// Helper function to validate member IC number
const validateMemberIcNumber = (member) => {
  if (member.ic_number) {
    const icNumberRegex = /^IC-\d{5}[A-Z]$/;
    if (!icNumberRegex.test(member.ic_number)) {
      throw new Error("IC number must be in format IC-XXXXX[A-Z] where XXXXX are 5 digits and last character is any alphabet");
    }
  } else {
    throw new Error("IC number is required and cannot be blank");
  }
};

// Helper function to handle member database operations
const handleMemberDatabaseOperations = async (client, appData, member) => {
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
};

// Helper function to update FDS accepted members
const updateFdsAcceptedMembers = (fds, member) => {
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
};

// Helper function to handle CW2 approval logic
const handleCw2Approval = async (client, config, user, id) => {
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
};

// Helper function to compute next status and side effects
const computeNextStatusAndSideEffects = async (client, config, user, id, status, statusLower, member, iscdr, fds) => {
  let updatedStatusLower = statusLower;

  clearClarificationIfApproved(fds, statusLower, user);

  const memberResult = await maybeHandleMemberUpdate(client, config, user, id, status, statusLower, member, iscdr, fds);
  if (memberResult) {
    updatedStatusLower = memberResult.updatedStatusLower;
  }

  return { isMemberStatusUpdate: Boolean(memberResult?.isMemberStatusUpdate), updatedStatusLower };
};

function clearClarificationIfApproved(fds, statusLower, user) {
  if (statusLower !== "approved" || !Array.isArray(fds?.parameters)) return;
  fds.parameters = fds.parameters.map((param) => {
    if (!param.clarification_id) return param;
    const { clarification_id, ...rest } = param;
    return {
      ...rest,
      last_clarification_handled_by: user.user_role,
      last_clarification_status: "clarified",
      last_clarification_id: clarification_id,
    };
  });
}

async function maybeHandleMemberUpdate(client, config, user, id, status, statusLower, member, iscdr, fds) {
  if (!member || iscdr) return null;
  validateMemberIcNumber(member);

  const appData = await fetchApplicationWithFds(client, config, id);
  await handleMemberDatabaseOperations(client, appData, member);
  updateFdsAcceptedMembers(fds, member);

  const profile = await AuthService.getProfile(user);
  const unit = profile?.data?.unit;
  if (!unit?.members?.length || !fds.accepted_members?.length) return { isMemberStatusUpdate: false, updatedStatusLower: statusLower };

  const allSigned = haveAllUnitMembersSigned(unit.members, fds.accepted_members);
  if (!allSigned) return { isMemberStatusUpdate: false, updatedStatusLower: statusLower };

  if (user.user_role === "cw2") {
    await handleCw2Approval(client, config, user, id);
    return { isMemberStatusUpdate: true, updatedStatusLower: statusLower };
  }

  const next = status !== "rejected" ? "shortlisted_approved" : statusLower;
  return { isMemberStatusUpdate: true, updatedStatusLower: next };
}

function haveAllUnitMembersSigned(unitMembers, acceptedMembers) {
  const acceptedMap = new Map(acceptedMembers.map((m) => [m.member_id, m]));
  return unitMembers.every((unitMember) => acceptedMap.get(unitMember.id)?.is_signature_added === true);
}

// Helper function to persist status and audit
const persistStatusAndAudit = async (client, config, statusLower, user, id, reason) => {
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
          last_rejected_at = $4,
          rejected_reason = $5
      WHERE ${config.column} = $2
      RETURNING *;
    `;
    values = [statusLower, id, user.user_role, now, reason];
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
};

exports.updateApplicationStatus = async (
  id,
  type,
  status,
  user,
  member = null,
  withdrawRequested = false,
  withdraw_status = null,
  reason
) => {
  const client = await dbService.getClient();
  try {
    const iscdr = member?.iscdr ?? false;
    const config = validateAndResolveType(type);

    // Handle withdraw request
    if (withdrawRequested) {
      return await handleWithdrawRequest(client, config, user, id);
    }

    // Handle withdraw decision
    if (["approved", "rejected"].includes(withdraw_status)) {
      return await handleWithdrawDecision(client, config, withdraw_status, user, id);
    }

    // Validate status
    const allowedStatuses = [
      "in_review",
      "in_clarification",
      "approved",
      "rejected",
      "shortlisted_approved",
    ];
    let statusLower = status ? status.toLowerCase() : null;
    const isStatusValid = statusLower && allowedStatuses.includes(statusLower);

    // Handle status updates and member operations
    let updatedFds = null;
    let isMemberStatusUpdate = false;
    
    if (statusLower === "approved" || member) {
      const appData = await fetchApplicationWithFds(client, config, id);
      const fds = appData?.fds;
      
      const { isMemberStatusUpdate: memberUpdate, updatedStatusLower } = 
        await computeNextStatusAndSideEffects(client, config, user, id, status, statusLower, member, iscdr, fds);
      
      isMemberStatusUpdate = memberUpdate;
      statusLower = updatedStatusLower;
      updatedFds = fds;
    }

    // Persist changes
    if (isStatusValid || isMemberStatusUpdate) {
      return await persistStatusAndAudit(client, config, statusLower, user, id, reason);
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


    const res = await client.query(query, [application_id]);
    if (res.rowCount === 0) {
      return ResponseHelper.error(404, "Application not found");
    }


    const application = await attachSingleFdsToApplication(res.rows[0]);
    const fds = application.fds;
    const now = new Date();

    async function updateParameterMarks(params, approvedParams) {
      if (!Array.isArray(params) || !Array.isArray(approvedParams)) {
        return { success: false, error: "Invalid input parameters", updatedParams: params };
      }
      
      let updatedCount = 0;
      const updatedParams = [...params]; // Create a copy to avoid mutating original
      
      for (const param of updatedParams) {
        const approvedParam = approvedParams.find((p) => p.id == param.id);
        if (approvedParam) {

          param.approved_marks = approvedParam.approved_marks ?? null;
          param.approved_count = approvedParam.approved_count ?? null;
          param.approved_marks_documents =
            approvedParam.approved_marks_documents || [];
          param.approved_marks_reason =
            approvedParam.approved_marks_reason || "";
          param.approved_by_user = user.user_id;
          param.approved_by_role = user.user_role;
          param.approved_marks_at = now;


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
          
          updatedCount++;
        }
      }

      return { 
        success: true, 
        updatedCount, 
        updatedParams,
        message: `Successfully updated ${updatedCount} parameters`
      };
    }

    async function updateGraceMarks(fds_id, graceMarksArr, marks) {
      if (marks === undefined) return graceMarksArr;
      const now = new Date().toISOString();

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

        graceMarksArr.push(graceEntry);


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

    async function updatePriorityDB(fds_id, priorityArr, points) {
      const now = new Date().toISOString();
      if (points === undefined) return priorityArr;
      if (!Array.isArray(priorityArr)) priorityArr = [];

      const isCw2 = user.user_role === "cw2";
      const userKey = isCw2 && user.cw2_type ? `${user.user_role}:${user.cw2_type}` : user.user_role;

      const idx = findPriorityIndex(priorityArr, userKey);
      const entry = buildPriorityEntry(user, points, now);

      if (idx !== -1) {
        priorityArr[idx] = entry;
        await execPriorityUpdate(client, fds_id, user, points, now);
      } else {
        priorityArr.push(entry);
        await execPriorityInsert(client, fds_id, user, points, now);
      }

      return priorityArr;
    }

    async function updateRemarks(remarkStr) {
      if (!remarkStr || typeof remarkStr !== "string") return;

      const now = new Date();

      try {

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


    if (Array.isArray(parameters) && parameters.length > 0) {
      const updateResult = await updateParameterMarks(fds.parameters, parameters);
      if (updateResult.success) {
        fds.parameters = updateResult.updatedParams;
      } else {
        console.error('Failed to update parameter marks:', updateResult.error);
        // Continue with original parameters if update fails
      }
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
    let remarks = updateRemarks(remark);
    return ResponseHelper.success(200, "Marks approved successfully");
  } catch (error) {
    return ResponseHelper.error(500, "Failed to approve marks", error.message);
  } finally {
    client.release();
  }
};

// --- Priority helpers extracted to reduce complexity ---
function findPriorityIndex(priorityArr, userKey) {
  const entryKey = (e) => (e.role === "cw2" && e.cw2_type ? `${e.role}:${e.cw2_type}` : e.role);
  return priorityArr.findIndex((entry) => entryKey(entry) === userKey);
}

function buildPriorityEntry(user, points, now) {
  const isCw2 = user.user_role === "cw2";
  return {
    role: user.user_role,
    priority: points,
    priorityAddedAt: now,
    ...(isCw2 && user.cw2_type ? { cw2_type: user.cw2_type } : {}),
  };
}

async function execPriorityUpdate(client, fds_id, user, points, now) {
  const isCw2 = user.user_role === "cw2";
  const sql = `
    UPDATE fds_application_priority
    SET priority = $1, priority_added_at = $2, updated_at = NOW()
    WHERE fds_id = $3 AND role = $4
    ${isCw2 ? "AND cw2_type = $5" : ""}
  `;
  const params = isCw2 ? [points, now, fds_id, user.user_role, user.cw2_type] : [points, now, fds_id, user.user_role];
  await client.query(sql, params);
}

async function execPriorityInsert(client, fds_id, user, points, now) {
  const isCw2 = user.user_role === "cw2";
  const sql = `
    INSERT INTO fds_application_priority
      (fds_id, role, priority, priority_added_at, created_at, updated_at${isCw2 ? ", cw2_type" : ""})
    VALUES
      ($1, $2, $3, $4, NOW(), NOW()${isCw2 ? ", $5" : ""})
  `;
  const params = isCw2 ? [fds_id, user.user_role, points, now, user.cw2_type] : [fds_id, user.user_role, points, now];
  await client.query(sql, params);
}

// Small helpers to keep addApplicationSignature simple
const isValidSignatureType = (type) => ["citation", "appreciation"].includes(type);
const fetchFdsForSignature = async (client, application_id, type) => {
  const res = await client.query(
    `SELECT fds_id, application_id, award_type, corps_id, brigade_id, division_id, command_id, location, last_date, unit_type, matrix_unit, unit_remarks, arms_service_id, cycle_period
     FROM fds WHERE application_id = $1 AND award_type = $2`,
    [application_id, type]
  );
  if (res.rowCount === 0) return null;
  return res.rows[0].fds || {};
};
const ensureRoleEntry = (fds, role) => {
  if (!Array.isArray(fds.signatures)) fds.signatures = [];
  let roleEntry = fds.signatures.find((sig) => sig.role === role);
  if (!roleEntry) {
    roleEntry = { role, signatures_of_members: [] };
    fds.signatures.push(roleEntry);
  }
  return roleEntry;
};
const requireAllMembersSignedIfNeeded = async (userRole, user, fds) => {
  if (userRole !== "presiding_officer" && userRole !== "cw2") return null;
  const profile = await AuthService.getProfile(user);
  const unit = profile?.data?.unit;
  if (!unit?.members?.length) return null;
  const allMembersSigned = unit.members.every((unitMember) =>
    fds.signatures.some((roleSig) =>
      roleSig.signatures_of_members.some(
        (memberSig) => memberSig.id === unitMember.id && memberSig.added_signature
      )
    )
  );
  if (!allMembersSigned) {
    return ResponseHelper.error(
      400,
      "All unit members must sign before presiding officer can sign"
    );
  }
  return null;
}; LOGIN_SUCCESS

exports.addApplicationSignature = async (user, body) => {
  const client = await dbService.getClient();
  try {
    const { type, application_id, id, member_order, member_type, name, added_signature = "" } = body;

    if (!isValidSignatureType(type)) {
      return ResponseHelper.error(400, "Invalid type provided");
    }
    if (!id || !member_order || !member_type || !name) {
      return ResponseHelper.error(400, "Missing required member fields");
    }

    const tableName = type === "citation" ? "Citation_tab" : "Appre_tab";
    const idColumn = type === "citation" ? "citation_id" : "appreciation_id";

    let fds = await fetchFdsForSignature(client, application_id, type);
    if (!fds || typeof fds !== "object") fds = {};

    const userRole = user.user_role;
    const now = new Date();

    const roleEntry = ensureRoleEntry(fds, userRole);

    const existingSignature = roleEntry.signatures_of_members.find((m) => m.id === id);
    if (existingSignature) {
      return ResponseHelper.error(400, "Signature already added for this member under this role");
    }

    const guardError = await requireAllMembersSignedIfNeeded(userRole, user, fds);
    if (guardError) return guardError;

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

    await client.query(
      `UPDATE fds
       SET corps_id = $1, brigade_id = $2, division_id = $3, command_id = $4, location = $5, last_date = $6, unit_type = $7, matrix_unit = $8, unit_remarks = $9, arms_service_id = $10, cycle_period = $11
       WHERE application_id = $12 AND award_type = $13`,
      [
        fds.corps_id,
        fds.brigade_id,
        fds.division_id,
        fds.command_id,
        fds.location,
        fds.last_date,
        fds.unit_type,
        fds.matrix_unit,
        fds.unit_remarks,
        fds.arms_service_id,
        fds.cycle_period,
        application_id,
        type,
      ]
    );

    return ResponseHelper.success(200, "Signature added successfully", newSignature);
  } catch (error) {
    return ResponseHelper.error(500, "Failed to add signature", error.message);
  } finally {
    client.release();
  }
};














exports.addApplicationComment = async (user, body) => {
  const client = await dbService.getClient();

  try {
    const { type, application_id, comment } = body;


    if (!["citation", "appreciation"].includes(type)) {
      return ResponseHelper.error(400, "Invalid type provided");
    }

    const tableName = type === "citation" ? "Citation_tab" : "Appre_tab";
    const idColumn = type === "citation" ? "citation_id" : "appreciation_id";


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


    if (!comment || typeof comment !== "string" || comment.trim() === "") {
      return ResponseHelper.error(400, "Comment text is required");
    }

    const now = new Date();


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
    const master = profile?.data?.master;
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    if (user_role.toLowerCase() === "cw2") {
      const cw2Res = await getCw2ApplicationsHistory(client, user, { award_type, search, limitInt, offset });
      return ResponseHelper.success(200, "Fetched CW2 applications history", cw2Res.data, cw2Res.meta);
    }

    const ROLE_HIERARCHY = [
      "unit",
      "brigade",
      "division",
      "corps",
      "command",
    ];
    const currentRole = user_role.toLowerCase();
    const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
    let unitIds = [];
    if (user_role.toLowerCase() === "unit") {
      unitIds = [unit.unit_id];
    } else {
const roleTableMap = {
  brigade: { table: "Brigade_Master", idField: "brigade_id", nameField: "brigade_name" },
  division: { table: "Division_Master", idField: "division_id", nameField: "division_name" },
  corps: { table: "Corps_Master", idField: "corps_id", nameField: "corps_name" },
  command: { table: "Command_Master", idField: "command_id", nameField: "command_name" },
};

const { table, idField, nameField } = roleTableMap[user_role.toLowerCase()] || {};
if (!table) throw new Error(`Invalid role: ${user_role}`);
// Prefer id from profile.master if available; fall back to name lookup
let parentId = master?.[idField] || null;
if (!parentId) {
  const masterRes = await client.query(
    `SELECT ${idField} FROM ${table} WHERE ${nameField} = $1 LIMIT 1`,
    [unit.name]
  );
  if (masterRes.rows.length === 0)
    throw new Error(`No matching record found in ${table} for name: ${unit.name}`);
  parentId = masterRes.rows[0][idField];
}

const subUnitsRes = await client.query(
  `SELECT unit_id FROM Unit_tab WHERE ${idField} = $1`,
  [parentId]
);

 unitIds = subUnitsRes.rows.map((u) => u.unit_id);
    }

    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No applications found", [], {
        totalItems: 0,
      });
    }

    const allowedRoles = ROLE_HIERARCHY.slice(currentIndex); // current and above (senior)
    // Roles below the current user in hierarchy (junior): e.g., for 'corps' => ['unit','brigade','division']
    const lowerRoles = ROLE_HIERARCHY.slice(0, currentIndex);

    const baseFilters = `
      unit_id = ANY($1) AND (
        (status_flag = 'approved' AND last_approved_by_role = ANY($2)) OR
        (status_flag = 'shortlisted_approved' AND last_approved_by_role = ANY($3)) OR
        (status_flag = 'rejected' AND last_rejected_by_role = ANY($3)) OR
        (status_flag = 'withdrawed' AND withdraw_requested_by = ANY($4))
      )
    `;
    console.log('baseFilters--------',baseFilters)
    const queryParams = [unitIds, allowedRoles, lowerRoles, [user.user_role]];
    console.log('queryParams--------',queryParams)
    const citationQuery = `
    SELECT 
      c.citation_id AS id,
      'citation' AS type,
      c.unit_id,
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
        name
      FROM Unit_tab
    ) u ON c.unit_id = u.unit_id
    WHERE ${baseFilters.replace(/unit_id/g, "c.unit_id")}
  `;
  console.log('helloooo--------')
    const appreQuery = `
    SELECT 
      a.appreciation_id AS id,
      'appreciation' AS type,
      a.unit_id,
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
        name
      FROM Unit_tab
    ) u ON a.unit_id = u.unit_id
    WHERE ${baseFilters.replace(/unit_id/g, "a.unit_id")}
  `;

    // Debug: surface reasoning for missing records like id=60
    if (user_role.toLowerCase() === 'corps') {
      try {
        const dbg = await client.query(`
          SELECT citation_id AS id, 'citation' AS type, unit_id, status_flag, last_approved_by_role
          FROM Citation_tab WHERE citation_id = 60
          UNION ALL
          SELECT appreciation_id AS id, 'appreciation' AS type, unit_id, status_flag, last_approved_by_role
          FROM Appre_tab WHERE appreciation_id = 60
        `);
        console.log('DEBUG app#60 raw:', dbg.rows);
        console.log('DEBUG filters:', { unitIds, allowedRoles, lowerRoles });
      } catch (e) {
        console.log('DEBUG app#60 probe failed:', e?.message);
      }
    }

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, queryParams),
      client.query(appreQuery, queryParams),
    ]);

    let allApps = [...citations.rows, ...appreciations.rows];
    console.log(allApps)
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

    // Debug: show whether id=60 is present post-filter
    if (user_role.toLowerCase() === 'corps') {
      const present60 = allApps.some((a) => Number(a.id) === 60);
      console.log('DEBUG app#60 present after filters?', present60, { count: allApps.length });
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

// Helper to simplify getApplicationsHistory for CW2 role
async function getCw2ApplicationsHistory(client, user, { award_type, search, limitInt, offset }) {
  const approvalField = user.cw2_type === "mo" ? "is_mo_approved" : user.cw2_type === "ol" ? "is_ol_approved" : null;
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
  allApps = await attachFdsToApplications(allApps);

  if (award_type) {
    allApps = allApps.filter((app) => app.fds?.award_type?.toLowerCase() === award_type.toLowerCase());
  }
  if (search) {
    const normalize = (s) => s?.toLowerCase().replace(/[\s-]/g, "");
    const searchNorm = normalize(search);
    allApps = allApps.filter((app) => app.id.toString().toLowerCase().includes(searchNorm) || normalize(app.fds?.cycle_period || "").includes(searchNorm));
  }

  const meta = {
    totalItems: allApps.length,
    currentPage: Math.ceil((offset + 1) / limitInt),
    itemsPerPage: limitInt,
    totalPages: Math.ceil(allApps.length / limitInt),
  };
  return { data: allApps, meta };
}

// Helpers for getAllApplications to reduce complexity
const ensureProfileComplete = (unit, roleLc) => {
  const requirements = {
    unit: ["bde", "div", "corps", "comd", "name"],
    brigade: ["div", "corps", "comd", "name"],
    division: ["corps", "comd", "name"],
    corps: ["comd", "name"],
    command: ["name"],
  };
  const required = requirements[roleLc] || [];
  const missing = required.filter((f) => !unit?.[f] || unit[f] === "");
  if (missing.length > 0) throw new Error("Please complete your unit profile before proceeding.");
};

const computeUnitIdsForRole = async (client, roleLc, unit, master) => {
  if (roleLc === "headquarter") {
    const res = await client.query(`SELECT unit_id FROM Unit_tab`);
    return res.rows.map((r) => r.unit_id);
  }
  if (roleLc === "unit") return [unit.unit_id];

  const byRole = {
    brigade: { field: "brigade_id" },
    division: { field: "division_id" },
    corps: { field: "corps_id" },
    command: { field: "command_id" },
  };
  const meta = byRole[roleLc];
  if (!meta || !master?.id) return [];
  const res = await client.query(
    `SELECT unit_id FROM Unit_tab WHERE ${meta.field} = $1`,
    [master.id]
  );
  return res.rows.map((r) => r.unit_id);
};

const buildBaseFiltersForRole = (roleLc) => `unit_id = ANY($1) AND status_flag != 'draft'`;

const mapAppUnitFields = (rows) =>
  rows.map((app) => ({
    ...app,
    unit_name: app.unit_details?.name || "Unknown Unit",
    unit_sos_no: app.unit_details?.sos_no || null,
    unit_type: app.unit_details?.unit_type || null,
    unit_location: app.unit_details?.location || null,
  }));

const applyFilters = (apps, filters) => {
  const normalize = (s) => s?.toLowerCase().replace(/[\s-]/g, "");
  const { award_type, command_type, corps_type, division_type, brigade_type, search } = filters;
  let res = apps;
  if (award_type) res = res.filter((a) => a.fds?.award_type?.toLowerCase() === award_type.toLowerCase());
  if (command_type) res = res.filter((a) => a.fds?.command?.toLowerCase() === command_type.toLowerCase());
  if (corps_type) res = res.filter((a) => a.fds?.corps?.toLowerCase() === corps_type.toLowerCase());
  if (division_type) res = res.filter((a) => a.fds?.division?.toLowerCase() === division_type.toLowerCase());
  if (brigade_type) res = res.filter((a) => a.fds?.brigade?.toLowerCase() === brigade_type.toLowerCase());
  if (search) {
    const q = normalize(search);
    res = res.filter((a) =>
      a.id.toString().toLowerCase().includes(q) ||
      normalize(a.fds?.cycle_period || "").includes(q) ||
      normalize(a.fds?.award_type || "").includes(q) ||
      normalize(a.fds?.brigade || "").includes(q) ||
      normalize(a.fds?.division || "").includes(q) ||
      normalize(a.fds?.corps || "").includes(q) ||
      normalize(a.fds?.command || "").includes(q) ||
      normalize(a.fds?.unit_type || "").includes(q) ||
      normalize(a.fds?.matrix_unit || "").includes(q) ||
      normalize(a.fds?.location || "").includes(q)
    );
  }
  return res;
};

const attachClarificationEntities = async (client, apps) => {
  const ids = [];
  apps.forEach((app) => app.fds?.parameters?.forEach((p) => p.clarification_id && ids.push(p.clarification_id)));
  if (ids.length === 0) return apps;
  const { rows } = await client.query(
    `SELECT * FROM Clarification_tab WHERE clarification_id = ANY($1)`,
    [ids]
  );
  const map = rows.reduce((acc, c) => {
    acc[c.clarification_id] = c;
    return acc;
  }, {});
  return apps.map((app) => ({
    ...app,
    fds: {
      ...app.fds,
      parameters:
        app.fds?.parameters?.map((p) =>
          p.clarification_id ? { ...p, clarification: map[p.clarification_id] || null } : p
        ) || [],
    },
  }));
};

const computeMarksForApps = (apps) =>
  apps.map((app) => {
    const parameters = app.fds?.parameters || [];
    const sumNonNegative = parameters.reduce((sum, p) => {
      if (p.negative === true) return sum;
      const hasApproved = p.approved_marks !== null && p.approved_marks !== undefined && p.approved_marks !== "" && !isNaN(Number(p.approved_marks)) && Number(p.approved_marks) > 0 && p.approved_by_user !== null;
      const m = hasApproved ? Number(p.approved_marks) : p.marks || 0;
      return sum + m;
    }, 0);
    const sumNegative = parameters.reduce((sum, p) => {
      if (p.negative !== true) return sum;
      const hasApproved = p.approved_marks !== null && p.approved_marks !== undefined && p.approved_marks !== "" && !isNaN(Number(p.approved_marks)) && Number(p.approved_marks) > 0 && p.approved_by_user !== null;
      const m = hasApproved ? Number(p.approved_marks) : p.marks || 0;
      return sum + m;
    }, 0);
    return {
      ...app,
      totalMarks: sumNonNegative,
      totalNegativeMarks: sumNegative,
      netMarks: sumNonNegative - sumNegative,
      fds: {
        ...app.fds,
        parameters: parameters.map((p) => {
          const cp = { ...p };
          delete cp.clarification;
          return cp;
        }),
      },
    };
  });

const normalizeLastApprovedRole = (app) => {
  let role = app.last_approved_by_role;
  if (app.is_ol_approved && app.is_mo_approved) role = "CW2";
  else if (app.is_mo_approved) role = "Mo";
  else if (app.is_ol_approved) role = "OL";
  else if (app.status_flag !== "draft" && !role) role = "brigade";
  else if (app.updatedRole == "brigade") role = "division";
  else if (app.updatedRole == "division") role = "corps";
  else if (app.updatedRole == "corps") role = "command";
  else if (app.updatedRole == "command") role = "MO/OL";
  return { ...app, last_approved_by_role: role };
};

const paginateList = (items, page, limit) => {
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const start = (pageInt - 1) * limitInt;
  const end = pageInt * limitInt;
  return {
    data: items.slice(start, end),
    meta: {
      totalItems: items.length,
      totalPages: Math.ceil(items.length / limitInt),
      currentPage: pageInt,
      itemsPerPage: limitInt,
    },
  };
};

exports.getAllApplications = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const { award_type, command_type, corps_type, division_type, brigade_type, search, page = 1, limit = 10 } = query;

    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;
    const master = profile?.data?.master;

    const roleLc = user_role.toLowerCase();
    ensureProfileComplete(unit, roleLc);

    const unitIds = await computeUnitIdsForRole(client, roleLc, unit, master);
    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "No applications found", [], { totalItems: 0 });
    }

    const baseFilters = buildBaseFiltersForRole(roleLc);
    const queryParams = [unitIds];

    const citationQuery = `
      SELECT c.citation_id AS id, 'citation' AS type, c.unit_id, row_to_json(u) AS unit_details, c.date_init, c.status_flag, c.is_mo_approved, c.mo_approved_at, c.is_ol_approved, c.last_rejected_by_role, c.ol_approved_at, c.last_approved_by_role, c.last_approved_at
      FROM Citation_tab c
      LEFT JOIN (
        SELECT unit_id, sos_no, name, adm_channel, tech_channel, unit_type, matrix_unit, location, awards, members, is_hr_review, is_dv_review, is_mp_review, created_at, updated_at
        FROM Unit_tab
      ) u ON c.unit_id = u.unit_id
      WHERE ${baseFilters.replace(/unit_id/g, 'c.unit_id')}
    `;
    const appreQuery = `
      SELECT a.appreciation_id AS id, 'appreciation' AS type, a.unit_id, row_to_json(u) AS unit_details, a.date_init, a.status_flag, a.is_mo_approved, a.mo_approved_at, a.last_rejected_by_role, a.is_ol_approved, a.ol_approved_at, a.last_approved_by_role, a.last_approved_at
      FROM Appre_tab a
      LEFT JOIN (
        SELECT unit_id, sos_no, name, adm_channel, tech_channel, unit_type, matrix_unit, location, awards, members, is_hr_review, is_dv_review, is_mp_review, created_at, updated_at
        FROM Unit_tab
      ) u ON a.unit_id = u.unit_id
      WHERE ${baseFilters.replace(/unit_id/g, 'a.unit_id')}
    `;

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, queryParams),
      client.query(appreQuery, queryParams),
    ]);

    let allApps = mapAppUnitFields([...citations.rows, ...appreciations.rows]);
    allApps = await attachFdsToApplications(allApps);
    allApps = await attachClarificationEntities(client, allApps);
    allApps = computeMarksForApps(allApps).map(normalizeLastApprovedRole);
    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
    allApps = applyFilters(allApps, { award_type, command_type, corps_type, division_type, brigade_type, search });

    const { data, meta } = paginateList(allApps, page, limit);
    return ResponseHelper.success(200, "Fetched all applications", data, meta);
  } catch (err) {
    return ResponseHelper.error(500, "Failed to fetch all applications", err.message);
  } finally {
    client.release();
  }
};


// Helpers to simplify getApplicationStats
const safeLen = (res) => (res && ((res.statusCode || res.status) === 200) && Array.isArray(res.data) ? res.data.length : 0);

const buildStatsSkeleton = () => ({
  totalApplications: 0,
  pendingApplications: 0,
  rejectedApplications: 0,
  finalisedApplications: 0,
  finalizedApprovedApplications: 0,
  approvedApplications: 0,
});

const gatherHeadquarterStats = async (user, q) => {
  const s = buildStatsSkeleton();
  const totalRes = await exports.getAllApplications(user, { ...q, page: 1, limit: 1000 });
  s.totalApplications = safeLen(totalRes);
  s.pendingApplications = safeLen({ ...totalRes, data: (totalRes?.data || []).filter((a) => (a.status_flag !== 'approved' && a.last_approved_by_role !== 'command') || a.status_flag === 'rejected') });
  s.rejectedApplications = safeLen({ ...totalRes, data: (totalRes?.data || []).filter((a) => a.status_flag === 'rejected') });
  const finalisedRes = await exports.listFinalisedApplications(user, { ...q, page: 1, limit: 1000 });
  s.finalisedApplications = safeLen(finalisedRes);
  const finalizedApprovedRes = await exports.listApprovedApplications(user, { ...q, page: 1, limit: 1000, isFinalized: true });
  s.finalizedApprovedApplications = safeLen(finalizedApprovedRes);
  s.approvedApplications = safeLen({ ...totalRes, data: (totalRes?.data || []).filter((a) => a.last_approved_by_role === 'command') });
  return s;
};

const gatherNonHQStats = async (user, q) => {
  const s = buildStatsSkeleton();
  const totalRes = await exports.getAllApplications(user, { ...q, page: 1, limit: 1000 });
  s.totalApplications = safeLen(totalRes);
  const pendRes = await exports.getApplicationsOfSubordinates(user, { page: 1, limit: 100, isGetNotClarifications: true });
  s.pendingApplications = safeLen(pendRes);
  const recRes = await exports.getApplicationsOfSubordinates(user, { page: 1, limit: 100, isShortlisted: true });
  s.approvedApplications = safeLen(recRes);
  const rejectRes = await exports.listRejectedApplications(user, { ...q, page: 1, limit: 1000 });
  s.rejectedApplications = safeLen(rejectRes);
  const finalisedRes = await exports.listFinalisedApplications(user, { ...q, page: 1, limit: 1000 });
  s.finalisedApplications = safeLen(finalisedRes);
  const finalizedApprovedRes = await exports.listApprovedApplications(user, { ...q, page: 1, limit: 1000, isFinalized: true });
  s.finalizedApprovedApplications = safeLen(finalizedApprovedRes);
  return s;
};

exports.getApplicationStats = async (user, _query) => {
  const client = await dbService.getClient();
  try {
    const roleLc = (user?.user_role || '').toLowerCase();
    const s = roleLc === 'headquarter'
      ? await gatherHeadquarterStats(user, _query)
      : await gatherNonHQStats(user, _query);

    const acceptedApplications = roleLc === 'headquarter' ? parseInt(s.approvedApplications || 0, 10) : (s.approvedApplications || 0);
    const totalPendingApplications = roleLc === 'headquarter' ? parseInt(s.pendingApplications || 0, 10) : (s.pendingApplications || 0);

    const finalResponse = {
      clarificationRaised: s.totalApplications || 0,
      totalPendingApplications,
      rejected: parseInt(s.rejectedApplications || 0, 10),
      approved: parseInt(s.finalisedApplications || 0, 10),
      shortlistedApplications: parseInt(s.finalisedApplications || 0, 10),
      finalizedApproved: parseInt(s.finalizedApprovedApplications || 0, 10),
      acceptedApplications,
    };

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
    const unitJoinSubquery = `
      SELECT 
        unit_id, sos_no, name, adm_channel, tech_channel, brigade_id, command_id,
        unit_type, matrix_unit, location, awards, members, is_hr_review, is_dv_review,
        is_mp_review, created_at, updated_at
      FROM Unit_tab
    `;

    const cleanedWhere = whereSql ? `WHERE ${whereSql.replace(/^\s*AND\s*/i, "")}` : "";

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
      LEFT JOIN (${unitJoinSubquery}) u ON c.unit_id = u.unit_id
      ${cleanedWhere}
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
      LEFT JOIN (${unitJoinSubquery}) u ON a.unit_id = u.unit_id
      ${cleanedWhere}
    `;

    const [citations, appreciations] = await Promise.all([
      client.query(citationQuery, params),
      client.query(appreQuery, params),
    ]);

    let allApps = [...citations.rows, ...appreciations.rows];
    allApps = await attachFdsToApplications(allApps);

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
      const totalMarks = parameters.reduce((sum, p) => {

        const isNegative = p.negative === true;
        if (isNegative) return sum;
        

        const hasApprovedMarks = p.approved_marks !== null && 
                                 p.approved_marks !== undefined && 
                                 p.approved_marks !== "" &&
                                 !isNaN(Number(p.approved_marks)) &&
                                 Number(p.approved_marks) > 0 &&
                                 p.approved_by_user !== null;
        
        const marksToUse = hasApprovedMarks ? Number(p.approved_marks) : (p.marks || 0);
        return sum + marksToUse;
      }, 0);
      const totalNegativeMarks = parameters.reduce((sum, p) => {

        const isNeg = p.negative === true;
        if (!isNeg) return sum;
        

        const hasApprovedMarks = p.approved_marks !== null && 
                                 p.approved_marks !== undefined && 
                                 p.approved_marks !== "" &&
                                 !isNaN(Number(p.approved_marks)) &&
                                 Number(p.approved_marks) > 0 &&
                                 p.approved_by_user !== null;
        
        const marksToUse = hasApprovedMarks ? Number(p.approved_marks) : (p.marks || 0);
        return sum + marksToUse;
      }, 0);
      const netMarks = totalMarks - totalNegativeMarks;


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


    allApps.sort((a, b) => new Date(b.date_init) - new Date(a.date_init));
    return allApps;
  } finally {
    client.release();
  }
}

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


    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    if (!unit) {
      return ResponseHelper.error(400, "User profile not found");
    }


    let unitIds = [];
    let whereClause = "";

    if (user_role.toLowerCase() === "headquarter") {

      whereClause = "";
    } else {

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

exports.listPendingApplications = async (user, query = {}) => {
  try {
    const client = await dbService.getClient();
    const { user_role } = user;
    const { page = 1, limit = 10 } = query;


    const profile = await AuthService.getProfile(user);
    const unit = profile?.data?.unit;

    if (!unit) {
      return ResponseHelper.error(400, "User profile not found");
    }


    let unitIds = [];
    let whereClause = `
      (last_approved_by_role IS DISTINCT FROM 'command')
      AND (status_flag IS DISTINCT FROM 'rejected')
    `;

    if (user_role.toLowerCase() === "headquarter") {

      whereClause = `
        (last_approved_by_role IS DISTINCT FROM 'command')
        AND (status_flag IS DISTINCT FROM 'rejected')
      `;
    } else {

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

exports.listRejectedApplications = async (user, query = {}) => {
  try {
    let allApps;

    if (user.user_role === "headquarter") {
      const whereSql = `status_flag = 'rejected'`;

      allApps = await loadApplications(whereSql, [], user);
    } else {

      if (['brigade', 'division', 'corps', 'command'].includes(user.user_role?.toLowerCase())) {

        const allApplicationsResult = await exports.getAllApplications(user, {
          ...query,
          page: 1,
          limit: 100000, // Fetch all to get accurate counts
        });

        if (!allApplicationsResult.success) {
          throw new Error(allApplicationsResult.message);
        }


        allApps = allApplicationsResult.data.filter(app => app.status_flag === 'rejected');
      } else {

        if (!user.unit_id) {
          return ResponseHelper.error(404, "Unit not found");
        }
        

      const unitRes = await dbService.query(
        `SELECT name FROM Unit_tab WHERE unit_id = $1`,
        [user.unit_id]
      );
      if (!unitRes.rows.length) {
        return ResponseHelper.error(404, "Unit not found");
      }
      const userComd = unitRes.rows[0].name;


      const whereSql = `status_flag = 'rejected' AND fds->>'command' = $1`;


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



    let whereSql = `is_mo_approved = true AND is_ol_approved = true AND (isFinalized = false OR isFinalized IS NULL)`;


    if (query.isFinalized !== undefined) {
      const finalized = query.isFinalized === "true" || query.isFinalized === true;
      whereSql = `is_mo_approved = true AND is_ol_approved = true AND isFinalized = ${finalized}`;
    }


    const allApps = await loadApplications(whereSql, [], user);


    const { data, meta } = paginate(allApps, query.page, query.limit);

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

exports.listApprovedApplications = async (user, query = {}) => {
  const client = await dbService.getClient();
  try {
    let whereSql = `last_approved_by_role = 'command'`;
    

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

// Helpers for getApplicationsSummary
const getUnitIdsForSummary = async (client, user) => {
  const role = (user?.user_role || '').toLowerCase();
  if (role === 'headquarter') {
    const res = await client.query(`SELECT unit_id FROM Unit_tab`);
    return res.rows.map((u) => u.unit_id);
  }
  if (role === 'unit' || user.is_special_unit) return [user.unit_id];
  const profile = await AuthService.getProfile(user);
  const master = profile?.data?.master;
  if (!master) return [];
  const map = {
    brigade: { idCol: 'brigade_id' },
    division: { idCol: 'division_id' },
    corps: { idCol: 'corps_id' },
    command: { idCol: 'command_id' },
  };
  const meta = map[role];
  if (!meta || !master[meta.idCol]) return [];
  const res = await client.query(`SELECT unit_id FROM Unit_tab WHERE ${meta.idCol} = $1`, [master[meta.idCol]]);
  return res.rows.map((u) => u.unit_id);
};

const buildSummaryWhere = (filters) => {
  const whereConditions = [`apps.unit_id = ANY($1)`];
  const params = [filters.unitIds];
  let idx = 1;
  const add = (cond, val) => { idx++; params.push(val); whereConditions.push(cond.replace(/\$idx/g, `$${idx}`)); };
  if (filters.award_type) add(`LOWER(apps.fds->>'award_type') = LOWER($idx)`, filters.award_type);
  if (filters.command_type) add(`LOWER(COALESCE(NULLIF(apps.fds->>'command',''), cm.command_name)) = LOWER($idx)`, filters.command_type);
  if (filters.corps_type) add(`LOWER(COALESCE(NULLIF(apps.fds->>'corps',''), cms.corps_name)) = LOWER($idx)`, filters.corps_type);
  if (filters.division_type) add(`LOWER(COALESCE(NULLIF(apps.fds->>'division',''), dm.division_name)) = LOWER($idx)`, filters.division_type);
  if (filters.brigade_type) add(`LOWER(COALESCE(NULLIF(apps.fds->>'brigade',''), bm.brigade_name)) = LOWER($idx)`, filters.brigade_type);
  return { sql: whereConditions.join(' AND '), params };
};

exports.getApplicationsSummary = async (user, query) => {
  const client = await dbService.getClient();
  try {
    const { user_role } = user;
    const { award_type, command_type, corps_type, division_type, brigade_type, search, group_by = "arms_service" } = query || {};

    const unitIds = await getUnitIdsForSummary(client, user);
    if (unitIds.length === 0) {
      return ResponseHelper.success(200, "Applications grouped", { x: [], y: [] });
    }

    const { sql: whereSql, params } = buildSummaryWhere({ unitIds, award_type, command_type, corps_type, division_type, brigade_type });
    let whereConditions = [whereSql];
    let paramIndex = params.length;
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


    const { rows } = await client.query(sql, params);
    const x = rows.map((r) => r.label);
    const y = rows.map((r) => Number(r.total));


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


    for (const app of applicationsForFinalized) {
      
      if (app.type === "citation") {
        await client.query(
          `UPDATE Citation_tab 
           SET isFinalized = true 
           WHERE citation_id = $1`,
          [app.id]
        );
      } else if (app.type === "appre" || app.type === "appreciation") {
        await client.query(
          `UPDATE Appre_tab 
           SET isFinalized = true 
           WHERE appreciation_id = $1`,
          [app.id]
        );
      }
    }

    await client.query("COMMIT");

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
