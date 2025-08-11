import { useEffect, useRef, useState, type JSX } from "react";
import { MdClose } from "react-icons/md";
import { IoMdCheckmark } from "react-icons/io";
import { FaCheckCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import Loader from "../../../components/ui/loader/Loader";
import StepProgressBar from "../../../components/ui/stepProgressBar/StepProgressBar";
import { SVGICON } from "../../../constants/iconsList";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import {
    addApplicationComment,
    approveMarks,
    fetchApplicationUnitDetail,
    updateApplication,
    TokenValidation,
    getSignedData
} from "../../../reduxToolkit/services/application/applicationService";
import { updateClarification } from "../../../reduxToolkit/services/clarification/clarificationService";
import { baseURL } from "../../../reduxToolkit/helper/axios";
import { useDebounce } from "../../../hooks/useDebounce";
import { updateCitation } from "../../../reduxToolkit/services/citation/citationService";
import { updateAppreciation } from "../../../reduxToolkit/services/appreciation/appreciationService";

function areAllClarificationsResolved(unitDetail: any): boolean {
    const parameters = unitDetail?.fds?.parameters;

    if (!Array.isArray(parameters)) {
        return true;
    }

    for (const param of parameters) {
        if (param.clarification_details && param.last_clarification_status !== "clarified") {
            return false;
        }
    }

    return true;
}

const SubmittedFormDetail = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const { application_id } = useParams();

    const debounceRef = useRef<any>(null);

    const profile = useAppSelector((state) => state.admin.profile);
    const { loading, unitDetail } = useAppSelector((state) => state.application);

    const isReadyToSubmit = areAllClarificationsResolved(unitDetail);

    const raisedParam = searchParams.get("raised_clarifications");
    const isRaisedScreen = raisedParam === "true";
    let userPriority = "";

    // States
    const [isRefreshData, setIsRefreshData] = useState(false);
    const [approvedMarksState, setApprovedMarksState] = useState<Record<string, string>>({});
    const [remarksError, setRemarksError] = useState<string | null>(null);
    const [graceMarks, setGraceMarks] = useState("");
    const [decisions, setDecisions] = useState<{ [memberId: string]: string }>({});
    const [priority, setPriority] = useState(userPriority);
    const [commentsState, setCommentsState] = useState<Record<string, string>>({});
    const [localComment, setLocalComment] = useState(commentsState?.__application__ ?? "");
    const [commentError, setCommentError] = useState<string | null>(null);
    const [unitRemarks, setUnitRemarks] = useState("");
    const [paramStats, setParamStats] = useState({
        totalParams: 0,
        filledParams: 0,
        marks: 0,
        approvedMarks: 0,
        totalMarks: 0,
        negativeMarks: 0,
    });

    const isUnitRole = ["unit", "cw2"].includes(profile?.user?.user_role ?? "");
    const isCW2Role = profile?.user?.user_role === "cw2";
    const isHeadquarter = profile?.user?.user_role === "headquarter";
    const roleHierarchy = ["unit", "brigade", "division", "corps", "command"];
    const role = profile?.user?.user_role?.toLowerCase() ?? "";
    const cw2_type = profile?.user?.cw2_type?.toLowerCase() ?? "";
    const lowerRole = roleHierarchy[roleHierarchy.indexOf(role) - 1] ?? null;
    const award_type = searchParams.get("award_type") ?? "";
    const numericAppId = Number(application_id);

    if (role === "cw2" && Array.isArray(unitDetail?.fds?.applicationPriority)) {
        const foundPriority = unitDetail.fds.applicationPriority.find(
            (item: any) =>
                item.role?.toLowerCase() === "cw2" &&
                item.cw2_type?.toLowerCase() === cw2_type
        );
        if (foundPriority) {
            userPriority = foundPriority.priority ?? "";
        }
    }

    useEffect(() => {
        setPriority(userPriority);
    }, [userPriority]);

    useEffect(() => {
        if (award_type && numericAppId) dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
    }, [award_type, numericAppId, isRefreshData]);

    const calculateParameterStats = (parameters: any[]) => {
        const totalParams = parameters.length;

        const filledParams = parameters.filter(
            (param) => (param.count ?? 0) > 0 || (param.marks ?? 0) > 0
        ).length;

        const marks = parameters.reduce((acc, param) => {
            const isRejected = param.clarification_details?.clarification_status === "rejected";
            const isNegative = param.negative === true;
            if (isRejected || isNegative) return acc;
            return acc + (param.marks ?? 0);
        }, 0);

        const approvedMarks = parameters.reduce((acc, param) => {
            const isRejected = param.clarification_details?.clarification_status === "rejected";
            return acc + (isRejected ? 0 : Number(param.approved_marks ?? 0));
        }, 0);

        const negativeMarks = parameters.reduce((acc, param) => {
            const isRejected = param.clarification_details?.clarification_status === "rejected";

            if (isRejected) return acc;

            const hasValidApproved =
                param.approved_marks !== undefined &&
                param.approved_marks !== null &&
                param.approved_marks !== "" &&
                !isNaN(Number(param.approved_marks));

            const approved = hasValidApproved ? Number(param.approved_marks) : null;
            const original = param.marks ?? 0;
            const valueToCheck = approved ?? original;
            return acc + (param.negative === true ? valueToCheck : 0);
        }, 0);

        const totalParameterMarks = parameters.reduce((acc, param) => {
            const isRejected = param.clarification_details?.clarification_status === "rejected";

            if (isRejected) return acc;
            if (param.negative === true) return acc;

            const hasValidApproved =
                param.approved_marks !== undefined &&
                param.approved_marks !== null &&
                param.approved_marks !== "" &&
                !isNaN(Number(param.approved_marks));

            const approved = hasValidApproved ? Number(param.approved_marks) : null;
            const original = param.marks ?? 0;

            return acc + (approved ?? original);
        }, 0);

        let totalMarks = totalParameterMarks + Number(graceMarks ?? 0) - negativeMarks;
        if (totalMarks < 0) totalMarks = 0;
        return {
            totalParams,
            filledParams,
            marks,
            approvedMarks,
            negativeMarks,
            totalMarks,
        };
    };

    useEffect(() => {
        const parameters = unitDetail?.fds?.parameters ?? [];
        const stats = calculateParameterStats(parameters);
        setParamStats(stats);
    }, [unitDetail, graceMarks]);

    useEffect(() => {
        if (unitDetail?.fds?.parameters && profile) {
            const initialMarks: Record<string, string> = {};
            const initialComments: Record<string, string> = {};

            unitDetail.fds.parameters.forEach((param: any) => {
                initialMarks[param.name] = param.approved_marks ?? "";

                const matchingComments = (param.comments ?? []).filter(
                    (c: any) =>
                        c.commented_by_role === profile?.user?.user_role &&
                        c.commented_by_role_type === profile?.user?.cw2_type
                );

                if (matchingComments.length > 0) {
                    const latest = matchingComments.reduce((a: any, b: any) =>
                        new Date(a.commented_at) > new Date(b.commented_at) ? a : b
                    );
                    initialComments[param.name] = latest.comment ?? "";
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
            type: unitDetail?.type ?? "citation",
            application_id: unitDetail?.id ?? 0,
            parameters: [{ name: paramName, approved_marks: marks }],
        };

        try {
            await dispatch(approveMarks(body as any)).unwrap();
            dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
            const updatedStats = calculateParameterStats(unitDetail?.fds?.parameters);
            setParamStats(updatedStats);
        } catch (err) {
            console.error("Failed to save approved marks:", err);
        }
    };

    const debouncedHandleSave = useDebounce(handleSave, 600);
    const handleInputChange = (paramName: string, value: string) => {
        setApprovedMarksState((prev) => ({ ...prev, [paramName]: value }));
        debouncedHandleSave(paramName, value);
    };

    useEffect(() => {
        const grace = unitDetail?.fds?.applicationGraceMarks?.find(
            (entry: any) => entry.role?.toLowerCase() === role
        )?.marks;

        if (grace !== undefined) {
            setGraceMarks(grace.toString());
        }
    }, [unitDetail, role]);

    useEffect(() => {
        if (unitDetail?.remarks && Array.isArray(unitDetail?.remarks)) {
            const existing = unitDetail?.remarks.find(
                (r: any) => r.remark_added_by_role?.toLowerCase() === role
            );
            if (existing) {
                setUnitRemarks(existing.remarks ?? "");
            }
        }
    }, [unitDetail?.remarks, role]);

    const handleRemarksChange = (e: any) => {
        const value = e.target.value;

        if (value.length > 200) {
            setRemarksError("Remarks cannot exceed 200 characters.");
            return;
        }

        setRemarksError(null);
        setUnitRemarks(value);
    };

    const handleCommentInputChange = (e: any) => {
        const value = e.target.value;

        if (value.length > 200) {
            setCommentError("Comment cannot exceed 200 characters.");
            return;
        }

        setCommentError(null);
        setLocalComment(value);
    };

    // Debounce effect
    useEffect(() => {
        if (remarksError || unitRemarks.length === 0) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            const body = {
                type: unitDetail?.type ?? "citation",
                application_id: unitDetail?.id ?? 0,
                remark: unitRemarks,
                parameters: [],
            };

            try {
                await dispatch(approveMarks(body)).unwrap();
            } catch (err) {
                console.error("Failed to update remarks", err);
            }
        }, 500);
    }, [unitRemarks]);

    const hierarchy = ["brigade", "division", "corps", "command", "headquarter"];
    const currentRoleIndex = hierarchy.indexOf(role?.toLowerCase());

    const lowerRoles = hierarchy.slice(0, currentRoleIndex);
    const roleMarksMap = unitDetail?.fds?.applicationGraceMarks ?? [];

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
            type: unitDetail?.type ?? "citation",
            application_id: unitDetail?.id ?? 0,
        };

        if (paramName === "__application__") {
            body.comment = comment;
        } else {
            body.parameters = [{ name: paramName, comment }];
        }

        dispatch(addApplicationComment(body))
            .unwrap()
            .catch(() => { });
    };

    const handlePriorityChange = async (value: string) => {
        const priorityPoints = parseInt(value);

        if (isNaN(priorityPoints)) {
            toast.error("Please enter a valid number");
            return;
        }

        const body = {
            type: unitDetail?.type ?? "citation",
            application_id: unitDetail?.id ?? 0,
            applicationPriorityPoints: priorityPoints,
            parameters: [],
        };

        try {
            await dispatch(approveMarks(body)).unwrap();
            toast.success("Priority updated successfully");
        } catch (error) {
            console.log("error -> ", error);
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
                setLocalComment(existingComment.comment);
            }
        }
    }, [unitDetail?.fds?.comments, role]);

    const getParamDisplay = (param: any) => {
        if (param.name != "no") {
            return {
                main: param.name,
                header: param.category ?? null,
                subheader: param.subcategory ?? null,
                subsubheader: param.subsubcategory ?? null,
            };
        } else if (param.subsubcategory) {
            return {
                main: param.subsubcategory,
                header: param.category ?? null,
                subheader: param.subcategory ?? null,
                subsubheader: null,
            };
        } else if (param.subcategory) {
            return {
                main: param.subcategory,
                header: param.category ?? null,
                subheader: null,
                subsubheader: null,
            };
        } else {
            return {
                main: param.category,
                header: null,
                subheader: null,
                subsubheader: null,
            };
        }
    };

    const handleAddsignature = async (member: any, memberdecision: string) => {
        const newDecisions: { [memberId: string]: string } = {
            ...decisions,
            [member.id]: memberdecision,
        };
        setDecisions(newDecisions);

        const result = await dispatch(
            TokenValidation({ inputPersID: member.ic_number })
        );
        if (TokenValidation.fulfilled.match(result)) {
            const isValid = result.payload.vaildId;
            if (!isValid) {
                return;
            }
            const SignPayload = {
                data: {
                    application_id,
                    member,
                    type: unitDetail?.type,
                },
            };
            const response = await dispatch(getSignedData(SignPayload));

            const updatePayload = {
                id: unitDetail?.id,
                type: unitDetail?.type,
                member: {
                    name: member.name,
                    ic_number: member.ic_number,
                    member_type: member.member_type,
                    member_id: member.id,
                    is_signature_added: true,
                    sign_digest: response.payload,
                },
                level: profile?.user?.user_role,
            };
            if (memberdecision === "accepted") {
                dispatch(updateApplication(updatePayload)).then(() => {
                    dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
                    const allOthersAccepted = profile?.unit?.members
                        .filter((m: any) => m.id !== member.id)
                        .every((m: any) => decisions[m.id] === "accepted");

                    if (allOthersAccepted && memberdecision === "accepted") {
                        navigate("/applications/list");
                    }
                });
            } else if (memberdecision === "rejected") {
                dispatch(
                    updateApplication({
                        ...updatePayload,
                        status: "rejected",
                    })
                ).then(() => {
                    navigate("/applications/list");
                });
            }
        }
    };

    const renderUploads = (upload: any) => {
        let uploads: string[] = [];

        if (Array.isArray(upload)) {
            uploads = upload;
        } else if (typeof upload === "string") {
            uploads = upload.split(",");
        }

        return uploads.map((filePath: string) => (
            <span key={filePath} style={{ display: "block" }}>
                {filePath.trim().split("/").pop()}
            </span>
        ));
    };

    const handleClarify = (id: number) => {
        dispatch(updateClarification({ id, clarification_status: "clarified" }))
            .then(() => setIsRefreshData(prev => !prev));
    };

    const handleReject = (id: number) => {
        dispatch(updateClarification({ id, clarification_status: "rejected" }))
            .then(() => setIsRefreshData(prev => !prev));
    };

    const renderClarificationActions = (param: any) => {
        const clarificationId = param?.clarification_details?.clarification_id;

        return (
            <div className="d-flex gap-3">
                <button
                    className="action-btn bg-transparent d-flex align-items-center justify-content-center"
                    style={{ color: "var(--green-default)" }}
                    onClick={() => handleClarify(clarificationId)}
                >
                    <IoMdCheckmark />
                </button>
                <button
                    className="action-btn bg-transparent d-flex align-items-center justify-content-center"
                    style={{ color: "var(--red-default)" }}
                    onClick={() => handleReject(clarificationId)}
                >
                    <MdClose />
                </button>
            </div>
        );
    };


    const renderParameterRow = (param: any, display: any) => {
        const rows: JSX.Element[] = [];

        const isRejected = param?.clarification_details?.clarification_status === "rejected";
        const approvedMarksValue = isRejected ? "0" : approvedMarksState[param.name] ?? "";
        const clarificationDetails = param?.clarification_details;
        const hasClarification = clarificationDetails?.clarification && clarificationDetails?.clarification_id;
        const clarificationStatus = clarificationDetails?.clarification_status;
        const canViewClarification =
            param?.clarification_id ||
            (param?.last_clarification_id &&
                [role, lowerRole].includes(param?.last_clarification_handled_by));

        let clarificationActionContent = null;
        if (hasClarification) {
            clarificationActionContent =
                clarificationStatus === "pending" ? (
                    renderClarificationActions(param)
                ) : (
                    <p className="fw-5 text-capitalize">{clarificationStatus}</p>
                );
        }

        rows.push(
            <tr key={display.main}>
                <td style={{ width: 150 }}>
                    <p className="fw-5 mb-0">{display.main}</p>
                </td>

                <td style={{ width: 100 }}>
                    <p className="fw-5">{param.count}</p>
                </td>

                <td style={{ width: 100 }}>
                    <p className="fw-5">{param.negative ? `-${param.marks}` : param.marks}</p>
                </td>

                <td style={{ width: 200 }}>
                    {param.upload && (
                        <a
                            href={`${baseURL}${param.upload}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 18 }}
                        >
                            <span style={{ fontSize: 14, wordBreak: "break-word" }}>
                                {renderUploads(param.upload)}
                            </span>
                        </a>
                    )}
                </td>

                {!isUnitRole && !isHeadquarter && (
                    <>
                        <td style={{ width: 200 }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter approved marks"
                                autoComplete="off"
                                value={approvedMarksValue}
                                disabled={isRejected}
                                onChange={(e) => handleInputChange(param.name, e.target.value)}
                            />
                        </td>

                        {!isRaisedScreen && (
                            <td style={{ width: 120 }}>
                                {canViewClarification ? (
                                    <button
                                        className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                    >
                                        {SVGICON.app.eye}
                                    </button>
                                ) : (
                                    <button
                                        className="fw-5 text-decoration-underline bg-transparent border-0"
                                        style={{ fontSize: 14, color: "#0d6efd" }}
                                    >
                                        Ask Clarification
                                    </button>
                                )}
                            </td>
                        )}

                        {isRaisedScreen && (
                            <>
                                <td style={{ width: 200 }}>
                                    {clarificationDetails?.clarification && (
                                        <button
                                            className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        >
                                            {SVGICON.app.eye}
                                        </button>
                                    )}
                                </td>
                                <td style={{ width: 150 }}>{clarificationActionContent}</td>
                            </>
                        )}
                    </>
                )}
            </tr>
        );

        return rows;
    };


    // Show loader
    if (loading) return <Loader />;

    return (
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
                        <div className="form-label fw-semibold">Award Type</div>
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
                        <div className="form-label fw-semibold">Cycle Period</div>
                        <p className="fw-5 mb-0">
                            {unitDetail?.fds?.cycle_period ?? "--"}
                        </p>
                    </div>

                    <div
                        className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
                        style={{ minWidth: "150px" }}
                    >
                        <div className="form-label fw-semibold">Last Date</div>
                        <p className="fw-5 mb-0">{unitDetail?.fds?.last_date ?? "--"}</p>
                    </div>

                    <div
                        className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
                        style={{ minWidth: "150px" }}
                    >
                        <div className="form-label fw-semibold">Command</div>
                        <p className="fw-5 mb-0">{unitDetail?.fds?.command ?? "--"}</p>
                    </div>

                    <div
                        className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
                        style={{ minWidth: "150px" }}
                    >
                        <div className="form-label fw-semibold">Unit Name</div>
                        <p className="fw-5 mb-0">{unitDetail?.unit_name ?? "--"}</p>
                    </div>
                </div>
            </div>
            {/* {unitDetail?.fds?.awards?.length > 0 && (
                    <div className="mt-4">
                        <h5 className="mb-3">Awards</h5>
                        <div className="table-responsive">
                            <table className="table-style-2 w-100">
                                <thead>
                                    <tr style={{ backgroundColor: "#007bff" }}>
                                        <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                                            Type
                                        </th>
                                        <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                                            Year
                                        </th>
                                        <th style={{ width: 300, minWidth: 300, maxWidth: 300, color: "white" }}>
                                            Title
                                        </th>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )} */}
            <div className="table-responsive mt-4">
                <table className="table-style-1 w-100">
                    <thead>
                        <tr style={{ backgroundColor: "#007bff" }}>
                            <th style={{ width: 150, fontSize: "17", color: "white" }}>Parameter</th>
                            <th style={{ width: 100, fontSize: "17", color: "white" }}>Count</th>
                            <th style={{ width: 100, fontSize: "17", color: "white" }}>Marks</th>
                            <th style={{ width: 100, fontSize: "17", color: "white" }}>Document</th>

                            {!isUnitRole && !isHeadquarter && (
                                <>
                                    <th style={{ width: 200 }}>Approved Marks</th>
                                    {!isRaisedScreen && (
                                        <th style={{ width: 150 }}>Ask Clarification</th>
                                    )}
                                    {isRaisedScreen && (
                                        <>
                                            <th style={{ width: 200 }}>Requested Clarification</th>
                                            <th style={{ width: 150 }}>Action</th>{" "}
                                        </>
                                    )}
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            let prevHeader: string | null = null;
                            let prevSubheader: string | null = null;
                            let prevSubsubheader: string | null = null;
                            const rows: any[] = [];

                            unitDetail?.fds?.parameters?.forEach(
                                (param: any, index: number) => {
                                    const display = getParamDisplay(param);

                                    const showHeader =
                                        display.header && display.header !== prevHeader;
                                    const showSubheader =
                                        display.subheader && display.subheader !== prevSubheader;
                                    const showSubsubheader =
                                        display.subsubheader && display.subsubheader !== prevSubsubheader;

                                    if (showHeader) {
                                        rows.push(
                                            <tr key={`header-${display.header}-${index}`}>
                                                <td
                                                    colSpan={6}
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "#555",
                                                        fontSize: 15,
                                                        background: "#f5f5f5",
                                                    }}
                                                >
                                                    {display.header}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    if (showSubheader) {
                                        rows.push(
                                            <tr key={`subheader-${display.subheader}-${index}`}>
                                                <td
                                                    colSpan={6}
                                                    style={{
                                                        color: display.header ? "#1976d2" : "#888",
                                                        fontSize: 13,
                                                        background: "#f8fafc",
                                                    }}
                                                >
                                                    {display.subheader}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    if (showSubsubheader) {
                                        rows.push(
                                            <tr key={`subsubheader-${display.subsubheader}-${index}`}>
                                                <td
                                                    colSpan={6}
                                                    style={{
                                                        color: "#666",
                                                        fontSize: 12,
                                                        background: "#fafbfc",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    {display.subsubheader}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    prevHeader = display.header;
                                    prevSubheader = display.subheader;
                                    prevSubsubheader = display.subsubheader;

                                    rows.push(...renderParameterRow(param, display));
                                });

                            return rows;
                        })()}
                    </tbody>
                </table>
            </div>
            {!isUnitRole && (
                <ul
                    style={{
                        listStyleType: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                        padding: 0,
                        marginBottom: "16px",
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
                                color: "#333",
                            }}
                        >
                            <strong>Unit:</strong> {unitDetail.fds.unitRemarks}
                        </li>
                    )}

                    {/* Other Remarks */}
                    {Array.isArray(unitDetail?.remarks) &&
                        unitDetail.remarks.map((item: any) => (
                            <li
                                key={item?.remarks}
                                style={{
                                    padding: "8px 12px",
                                    backgroundColor: "#f9f9f9",
                                    borderRadius: "6px",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                    fontSize: "14px",
                                    color: "#333",
                                }}
                            >
                                <strong>{item?.remark_added_by_role}:</strong>{" "}
                                {item?.remarks}
                            </li>
                        ))}
                </ul>
            )}
            {!isUnitRole && (
                <div
                    style={{
                        borderTop: "1px solid var(--gray-200)",
                        paddingTop: "20px",
                        paddingBottom: "20px",
                    }}
                >
                    <div className="row text-center text-sm-start mb-3">
                        <div className="col-6 col-sm-2">
                            <span className="fw-medium text-muted">Filled Params:</span>
                            <div className="fw-bold">{paramStats.filledParams}</div>
                        </div>
                        <div className="col-6 col-sm-2">
                            <span className="fw-medium text-muted">Marks:</span>
                            <div className="fw-bold">{paramStats.marks}</div>
                        </div>
                        <div className="col-6 col-sm-2">
                            <span className="fw-medium text-muted">Nagative Marks:</span>
                            <div className="fw-bold text-danger">-{paramStats.negativeMarks}</div>
                        </div>
                        <div className="col-6 col-sm-2">
                            <span className="fw-medium text-muted">Approved Marks:</span>
                            <div className="fw-bold text-primary">
                                {paramStats.approvedMarks}
                            </div>
                        </div>
                        <div className="col-6 col-sm-2">
                            <span className="fw-medium text-muted">Total Marks:</span>
                            <div className="fw-bold text-success">
                                {paramStats.totalMarks}
                            </div>
                        </div>
                    </div>

                    {/* Grace Marks Field */}
                    {!isHeadquarter && (
                        <div className="w-100 mb-4">
                            <div
                                className="fw-medium text-muted mb-2"
                                style={{ whiteSpace: "nowrap" }}
                            >
                                Enter Your Remarks:
                            </div>
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
                    {isHeadquarter && (
                        <StepProgressBar
                            unitDetail={unitDetail}
                        />
                    )}
                    {profile?.unit?.members &&
                        Array.isArray(profile.unit.members) &&
                        profile.unit.members.length > 0 && (
                            <div className="table-responsive mb-3">
                                <div
                                    className="fw-medium text-muted mb-2"
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    Submit Signatures:
                                </div>
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
                                            ...profile.unit.members.filter(
                                                (m) => m.member_type === "presiding_officer"
                                            ),
                                            ...profile.unit.members
                                                .filter((m) => m.member_type === "member_officer")
                                                .sort(
                                                    (a, b) =>
                                                        Number(a.member_order ?? 0) - Number(b.member_order ?? 0)
                                                ),
                                        ].map((member) => {
                                            const acceptedMembers = unitDetail?.fds?.accepted_members ?? [];
                                            const foundMember = acceptedMembers.find(
                                                (m: any) => m.member_id === member.id
                                            );
                                            const isSignatureAdded = foundMember?.is_signature_added === true;

                                            return (
                                                <tr key={member.id}>
                                                    <td>
                                                        {member.member_type === "presiding_officer"
                                                            ? "Presiding Officer"
                                                            : "Member Officer"}
                                                    </td>
                                                    <td>{member.name ?? "-"}</td>
                                                    <td>{member.rank ?? "-"}</td>
                                                    <td>
                                                        <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-1 align-items-center">
                                                            {member.member_type === "presiding_officer" &&
                                                                !isSignatureAdded && (
                                                                    <>
                                                                        {isReadyToSubmit && (
                                                                            <button
                                                                                type="button"
                                                                                className="_btn success w-sm-auto"
                                                                                onClick={() =>
                                                                                    handleAddsignature(member, "accepted")
                                                                                }
                                                                            >
                                                                                Accept
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            className="_btn danger w-sm-auto"
                                                                            onClick={() =>
                                                                                handleAddsignature(member, "rejected")
                                                                            }
                                                                        >
                                                                            Decline
                                                                        </button>
                                                                    </>
                                                                )}

                                                            {member.member_type !== "presiding_officer" &&
                                                                !isSignatureAdded && (
                                                                    <button
                                                                        type="button"
                                                                        className="_btn success text-nowrap w-sm-auto"
                                                                        onClick={() =>
                                                                            handleAddsignature(member, "accepted")
                                                                        }
                                                                    >
                                                                        Add Signature
                                                                    </button>
                                                                )}

                                                            {isSignatureAdded && (
                                                                <span className="text-success fw-semibold text-nowrap d-flex align-items-center gap-1">
                                                                    <FaCheckCircle className="fs-5" /> Signature Added
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
                        {isHeadquarter && (
                            <button type="button" className="_btn success">
                                Review Comments
                            </button>
                        )}
                    </div>
                </div>
            )}
            {isHeadquarter && (
                <div className="mt-4">
                    <h5 className="mb-3">Send for Review</h5>
                    <div className="table-responsive">
                        <table className="table-style-2 w-100">
                            <thead>
                                <tr>
                                    <th style={{ width: 200, minWidth: 200 }}>Category</th>
                                    <th style={{ width: 200, minWidth: 200 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {["HR", "DV", "MP"].map((category) => {
                                    let isAlreadySent: any = false;
                                    if (category === "HR") {
                                        isAlreadySent = unitDetail?.is_hr_review;
                                    } else if (category === "DV") {
                                        isAlreadySent = unitDetail?.is_dv_review;
                                    } else if (category === "MP") {
                                        isAlreadySent = unitDetail?.is_mp_review;
                                    }

                                    return (
                                        <tr key={category}>
                                            <td>
                                                <p className="fw-4">{category}</p>
                                            </td>
                                            <td>
                                                {isAlreadySent ? (
                                                    <span className="text-danger fw-semibold">
                                                        Already Sent
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="_btn success"
                                                        onClick={() => {
                                                            const payload: {
                                                                id: number | undefined;
                                                                is_hr_review?: boolean;
                                                                is_dv_review?: boolean;
                                                                is_mp_review?: boolean;
                                                            } = {
                                                                id: unitDetail?.id,
                                                            };

                                                            if (category === "HR") {
                                                                payload.is_hr_review = true;
                                                            } else if (category === "DV") {
                                                                payload.is_dv_review = true;
                                                            } else if (category === "MP") {
                                                                payload.is_mp_review = true;
                                                            }

                                                            if (unitDetail?.type === "citation") {
                                                                dispatch(updateCitation(payload)).then(() => {
                                                                    if (award_type && numericAppId) {
                                                                        dispatch(
                                                                            fetchApplicationUnitDetail({
                                                                                award_type,
                                                                                numericAppId,
                                                                            })
                                                                        );
                                                                    }
                                                                });
                                                            } else if (
                                                                unitDetail?.type === "appreciation"
                                                            ) {
                                                                dispatch(updateAppreciation(payload)).then(
                                                                    () => {
                                                                        if (award_type && numericAppId) {
                                                                            dispatch(
                                                                                fetchApplicationUnitDetail({
                                                                                    award_type,
                                                                                    numericAppId,
                                                                                })
                                                                            );
                                                                        }
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Send for Review
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {isCW2Role && (
                <div
                    style={{
                        borderTop: "1px solid var(--gray-200)",
                        paddingTop: "20px",
                        paddingBottom: "20px",
                    }}
                >
                    {!isHeadquarter && (
                        <>
                            {(cw2_type === "mo" || cw2_type === "ol") && (
                                <div className="mb-2">
                                    <label htmlFor="priority" className="form-label mb-1">Priority:</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="priority"
                                        id="priority"
                                        value={priority}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setPriority(value);
                                            handlePriorityChange(value);
                                        }}
                                    />
                                </div>
                            )}

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleCommentChange("__application__", localComment);
                                }}
                            >
                                <div className="form-label mb-1">Drop Comment:</div>
                                <textarea
                                    className="form-control"
                                    placeholder="Enter comment"
                                    rows={4}
                                    value={localComment}
                                    onChange={handleCommentInputChange}
                                />
                                {commentError && <p className="error-text">{commentError}</p>}
                                <div className="d-flex align-items-center justify-content-end mt-2">
                                    <button type="submit" className="_btn success">
                                        Submit
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                    {profile?.unit?.members &&
                        ((cw2_type === "mo" && !unitDetail?.is_mo_approved) ||
                            (cw2_type === "ol" && !unitDetail?.is_ol_approved)) &&
                        Array.isArray(profile.unit.members) &&
                        profile.unit.members.length > 0 && (
                            <div className="table-responsive mb-3">
                                <div
                                    className="fw-medium text-muted mb-2"
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    Submit Signatures:
                                </div>
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
                                            ...profile.unit.members.filter(
                                                (m) => m.member_type === "presiding_officer"
                                            ),
                                            ...profile.unit.members
                                                .filter((m) => m.member_type === "member_officer")
                                                .sort(
                                                    (a, b) =>
                                                        Number(a.member_order ?? 0) - Number(b.member_order ?? 0)
                                                )
                                        ].map((member) => {
                                            const acceptedMembers =
                                                unitDetail?.fds?.accepted_members ?? [];
                                            const foundMember = acceptedMembers.find(
                                                (m: any) => m.member_id === member.id
                                            );
                                            const isSignatureAdded =
                                                foundMember?.is_signature_added === true;

                                            return (
                                                <tr key={member.id}>
                                                    <td>
                                                        {member.member_type === "presiding_officer"
                                                            ? "Presiding Officer"
                                                            : "Member Officer"}
                                                    </td>
                                                    <td>{member.name ?? "-"}</td>
                                                    <td>{member.rank ?? "-"}</td>
                                                    <td>
                                                        <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-1 align-items-center">
                                                            {member.member_type === "presiding_officer" &&
                                                                !profile?.user?.is_member &&
                                                                !isSignatureAdded && (
                                                                    <>
                                                                        {isReadyToSubmit && (
                                                                            <button
                                                                                type="button"
                                                                                className="_btn success w-sm-auto"
                                                                                onClick={() =>
                                                                                    handleAddsignature(
                                                                                        member,
                                                                                        "accepted"
                                                                                    )
                                                                                }
                                                                            >
                                                                                Accept
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            className="_btn danger w-sm-auto"
                                                                            onClick={() =>
                                                                                handleAddsignature(member, "rejected")
                                                                            }
                                                                        >
                                                                            Decline
                                                                        </button>
                                                                    </>
                                                                )}

                                                            {member.member_type !== "presiding_officer" &&
                                                                !isSignatureAdded && (
                                                                    <button
                                                                        type="button"
                                                                        className="_btn success text-nowrap w-sm-auto"
                                                                        onClick={() =>
                                                                            handleAddsignature(member, "accepted")
                                                                        }
                                                                    >
                                                                        Add Signature
                                                                    </button>
                                                                )}

                                                            {isSignatureAdded && (
                                                                <span className="text-success fw-semibold text-nowrap d-flex align-items-center gap-1">
                                                                    <FaCheckCircle className="fs-5" /> Signature
                                                                    Added
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};

export default SubmittedFormDetail;
