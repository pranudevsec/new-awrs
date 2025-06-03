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

const ApplicationDetails = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { application_id } = useParams();

  const profile = useAppSelector((state) => state.admin.profile);
  const { loading, unitDetail } = useAppSelector((state) => state.application);

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
  const [reqClarificationShow, setReqClarificationShow] = useState(false);
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
  const lowerRole = roleHierarchy[roleHierarchy.indexOf(role) - 1] ?? null;
  const award_type = searchParams.get("award_type") || "";
  const numericAppId = Number(application_id);

  useEffect(() => {
    if (award_type && numericAppId)
      dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
  }, [award_type, numericAppId, isRefreshData]);

  const parameters = unitDetail?.fds?.parameters || [];
  const totalParams = parameters.length;
  const filledParams = parameters.filter(
    (param: any) => (param.count ?? 0) > 0 || (param.marks ?? 0) > 0
  ).length;
  const negativeMarks = parameters.reduce((acc: any, param: any) => {
    return (param.marks ?? 0) < 0 ? acc + (param.marks ?? 0) : acc;
  }, 0);
  const totalMarks = parameters.reduce(
    (acc: any, param: any) => acc + (param.marks ?? 0),
    0
  );

  const [commentsState, setCommentsState] = React.useState<
    Record<string, string>
  >({});

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

  const handleSave = (paramName: string, marks: string) => {
    if (marks === undefined) return;

    const body = {
      type: unitDetail?.type || "citation",
      application_id: unitDetail?.id || 0,
      parameters: [{ name: paramName, approved_marks: marks }],
    };

    dispatch(approveMarks(body)).unwrap();
  };

  // Create debounced version of handleSave
  const debouncedHandleSave = useDebounce(handleSave, 600);

  const handleInputChange = (paramName: string, value: string) => {
    setApprovedMarksState((prev) => ({ ...prev, [paramName]: value }));
    debouncedHandleSave(paramName, value); // <-- pass value here directly
  };

  const [graceMarks, setGraceMarks] = useState("");

  useEffect(() => {
    const grace = unitDetail?.fds?.applicationGraceMarks?.find(
      (entry: any) => entry.role?.toLowerCase() === role
    )?.marks;

    if (grace !== undefined) {
      setGraceMarks(grace.toString());
    }
  }, [unitDetail, role]);

  const handleGraceMarksSave = (value: string) => {
    if (value === undefined) return;

    const body: any = {
      type: unitDetail?.type || "citation",
      application_id: unitDetail?.id || 0,
      applicationGraceMarks: Number(value),
    };

    dispatch(approveMarks(body)).unwrap();
  };

  const debouncedGraceMarksSave = useDebounce(handleGraceMarksSave, 600);

  const handleGraceMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGraceMarks(value);
    debouncedGraceMarksSave(value);
  };

  const hierarchy = ["brigade", "division", "corps", "command","headquarter"];
  const currentRoleIndex = hierarchy.indexOf(role?.toLowerCase());

  const lowerRoles = hierarchy.slice(0, currentRoleIndex); // roles below current role
  const roleMarksMap = unitDetail?.fds?.applicationGraceMarks || [];

  const displayedMarks = lowerRoles
    .map((r) => {
      const entry = roleMarksMap.find((e: any) => e.role?.toLowerCase() === r);
      return entry
        ? `${r.charAt(0).toUpperCase() + r.slice(1)}: ${entry.marks}`
        : null;
    })
    .filter(Boolean);

  const handleSaveComment = (paramName: string, comment: string) => {
    if (!comment) return;

    const body: any = {
      type: unitDetail?.type || "citation",
      application_id: unitDetail?.id || 0,
      parameters: [{ name: paramName, comment }],
    };

    dispatch(addApplicationComment(body))
      .unwrap()
      .catch(() => {});
  };

  const debouncedHandleSaveComment = useDebounce(handleSaveComment, 600);

  const handleCommentChange = (paramName: string, value: string) => {
    setCommentsState((prev) => ({ ...prev, [paramName]: value }));
    debouncedHandleSaveComment(paramName, value);
  };
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
              { label: "Application Listing", href: "/applications/list" },
              { label: "Details", href: "/applications/list/1" },
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
                {isCW2Role && <th style={{ width: 100 }}>Drop comment</th>}
                {!isUnitRole ||
                  (isHeadquarter && (
                    <>
                      <th style={{ width: 200 }}>Approved Marks</th>
                      <th style={{ width: 150 }}>Add Clarification</th>
                      <th style={{ width: 200 }}>Requested Clarification</th>
                      <th style={{ width: 150 }}>Action</th>
                    </>
                  ))}
                {isHeadquarter && (
                  <th style={{ width: 150 }}>Review comments</th>
                )}
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
                  <td style={{ width: 100 }}>
                    {param.upload ? (
                      <a
                        href={`${baseURL}${param.upload}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 18 }}
                      >
                        {SVGICON.app.pdf}
                      </a>
                    ) : (
                      "--"
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
                  {isCW2Role && (
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
                  )}
                  {!isUnitRole ||
                    (isHeadquarter && (
                      <>
                        <td style={{ width: 200 }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter approved marks"
                            autoComplete="off"
                            value={approvedMarksState[param.name] ?? ""}
                            onChange={(e) =>
                              handleInputChange(param.name, e.target.value)
                            }
                          />
                        </td>

                        <td style={{ width: 120 }}>
                          {param?.clarification_id ||
                          (param?.last_clarification_id &&
                            [role, lowerRole].includes(
                              param?.last_clarification_handled_by
                            )) ? (
                            <p className="fw-5">Already Asked</p>
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
                            "--"
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
                            "--"
                          )}
                        </td>
                      </>
                    ))}
                  {isHeadquarter && (
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isUnitRole && (
          <div className="submit-button-wrapper">
            <div className="row text-center text-sm-start mb-3">
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Total Params:</span>
                <div className="fw-bold">{totalParams}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Filled Params:</span>
                <div className="fw-bold">{filledParams}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Negative Marks:</span>
                <div className="fw-bold text-danger">{negativeMarks}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Total Marks:</span>
                <div className="fw-bold text-success">{totalMarks}</div>
              </div>
            </div>

            {/* Grace Marks Field */}

            <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-1 justify-content-end">
              {/* Approved by roles below */}
              {displayedMarks.length > 0 && (
                <div className="text-muted small me-auto align-self-center">
                  <strong>Approved Grace Marks:</strong>{" "}
                  {displayedMarks.join(" | ")}
                </div>
              )}

              {!isHeadquarter && (
                <>
                  <div className="d-flex align-items-center gap-2">
                    <label
                      className="fw-medium text-muted mb-0"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      Approve Grace Marks
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter grace marks"
                      style={{ maxWidth: "150px" }}
                      value={graceMarks}
                      onChange={handleGraceMarksChange}
                    />
                  </div>

                  <button
                    type="button"
                    className="_btn success"
                    onClick={() => {
                      dispatch(
                        updateApplication({
                          id: unitDetail?.id,
                          type: unitDetail?.type,
                          status: "approved",
                        })
                      ).then(() => {
                        navigate("/applications/list");
                      });
                    }}
                  >
                    Approve
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
            </div>
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
      <ReviewCommentModal
        show={reviewCommentsShow}
        handleClose={() => setReviewCommentsShow(false)}
        reviewCommentsData={reviewCommentsData}
      />
    </>
  );
};

export default ApplicationDetails;
