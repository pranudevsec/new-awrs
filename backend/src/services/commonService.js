const dbService = require("../utils/postgres/dbService");
const { approveApplicationMarks } = require("./ApplicationService");

exports.attachFdsToApplications = async (applications) => {
  const client = await dbService.getClient();

  try {
    const applicationIds = applications.map((app) => app.id);
    if (!applicationIds.length) return applications;

    // STEP 1: Fetch all FDS for applications
    const fdsRes = await client.query(
      `SELECT * FROM fds WHERE application_id = ANY($1)`,
      [applicationIds]
    );

    const fdsMap = {};
    const fdsIds = [];
    fdsRes.rows.forEach((fds) => {
      if (!fdsMap[fds.application_id]) fdsMap[fds.application_id] = [];
      fdsMap[fds.application_id].push(fds);
      fdsIds.push(fds.fds_id);
    });

    if (!fdsIds.length) return applications;

    // STEP 2: Fetch parameters
    const paramsRes = await client.query(
      `SELECT fp.*, pm.description, pm.category, pm.subcategory, pm.subsubcategory, pm.name AS param_name, pm.negative, pm.per_unit_mark, pm.max_marks
       FROM fds_parameters fp
       JOIN parameter_master pm ON fp.param_id = pm.param_id
       WHERE fp.fds_id = ANY($1)`,
      [fdsIds]
    );

    const paramsMap = {};
    paramsRes.rows.forEach((p) => {
      if (!paramsMap[p.fds_id]) paramsMap[p.fds_id] = [];
      paramsMap[p.fds_id].push({
        id: p.param_id.toString(),
        name: p.param_name,
        info: p.description,
        count: p.count,
        marks: p.marks,
        upload: p.upload || [],
        category: p.category,
        subcategory: p.subcategory,
        subsubcategory: p.subsubcategory,
        negative: p.negative,
        per_unit_mark: p.per_unit_mark,
        max_marks: p.max_marks,
        approved_count: p.approved_count || 0,
        approved_marks: p.approved_marks || 0,
        approved_marks_reason: p.approved_marks_reason || null,
        approved_marks_documents: p.approved_marks_documents || [],
        last_clarification_id: p.last_clarification_id || null,
        last_clarification_status: p.last_clarification_status || null,
        last_clarification_handled_by: p.last_clarification_handled_by || null,
        approved_by_user: p.approved_by_user || null,
        approved_by_role: p.approved_by_role || null,
        approved_marks_at: p.approved_marks_at || null,
        clarification_id: p.clarification_id || null,

      });
    });

    // STEP 3: Fetch awards
    const awardsRes = await client.query(
      `SELECT * FROM fds_awards WHERE fds_id = ANY($1)`,
      [fdsIds]
    );
    const awardsMap = {};
    awardsRes.rows.forEach((a) => {
      if (!awardsMap[a.fds_id]) awardsMap[a.fds_id] = [];
      awardsMap[a.fds_id].push({
        award_id: a.award_id,
        award_type: a.award_type,
        award_year: a.award_year,
        award_title: a.award_title,
      });
    });

    // STEP 4: Fetch accepted members
    const membersRes = await client.query(
      `SELECT * FROM fds_accepted_members WHERE fds_id = ANY($1)`,
      [fdsIds]
    );
    const membersMap = {};
    membersRes.rows.forEach((m) => {
      if (!membersMap[m.fds_id]) membersMap[m.fds_id] = [];
      membersMap[m.fds_id].push({
        member_id: m.member_id,
        name: m.name,
        ic_number: m.ic_number,
        member_type: m.member_type,
        is_signature_added: m.is_signature_added,
        sign_digest: m.sign_digest,
      });
    });

    // STEP 5: Fetch grace marks
    const graceRes = await client.query(
      `SELECT * FROM fds_grace_marks WHERE fds_id = ANY($1)`,
      [fdsIds]
    );
    const graceMap = {};
    graceRes.rows.forEach((g) => {
      if (!graceMap[g.fds_id]) graceMap[g.fds_id] = [];
      graceMap[g.fds_id].push({
        role: g.role,
        marksBy: g.marks_by,
        marksAddedAt: g.marks_added_at,
        marks: g.marks,
      });
    });

    // STEP 6: Fetch application priority
    const priorityRes = await client.query(
      `SELECT * FROM fds_application_priority WHERE fds_id = ANY($1)`,
      [fdsIds]
    );
    const priorityMap = {};
    priorityRes.rows.forEach((p) => {
      if (!priorityMap[p.fds_id]) priorityMap[p.fds_id] = [];
      priorityMap[p.fds_id].push({
        role: p.role,
        priority: p.priority,
        priorityAddedAt: p.priority_added_at,
        cw2_type: p.cw2_type,
      });
    });

    // STEP 7: Fetch comments (NEW)
    const commentsRes = await client.query(
      `SELECT * FROM fds_comments WHERE fds_id = ANY($1) ORDER BY commented_at ASC`,
      [fdsIds]
    );
    const commentsMap = {};
    commentsRes.rows.forEach((c) => {
      if (!commentsMap[c.fds_id]) commentsMap[c.fds_id] = [];
      commentsMap[c.fds_id].push({
        comment: c.comment,
        commented_by_role_type: c.commented_by_role_type,
        commented_by_role: c.commented_by_role,
        commented_at: c.commented_at,
        commented_by: c.commented_by,
      });
    });

    // STEP 8: Fetch master tables
    const [corpsRes, brigadeRes, divisionRes, commandRes, armsServiceRes] =
      await Promise.all([
        client.query(`SELECT * FROM corps_master`),
        client.query(`SELECT * FROM brigade_master`),
        client.query(`SELECT * FROM division_master`),
        client.query(`SELECT * FROM command_master`),
        client.query(`SELECT * FROM arms_service_master`),
      ]);

    const corpsMap = Object.fromEntries(
      corpsRes.rows.map((r) => [r.corps_id, r.corps_name])
    );
    const brigadeMap = Object.fromEntries(
      brigadeRes.rows.map((r) => [r.brigade_id, r.brigade_name])
    );
    const divisionMap = Object.fromEntries(
      divisionRes.rows.map((r) => [r.division_id, r.division_name])
    );
    const commandMap = Object.fromEntries(
      commandRes.rows.map((r) => [r.command_id, r.command_name])
    );
    const armsServiceMap = Object.fromEntries(
      armsServiceRes.rows.map((r) => [r.arms_service_id, r.arms_service_name])
    );

    // STEP 9: Attach FDS to applications
    return applications.map((app) => {
      const fdsList = fdsMap[app.id];
      if (!fdsList) return app;

      const fds = fdsList.find((f) => f.award_type === app.type);
      if (!fds) return app;

      return {
        ...app,
        fds: {
          corps: corpsMap[fds.corps_id] || null,
          brigade: brigadeMap[fds.brigade_id] || null,
          division: divisionMap[fds.division_id] || null,
          command: commandMap[fds.command_id] || null,
          location: fds.location,
          last_date: fds.last_date,
          unit_type: fds.unit_type,
          award_type: fds.award_type,
          matrix_unit: fds.matrix_unit,
          unitRemarks: fds.unit_remarks,
          arms_service: armsServiceMap[fds.arms_service_id] || null,
          cycle_period: fds.cycle_period,
          parameters: paramsMap[fds.fds_id] || [],
          awards: awardsMap[fds.fds_id] || [],
          accepted_members: membersMap[fds.fds_id] || [],
          applicationGraceMarks: graceMap[fds.fds_id] || [],
          applicationPriority: priorityMap[fds.fds_id] || [],
          comments: commentsMap[fds.fds_id] || [], //  Added
        },
      };
    });
  } catch (err) {
    console.error("Error in attachFdsToApplications:", err);
    throw err;
  } finally {
    client.release();
  }
};

exports.attachSingleFdsToApplication = async (application) => {
  if (!application) return application;
  const client = await dbService.getClient();

  try {
    const appId =
      application.id || application.citation_id || application.appreciation_id;

    // STEP 1: Fetch FDS
    const fdsRes = await client.query(
      `SELECT * FROM fds WHERE application_id = $1`,
      [appId]
    );
    const fds = fdsRes.rows[0];
    if (!fds) return application;

    const fdsId = fds.fds_id;

    // STEP 2: Fetch parameters
    const paramsRes = await client.query(
      `SELECT fp.*, pm.description, pm.category, pm.subcategory, pm.subsubcategory, pm.name AS param_name, pm.negative, pm.per_unit_mark, pm.max_marks
       FROM fds_parameters fp
       JOIN parameter_master pm ON fp.param_id = pm.param_id
       WHERE fp.fds_id = $1`,
      [fdsId]
    );

    const parameters = paramsRes.rows.map((p) => ({
      id: p.param_id.toString(),
      name: p.param_name,
      info: p.description,
      count: p.count,
      marks: p.marks,
      upload: p.upload || [],
      category: p.category,
      subcategory: p.subcategory,
      subsubcategory: p.subsubcategory,
      negative: p.negative,
      per_unit_mark: p.per_unit_mark,
      max_marks: p.max_marks,
      approved_count: p.approved_count || 0,
      approved_marks: p.approved_marks || 0,
      approved_marks_reason: p.approved_marks_reason || null,
      approved_marks_documents: p.approved_marks_documents || [],
      last_clarification_id: p.last_clarification_id || null,
      last_clarification_status: p.last_clarification_status || null,
      last_clarification_handled_by: p.last_clarification_handled_by || null,
      approved_by_user: p.approved_by_user || null,
      approved_by_role: p.approved_by_role || null,
      approved_marks_at: p.approved_marks_at || null,
      clarification_id: p.clarification_id || null,
      info: `1 ${p.param_name} = ${p.per_unit_mark} marks (Max ${p.max_marks} marks)`,
    }));

    // STEP 3: Fetch awards
    const awardsRes = await client.query(
      `SELECT * FROM fds_awards WHERE fds_id = $1`,
      [fdsId]
    );
    const awards = awardsRes.rows.map((a) => ({
      award_id: a.award_id,
      award_type: a.award_type,
      award_year: a.award_year,
      award_title: a.award_title,
    }));

    // STEP 4: Fetch accepted members
    const membersRes = await client.query(
      `SELECT * FROM fds_accepted_members WHERE fds_id = $1`,
      [fdsId]
    );
    const accepted_members = membersRes.rows.map((m) => ({
      member_id: m.member_id,
      name: m.name,
      ic_number: m.ic_number,
      member_type: m.member_type,
      is_signature_added: m.is_signature_added,
      sign_digest: m.sign_digest,
    }));

    // STEP 5: Fetch grace marks
    const graceMarksRes = await client.query(
      `SELECT * FROM fds_grace_marks WHERE fds_id = $1`,
      [fdsId]
    );
    const applicationGraceMarks = graceMarksRes.rows.map((g) => ({
      role: g.role,
      marksBy: g.marks_by,
      marksAddedAt: g.marks_added_at,
      marks: g.marks,
    }));

    // STEP 6: Fetch application priority
    const priorityRes = await client.query(
      `SELECT * FROM fds_application_priority WHERE fds_id = $1`,
      [fdsId]
    );
    const applicationPriority = priorityRes.rows.map((p) => ({
      role: p.role,
      priority: p.priority,
      priorityAddedAt: p.priority_added_at,
      cw2_type: p.cw2_type,
    }));

    // STEP 7: Fetch master tables
    const [corpsRes, brigadeRes, divisionRes, commandRes, armsServiceRes] =
      await Promise.all([
        client.query(`SELECT * FROM corps_master WHERE corps_id = $1`, [
          fds.corps_id,
        ]),
        client.query(`SELECT * FROM brigade_master WHERE brigade_id = $1`, [
          fds.brigade_id,
        ]),
        client.query(`SELECT * FROM division_master WHERE division_id = $1`, [
          fds.division_id,
        ]),
        client.query(`SELECT * FROM command_master WHERE command_id = $1`, [
          fds.command_id,
        ]),
        client.query(
          `SELECT * FROM arms_service_master WHERE arms_service_id = $1`,
          [fds.arms_service_id]
        ),
      ]);

    const corps = corpsRes.rows[0]?.corps_name || null;
    const brigade = brigadeRes.rows[0]?.brigade_name || null;
    const division = divisionRes.rows[0]?.division_name || null;
    const command = commandRes.rows[0]?.command_name || null;
    const arms_service = armsServiceRes.rows[0]?.arms_service_name || null;

    // STEP 8: Fetch remarks
    const remarksRes = await client.query(
      `SELECT remarks, remark_added_by_role, remark_added_by, remark_added_at
       FROM application_remarks
       WHERE application_id = $1 AND type = $2
       ORDER BY remark_added_at ASC`,
      [appId, application.type || application.award_type || "citation"]
    );
    const remarks = remarksRes.rows || [];

    //  STEP 9: Fetch comments from fds_comments
    const commentsRes = await client.query(
      `SELECT comment, commented_by, commented_by_role, commented_by_role_type, commented_at
       FROM fds_comments
       WHERE fds_id = $1
       ORDER BY commented_at ASC`,
      [fdsId]
    );

    const comments = commentsRes.rows.map((c) => ({
      comment: c.comment,
      commented_by_role_type: c.commented_by_role_type,
      commented_by_role: c.commented_by_role,
      commented_at: c.commented_at,
      commented_by: c.commented_by,
    }));

    // STEP 10: Combine all into final response
    return {
      ...application,
      fds: {
        corps,
        brigade,
        division,
        command,
        location: fds.location,
        last_date: fds.last_date,
        unit_type: fds.unit_type,
        award_type: fds.award_type,
        matrix_unit: fds.matrix_unit,
        unitRemarks: fds.unit_remarks,
        arms_service,
        cycle_period: fds.cycle_period,
        parameters,
        awards,
        accepted_members,
        applicationGraceMarks,
        applicationPriority,
        comments, //  now attached from fds_comments table
      },
      remarks,
    };
  } catch (err) {
    console.error("Error in attachSingleFdsToApplication:", err);
    throw err;
  } finally {
    client.release();
  }
};
