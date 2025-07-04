import React, { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { IoMdCheckmark } from "react-icons/io";
import { SVGICON } from "../../../constants/iconsList";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import {
  addApplicationComment,
  approveMarks,
  fetchApplicationUnitDetail,
  updateApplication,
} from "../../../reduxToolkit/services/application/applicationService";
import { updateClarification } from "../../../reduxToolkit/services/clarification/clarificationService";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import UnitClarificationModal from "../../../modals/UnitClarificationModal";
import ReqClarificationModal from "../../../modals/ReqClarificationModal";
import Loader from "../../../components/ui/loader/Loader";
import { baseURL } from "../../../reduxToolkit/helper/axios";
import { useDebounce } from "../../../hooks/useDebounce";
import ReviewCommentModal from "../../../modals/ReviewCommentModal";
import ViewCreatedClarificationModal from "../../../modals/ViewCreatedClarificationModal";
import toast from "react-hot-toast";

const ApplicationDetails = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { application_id } = useParams();

  const profile = useAppSelector((state) => state.admin.profile);
  const { loading, unitDetail } = useAppSelector((state) => state.application);

  const [remarksError, setRemarksError] = useState<string | null>(null);

  const raisedParam = searchParams.get("raised_clarifications");

  const isRaisedScreen = raisedParam === "true";
  // States
  const [clarificationShow, setClarificationShow] = useState(false);
  const [clarificationType, setClarificationType] =
    useState<string>("appreciation");
  const [clarificationApplicationId, setClarificationApplicationId] =
    useState<number>(0);
  const [clarificationParameterName, setClarificationParameterName] =
    useState<string>("");
  const [clarificationDocForView, setClarificationDocForView] = useState<
    string | null
  >(null);
  const [reviewCommentsData, setReviewCommentsData] = useState<any>(null);
  const [
    clarificationClarificationForView,
    setClarificationClarificationForView,
  ] = useState<string | null>(null);
  const [reviewerClarificationForView, setReviewerClarificationForView] =
    useState<string | null>(null);
  const [reqClarificationShow, setReqClarificationShow] = useState(false);
  const [reqViewCreatedClarificationShow, setReqViewCreatedClarificationShow] =
    useState(false);
  const [reviewCommentsShow, setReviewCommentsShow] = useState(false);
  const [isRefreshData, setIsRefreshData] = useState(false);
  const [approvedMarksState, setApprovedMarksState] = useState<
    Record<string, string>
  >({});
  const isUnitRole = ["unit", "cw2"].includes(profile?.user?.user_role || "");
  const isCW2Role = profile?.user?.user_role === "cw2";
  const isHeadquarter = profile?.user?.user_role === "headquarter";
  const roleHierarchy = ["unit", "brigade", "division", "corps", "command"];
  const role = profile?.user?.user_role?.toLowerCase() ?? "";
  const cw2_type = profile?.user?.cw2_type?.toLowerCase() ?? "";
  const lowerRole = roleHierarchy[roleHierarchy.indexOf(role) - 1] ?? null;
  const award_type = searchParams.get("award_type") || "";
  const numericAppId = Number(application_id);
  const [graceMarks, setGraceMarks] = useState("");

  useEffect(() => {
    if (award_type && numericAppId)
      dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
  }, [award_type, numericAppId, isRefreshData]);

  const [paramStats, setParamStats] = useState({
    totalParams: 0,
    filledParams: 0,
    marks: 0,
    approvedMarks: 0,
    totalMarks: 0,
  });

  const calculateParameterStats = (
    parameters: any[],
  ) => {
    const totalParams = parameters.length;

    const filledParams = parameters.filter(
      (param) =>
        (param.count ?? 0) > 0 || (param.marks ?? 0) > 0
    ).length;

    const marks = parameters.reduce((acc, param) => {
      const isRejected =
        param.clarification_details?.clarification_status === "rejected";

      return acc + (isRejected ? 0 : param.marks ?? 0);
    }, 0);

    const approvedMarks = parameters.reduce((acc, param) => {
      const isRejected =
        param.clarification_details?.clarification_status === "rejected";

      return acc + (isRejected ? 0 : Number(param.approved_marks ?? 0));
    }, 0);

    const totalParameterMarks = parameters.reduce((acc, param) => {
      const isRejected =
        param.clarification_details?.clarification_status === "rejected";

      if (isRejected) return acc;

      const hasValidApproved =
        param.approved_marks !== undefined &&
        param.approved_marks !== null &&
        param.approved_marks !== "" &&
        !isNaN(Number(param.approved_marks));

      const approved = hasValidApproved ? Number(param.approved_marks) : null;
      const original = param.marks ?? 0;

      return acc + (approved !== null ? approved : original);
    }, 0);

    const totalMarks = totalParameterMarks + Number(graceMarks ?? 0);

    return {
      totalParams,
      filledParams,
      marks,
      approvedMarks,
      totalMarks,
    };
  };

  useEffect(() => {
    const parameters = unitDetail?.fds?.parameters || [];

    const stats = calculateParameterStats(parameters);
    setParamStats(stats);
  }, [unitDetail, graceMarks]);

  const [commentsState, setCommentsState] = React.useState<Record<string, string>>({});
  const [localComment, setLocalComment] = useState(commentsState?.__application__ || "");

  useEffect(() => {
    if (unitDetail?.fds?.parameters && profile) {
      const initialMarks: Record<string, string> = {};
      const initialComments: Record<string, string> = {};

      unitDetail.fds.parameters.forEach((param: any) => {
        initialMarks[param.name] = param.approved_marks ?? "";

        const matchingComments = (param.comments || []).filter(
          (c: any) =>
            c.commented_by_role === profile?.user?.user_role &&
            c.commented_by_role_type === profile?.user?.cw2_type
        );

        if (matchingComments.length > 0) {
          const latest = matchingComments.reduce((a: any, b: any) =>
            new Date(a.commented_at) > new Date(b.commented_at) ? a : b
          );
          initialComments[param.name] = latest.comment || "";
        } else {
          initialComments[param.name] = "";
        }
      });

      setApprovedMarksState(initialMarks);
      setCommentsState(initialComments);
    }
  }, [unitDetail, profile]);

  const handleSave = async (paramName: string, marks: string) => {
    if (marks === undefined) return;

    const body = {
      type: unitDetail?.type || "citation",
      application_id: unitDetail?.id || 0,
      parameters: [{ name: paramName, approved_marks: marks }],
    };

    try {
      await dispatch(approveMarks(body)).unwrap();
      dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
      const updatedStats = calculateParameterStats(
        unitDetail?.fds?.parameters
      );
      setParamStats(updatedStats);
    } catch (err) {
      console.error("Failed to save approved marks:", err);
    }
  };

  // Create debounced version of handleSave
  const debouncedHandleSave = useDebounce(handleSave, 600);

  const handleInputChange = (paramName: string, value: string) => {
    setApprovedMarksState((prev) => ({ ...prev, [paramName]: value }));
    debouncedHandleSave(paramName, value); // this uses the updated handleSave
  };

  useEffect(() => {
    const grace = unitDetail?.fds?.applicationGraceMarks?.find(
      (entry: any) => entry.role?.toLowerCase() === role
    )?.marks;

    if (grace !== undefined) {
      setGraceMarks(grace.toString());
    }
  }, [unitDetail, role]);

  // const handleGraceMarksSave = (value: string) => {
  //   if (value === undefined) return;

  //   const body: any = {
  //     type: unitDetail?.type || "citation",
  //     application_id: unitDetail?.id || 0,
  //     applicationGraceMarks: Number(value),
  //   };

  //   dispatch(approveMarks(body)).unwrap();
  // };
  const [unitRemarks, setUnitRemarks] = useState("");

  // Set remark value when application is loaded or profile changes
  useEffect(() => {
    if (unitDetail?.remarks && Array.isArray(unitDetail?.remarks)) {
      const existing = unitDetail?.remarks.find(
        (r: any) => r.remark_added_by_role?.toLowerCase() === role
      );
      if (existing) {
        setUnitRemarks(existing.remarks || "");
      }
    }
  }, [unitDetail?.remarks, role]);

  const handleRemarksChange = async (e: any) => {
    const value = e.target.value;

    setUnitRemarks(value);

    if (value.length > 200) {
      setRemarksError("Remarks cannot exceed 200 characters.");
      return;
    } else {
      setRemarksError(null);
    }
    const body = {
      type: unitDetail?.type || "citation",
      application_id: unitDetail?.id || 0,
      remark: value,
      parameters: [],
    };

    try {
      await dispatch(approveMarks(body)).unwrap();
      // Optional: Add a toast or success indicator here
    } catch (err) {
      console.error("Failed to update remarks", err);
    }
  };
  // const debouncedGraceMarksSave = useDebounce(handleGraceMarksSave, 600);

  // const handleGraceMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   setGraceMarks(value);
  //   debouncedGraceMarksSave(value);
  // };

  const hierarchy = ["brigade", "division", "corps", "command", "headquarter"];
  const currentRoleIndex = hierarchy.indexOf(role?.toLowerCase());

  const lowerRoles = hierarchy.slice(0, currentRoleIndex); // roles below current role
  const roleMarksMap = unitDetail?.fds?.applicationGraceMarks || [];

  const displayedMarks = lowerRoles
    .map((r) => {
      const entry = roleMarksMap.find((e: any) => e.role?.toLowerCase() === r);
      return entry
        ? `Marks by ${r.charAt(0).toUpperCase() + r.slice(1)}: ${entry.marks}`
        : null;
    })
    .filter(Boolean);

  const handleSaveComment = (paramName: string, comment: string) => {
    if (!comment) return;

    const body: any = {
      type: unitDetail?.type || "citation",
      application_id: unitDetail?.id || 0,
    };

    // If paramName is "__application__", treat it as an application-level comment
    if (paramName === "__application__") {
      body.comment = comment;
    } else {
      body.parameters = [{ name: paramName, comment }];
    }

    dispatch(addApplicationComment(body))
      .unwrap()
      .catch(() => { });
  };

  // Helper function to update priority
  const handlePriorityChange = async (value: string) => {
    const priorityPoints = parseInt(value);

    if (isNaN(priorityPoints)) {
      toast.error("Please enter a valid number");
      return;
    }

    const body = {
      type: unitDetail?.type || "citation",
      application_id: unitDetail?.id || 0,
      applicationPriorityPoints: priorityPoints,
      parameters: [],
    };

    try {
      await dispatch(approveMarks(body)).unwrap();
      toast.success("Priority updated successfully");
    } catch (error) {
      toast.error("Failed to update priority");
    }
  };

  const debouncedHandleSaveComment = useDebounce(handleSaveComment, 600);

  const handleCommentChange = (paramName: string, value: string) => {
    setCommentsState((prev) => ({ ...prev, [paramName]: value }));
    debouncedHandleSaveComment(paramName, value);
  };

  useEffect(() => {
    if (unitDetail?.fds?.comments && Array.isArray(unitDetail.fds.comments)) {
      const existingComment = unitDetail.fds.comments.find(
        (c: any) => c.commented_by_role_type?.toLowerCase() === cw2_type
      );
      if (existingComment) {
        setCommentsState((prev) => ({
          ...prev,
          __application__: existingComment.comment,
        }));
        setLocalComment(existingComment.comment)
      }
    }
  }, [unitDetail?.fds?.comments, role]);

  // Show loader
  if (loading) return <Loader />;

  return (
    <>
      <div className="apply-citation-section">
        <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
          <Breadcrumb
            title={`Application ID: #${unitDetail?.id}`}
            paths={[
              { label: "Home", href: "/applications" },
              { label: "Applications", href: "/applications/list" },
              { label: "Application Details", href: "/applications/list/1" },
            ]}
          />
        </div>
        <div className="table-filter-area mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div
              className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
              style={{ minWidth: "150px" }}
            >
              <label className="form-label fw-semibold">Award Type</label>
              <p className="fw-5 mb-0">
                {unitDetail?.type
                  ? unitDetail.type.charAt(0).toUpperCase() +
                  unitDetail.type.slice(1)
                  : "--"}
              </p>
            </div>

            <div
              className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
              style={{ minWidth: "150px" }}
            >
              <label className="form-label fw-semibold">Cycle Period</label>
              <p className="fw-5 mb-0">
                {unitDetail?.fds?.cycle_period || "--"}
              </p>
            </div>

            <div
              className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
              style={{ minWidth: "150px" }}
            >
              <label className="form-label fw-semibold">Last Date</label>
              <p className="fw-5 mb-0">{unitDetail?.fds?.last_date || "--"}</p>
            </div>

            <div
              className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
              style={{ minWidth: "150px" }}
            >
              <label className="form-label fw-semibold">Command</label>
              <p className="fw-5 mb-0">{unitDetail?.fds?.command || "--"}</p>
            </div>

            <div
              className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
              style={{ minWidth: "150px" }}
            >
              <label className="form-label fw-semibold">Unit Name</label>
              <p className="fw-5 mb-0">{unitDetail?.unit_name || "--"}</p>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table-style-1 w-100">
            <thead>
              <tr>
                <th style={{ width: 150 }}>Parameter</th>
                <th style={{ width: 100 }}>Count</th>
                <th style={{ width: 100 }}>Marks</th>
                <th style={{ width: 100 }}>Document</th>
                {/* {isCW2Role && <th style={{ width: 100 }}>Drop comment</th>} */}
                {!isUnitRole && !isHeadquarter && (
                  <>
                    {!isRaisedScreen && (
                      <th style={{ width: 150 }}>Ask Clarification</th>
                    )}
                    {isRaisedScreen && (
                      <>
                        <th style={{ width: 200 }}>Approved Marks</th>
                        <th style={{ width: 200 }}>Requested Clarification</th>
                        <th style={{ width: 150 }}>Action</th>{" "}
                      </>
                    )}
                  </>
                )}

                {/* {isHeadquarter && (
                  <th style={{ width: 150 }}>Review comments</th>
                )} */}
              </tr>
            </thead>
            <tbody>
              {unitDetail?.fds?.parameters?.map((param: any, index: any) => (
                <tr key={index}>
                  <td style={{ width: 150 }}>
                    <p className="fw-5">{param.name}</p>
                  </td>
                  <td style={{ width: 100 }}>
                    <p className="fw-5">{param.count}</p>
                  </td>
                  <td style={{ width: 100 }}>
                    <p className="fw-5">{param.marks}</p>
                  </td>
                  <td style={{ width: 200 }}>
                    {param.upload ? (
                      <a
                        href={`${baseURL}${param.upload}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 18 }}
                      >
                        {/* {SVGICON.app.pdf} */}
                        <span style={{ fontSize: 14, wordBreak: 'break-word' }}>
                          {param?.upload?.split("/").pop()}
                        </span>
                      </a>
                    ) : (
                      ""
                    )}
                  </td>
                  {/* <td style={{ width: 200 }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter approved marks"
                            autoComplete="off"
                            value={param.marks}
                            readOnly
                        />
                    </td> */}
                  {/* {isCW2Role && (
                    <td style={{ width: 200 }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter comment"
                        autoComplete="off"
                        value={commentsState[param.name] ?? ""}
                        onChange={(e) =>
                          handleCommentChange(param.name, e.target.value)
                        }
                      />
                    </td>
                  )} */}
                  {!isUnitRole && !isHeadquarter && (
                    <>
                      {!isRaisedScreen && (
                        <td style={{ width: 120 }}>
                          {param?.clarification_id ||
                            (param?.last_clarification_id &&
                              [role, lowerRole].includes(
                                param?.last_clarification_handled_by
                              )) ? (
                            <button
                              className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                              onClick={() => {
                                setReqViewCreatedClarificationShow(true);
                                setReviewerClarificationForView(
                                  param?.clarification_details?.reviewer_comment
                                );
                              }}
                            >
                              {SVGICON.app.eye}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setClarificationType(unitDetail?.type); // or get dynamically from your data
                                setClarificationApplicationId(unitDetail?.id); // or appropriate id
                                setClarificationParameterName(param.name);
                                setClarificationDocForView(
                                  param?.clarification_details
                                    ?.clarification_doc
                                );
                                setClarificationClarificationForView(
                                  param?.clarification_details?.clarification
                                );
                                setClarificationShow(true);
                              }}
                              className="fw-5 text-decoration-underline bg-transparent border-0 "
                              style={{ fontSize: 14, color: "#0d6efd" }}
                            >
                              Ask Clarification
                            </button>
                          )}
                        </td>
                      )}

                      {isRaisedScreen && (
                        <>
                          {" "}
                          <td style={{ width: 200 }}>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter approved marks"
                              autoComplete="off"
                              value={
                                param?.clarification_details
                                  ?.clarification_status === "rejected"
                                  ? "0"
                                  : approvedMarksState[param.name] ?? ""
                              }
                              disabled={
                                param?.clarification_details
                                  ?.clarification_status === "rejected"
                              }
                              onChange={(e) =>
                                handleInputChange(param.name, e.target.value)
                              }
                            />
                          </td>
                          <td style={{ width: 200 }}>
                            {param?.clarification_details?.clarification ? (
                              <button
                                className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                onClick={() => {
                                  setReqClarificationShow(true);
                                  setClarificationDocForView(
                                    param?.clarification_details
                                      ?.clarification_doc
                                  );
                                  setClarificationClarificationForView(
                                    param?.clarification_details?.clarification
                                  );
                                }}
                              >
                                {SVGICON.app.eye}
                              </button>
                            ) : (
                              ""
                            )}
                          </td>
                          <td style={{ width: 150 }}>
                            {param?.clarification_details?.clarification &&
                              param?.clarification_details?.clarification_id ? (
                              param?.clarification_details
                                ?.clarification_status === "pending" ? (
                                <div className="d-flex gap-3">
                                  {/* APPROVE */}
                                  <button
                                    className="action-btn bg-transparent d-flex align-items-center justify-content-center"
                                    style={{ color: "var(--green-default)" }}
                                    onClick={() => {
                                      dispatch(
                                        updateClarification({
                                          id: param?.clarification_details
                                            ?.clarification_id,
                                          clarification_status: "clarified",
                                        })
                                      ).then(() => {
                                        setIsRefreshData((prev) => !prev);
                                      });
                                    }}
                                  >
                                    <IoMdCheckmark />
                                  </button>

                                  {/* REJECT */}
                                  <button
                                    className="action-btn bg-transparent d-flex align-items-center justify-content-center"
                                    style={{ color: "var(--red-default)" }}
                                    onClick={() => {
                                      dispatch(
                                        updateClarification({
                                          id: param?.clarification_details
                                            ?.clarification_id,
                                          clarification_status: "rejected",
                                        })
                                      ).then(() => {
                                        setIsRefreshData((prev) => !prev);
                                      });
                                    }}
                                  >
                                    <MdClose />
                                  </button>
                                </div>
                              ) : (
                                // Show status text with first letter capitalized
                                <span className="text-capitalize">
                                  <p className="fw-5">
                                    {" "}
                                    {param?.clarification_details?.clarification_status.toUpperCase()}
                                  </p>
                                </span>
                              )
                            ) : (
                              ""
                            )}
                          </td>{" "}
                        </>
                      )}
                    </>
                  )}
                  {/* {isHeadquarter && (
                    <td style={{ width: 150 }}>
                      {Array.isArray(param?.comments) &&
                      param.comments.length > 0 ? (
                        <div className="d-flex gap-3">
                          <button
                            className="action-btn bg-transparent d-flex align-items-center justify-content-center"
                            style={{ color: "var(--green-default)" }}
                            onClick={() => {
                              setReviewCommentsShow(true);
                              setReviewCommentsData(param?.comments);
                            }}
                          >
                            {SVGICON.app.eye}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </td>
                  )} */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isUnitRole && (
          <>
            <ul
              style={{
                listStyleType: "none",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                padding: 0,
                marginBottom: "16px"
              }}
            >
              {/* Unit Remark */}
              {unitDetail?.fds?.unitRemarks && (
                <li
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#e8f0fe",
                    borderRadius: "6px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    fontSize: "14px",
                    color: "#333"
                  }}
                >
                  <strong>Unit:</strong> {unitDetail.fds.unitRemarks}
                </li>
              )}

              {/* Other Remarks */}
              {Array.isArray(unitDetail?.remarks) &&
                unitDetail.remarks.map((item: any, idx: number) => (
                  <li
                    key={idx}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "6px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      fontSize: "14px",
                      color: "#333"
                    }}
                  >
                    <strong>{item?.remark_added_by_role}:</strong> {item?.remarks}
                  </li>
                ))}
            </ul>
          </>
        )}

        {!isUnitRole && (
          <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: '20px', paddingBottom: '20px' }}>
            <div className="row text-center text-sm-start mb-3">
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Filled Params:</span>
                <div className="fw-bold">{paramStats.filledParams}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Marks:</span>
                <div className="fw-bold">{paramStats.marks}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Approved Marks:</span>
                <div className="fw-bold text-primary">
                  {paramStats.approvedMarks}
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Total Marks:</span>
                <div className="fw-bold text-success">
                  {paramStats.totalMarks}
                </div>
              </div>
            </div>

            {/* Grace Marks Field */}
            {!isHeadquarter && (
              <div className="w-100 mb-4">
                <label
                  className="fw-medium text-muted mb-2"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Enter Your Remarks:
                </label>
                <textarea
                  className="form-control"
                  placeholder="Enter remarks (max 200 characters)"
                  name="unitRemarks"
                  value={unitRemarks}
                  onChange={handleRemarksChange}
                  rows={4}
                />
                {remarksError && <p className="error-text">{remarksError}</p>}
              </div>
            )}
            {profile?.unit?.members &&
              Array.isArray(profile.unit.members) &&
              profile.unit.members.filter(m => m.digital_sign && m.digital_sign.trim() !== "").length > 0 && (
                <div className="table-responsive mb-3">
                  <label
                    className="fw-medium text-muted mb-2"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Submit Signatures:
                  </label>
                  <table className="table-style-1 w-100">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "25%" }}>Member</th>
                        <th style={{ width: "25%" }}>Name</th>
                        <th style={{ width: "25%" }}>Rank</th>
                        <th style={{ width: "25%" }}>Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...profile.unit.members
                          .filter(
                            m => m.member_type === "member_officer" && m.digital_sign && m.digital_sign.trim() !== ""
                          )
                          .sort(
                            (a, b) => Number(a.member_order || 0) - Number(b.member_order || 0)
                          ),
                        ...profile.unit.members
                          .filter(
                            m => m.member_type === "presiding_officer" && m.digital_sign && m.digital_sign.trim() !== ""
                          )
                      ].map((member) => (
                        <tr key={member.id}>
                          <td>
                            {member.member_type === "presiding_officer"
                              ? "Presiding Officer"
                              : "Member Officer"}
                          </td>
                          <td>{member.name || "-"}</td>
                          <td>{member.rank || "-"}</td>
                          <td>
                            <button
                              type="button"
                              className="_btn success"
                              onClick={() => alert(`Signature clicked for ${member.name}`)}
                            >
                              Add Signature
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>
              )}
            <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-1 justify-content-end">
              {/* Approved by roles below */}
              {displayedMarks.length > 0 && (
                <div className="text-muted small me-auto align-self-center">
                  {displayedMarks.join(" | ")}
                </div>
              )}

              {!isHeadquarter && (
                <>
                  {/* <div className="d-flex align-items-center gap-2">
                    <label
                      className="fw-medium text-muted mb-0"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      Discretionary Points:
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter discretionary points"
                      style={{ maxWidth: "200", minWidth: 200 }}
                      value={graceMarks}
                      onChange={handleGraceMarksChange}
                    />
                  </div> */}
                  <button
                    type="button"
                    className="_btn success"
                    onClick={() => {
                      // if (graceMarks === "" || graceMarks === null || isNaN(Number(graceMarks))) {
                      //   toast.error("Please enter Discretionary Points before approving.");
                      //   return;
                      // }

                      dispatch(
                        updateApplication({
                          id: unitDetail?.id,
                          type: unitDetail?.type,
                          status: "shortlisted_approved",
                        })
                      ).then(() => {
                        navigate("/applications/list");
                      });
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="_btn danger"
                    onClick={() => {
                      dispatch(
                        updateApplication({
                          id: unitDetail?.id,
                          type: unitDetail?.type,
                          status: "rejected",
                        })
                      ).then(() => {
                        navigate("/applications/list");
                      });
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
              {isHeadquarter && (
                <>
                  <button
                    type="button"
                    className="_btn success"
                    onClick={() => {
                      setReviewCommentsShow(true);
                      setReviewCommentsData(unitDetail?.fds?.comments);
                    }}
                  >
                    Review Comments
                  </button>
                </>
              )}

            </div>
          </div>
        )}

        {isCW2Role && (
          <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: '20px', paddingBottom: '20px' }}>
            {!isHeadquarter && (
              <>
                <div className="mb-2">
                  <label className="form-label mb-1">Priority:</label>
                  <input type="text" className="form-control" name="priority"
                    onChange={(e) => {
                      const value = e.target.value;
                      handlePriorityChange(value);
                    }} />
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleCommentChange("__application__", localComment);
                }}>
                  <label className="form-label mb-1">Drop Comment:</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter comment"
                    rows={4}
                    value={localComment}
                    onChange={(e) => setLocalComment(e.target.value)}
                  />
                  <div className="d-flex align-items-center justify-content-end mt-2">
                    <button type="submit" className="_btn success" >Submit</button>
                  </div>
                </form>
              </>
            )}
            {profile?.unit?.members &&
              Array.isArray(profile.unit.members) &&
              profile.unit.members.filter(m => m.digital_sign && m.digital_sign.trim() !== "").length > 0 && (
                <div className="table-responsive mb-3">
                  <label
                    className="fw-medium text-muted mb-2"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Submit Signatures:
                  </label>
                  <table className="table-style-1 w-100">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "25%" }}>Member</th>
                        <th style={{ width: "25%" }}>Name</th>
                        <th style={{ width: "25%" }}>Rank</th>
                        <th style={{ width: "25%" }}>Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...profile.unit.members
                          .filter(
                            m => m.member_type === "member_officer" && m.digital_sign && m.digital_sign.trim() !== ""
                          )
                          .sort(
                            (a, b) => Number(a.member_order || 0) - Number(b.member_order || 0)
                          ),
                        ...profile.unit.members
                          .filter(
                            m => m.member_type === "presiding_officer" && m.digital_sign && m.digital_sign.trim() !== ""
                          )
                      ].map((member) => (
                        <tr key={member.id}>
                          <td>
                            {member.member_type === "presiding_officer"
                              ? "Presiding Officer"
                              : "Member Officer"}
                          </td>
                          <td>{member.name || "-"}</td>
                          <td>{member.rank || "-"}</td>
                          <td>
                            <button
                              type="button"
                              className="_btn success"
                              onClick={() => alert(`Signature clicked for ${member.name}`)}
                            >
                              Add Signature
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>
              )}
          </div>
        )}
      </div>
      <UnitClarificationModal
        show={clarificationShow}
        handleClose={() => setClarificationShow(false)}
        type={clarificationType}
        application_id={clarificationApplicationId}
        parameter_name={clarificationParameterName}
        setIsRefreshData={setIsRefreshData}
        isRefreshData={isRefreshData}
      />
      <ReqClarificationModal
        show={reqClarificationShow}
        handleClose={() => setReqClarificationShow(false)}
        clarification_doc={clarificationDocForView}
        clarification={clarificationClarificationForView}
      />
      <ViewCreatedClarificationModal
        show={reqViewCreatedClarificationShow}
        handleClose={() => setReqViewCreatedClarificationShow(false)}
        reviewer_comment={reviewerClarificationForView}
      />
      <ReviewCommentModal
        show={reviewCommentsShow}
        handleClose={() => setReviewCommentsShow(false)}
        reviewCommentsData={reviewCommentsData}
      />
    </>
  );
};

export default ApplicationDetails;
