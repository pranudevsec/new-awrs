import { useEffect, useRef, useState, type JSX } from "react";
import { MdClose } from "react-icons/md";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadDocumentWithWatermark } from '../../../utils/documentUtils';
import { IoMdCheckmark } from "react-icons/io";
import { FaCheckCircle, FaDownload } from "react-icons/fa";
import { SVGICON } from "../../../constants/iconsList";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import Loader from "../../../components/ui/loader/Loader";
import UnitClarificationModal from "../../../modals/UnitClarificationModal";
import ReqClarificationModal from "../../../modals/ReqClarificationModal";
import ReviewCommentModal from "../../../modals/ReviewCommentModal";
import ViewCreatedClarificationModal from "../../../modals/ViewCreatedClarificationModal";
import StepProgressBar from "../../../components/ui/stepProgressBar/StepProgressBar";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import {
  addApplicationComment,
  approveMarks,
  fetchApplicationUnitDetail,
  updateApplication
} from "../../../reduxToolkit/services/application/applicationService";
import { updateClarification } from "../../../reduxToolkit/services/clarification/clarificationService";
import Axios, { baseURL } from "../../../reduxToolkit/helper/axios";
import { useDebounce } from "../../../hooks/useDebounce";
import { updateCitation } from "../../../reduxToolkit/services/citation/citationService";
import { updateAppreciation } from "../../../reduxToolkit/services/appreciation/appreciationService";
// Excel imports removed - using PDF instead
import DisclaimerModal from "../../../modals/DisclaimerModal";
import { DisclaimerText } from "../../../data/options";
// import { TokenValidation,getSignedData } from "../../../reduxToolkit/services/application/applicationService";
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

const hierarchy = ["brigade", "division", "corps", "command", "headquarter"];

const ApplicationDetails = () => {
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
  const [clarificationShow, setClarificationShow] = useState(false);
  const [reviewCommentsShow, setReviewCommentsShow] = useState(false);
  const [reqClarificationShow, setReqClarificationShow] = useState(false);
  const [reqViewCreatedClarificationShow, setReqViewCreatedClarificationShow] = useState(false);
  const [clarificationApplicationId, setClarificationApplicationId] = useState<number>(0);
  const [clarificationType, setClarificationType] = useState<string>("appreciation");
  const [clarificationParameterName, setClarificationParameterName] = useState<string>("");
  const [clarificationParameterId, setClarificationParameterId] = useState<string>("");
  const [clarificationDocForView, setClarificationDocForView] = useState<string | null>(null);
  const [reviewCommentsData, setReviewCommentsData] = useState<any>(null);
  const [clarificationClarificationForView, setClarificationClarificationForView] = useState<string | null>(null);
  const [reviewerClarificationForView, setReviewerClarificationForView] = useState<string | null>(null);
  const [approvedMarksState, setApprovedMarksState] = useState<Record<string, string>>({});
  const [approvedCountState, setApprovedCountState] = useState<Record<string, string>>({});
  const [remarksError, setRemarksError] = useState<string | null>(null);
  const [graceMarks, setGraceMarks] = useState("");
  const [decisions, _setDecisions] = useState<{ [memberId: string]: string }>({});
  // const [decisions, setDecisions] = useState<{ [memberId: string]: string }>({});

  const [priority, setPriority] = useState(userPriority);
  const [commentsState, setCommentsState] = useState<Record<string, string>>({});
  const [localComment, setLocalComment] = useState(commentsState?.__application__ ?? "");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [unitRemarks, setUnitRemarks] = useState("");
  const [priorityError, setPriorityError] = useState("");
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<{
    member: any;
    decision: string;
  } | null>(null);
  const [paramStats, setParamStats] = useState({
    totalParams: 0,
    filledParams: 0,
    marks: 0,
    approvedMarks: 0,
    totalMarks: 0,
    negativeMarks: 0,
    marksByRole: 0,
    positiveMarks: 0,
    approvedRole: ""
  });
  const [approvedMarksDocumentsState, setApprovedMarksDocumentsState] = useState<any>({});
  const [approvedMarksReasonState, setApprovedMarksReasonState] = useState<Record<string, string>>({});
  const [lastUploadedParam, setLastUploadedParam] = useState<string | null>(null);

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
    if (lastUploadedParam) {
      debouncedHandleSave(lastUploadedParam, approvedCountState[lastUploadedParam] ?? "");
      setLastUploadedParam(null);
    }
  }, [approvedMarksDocumentsState]);

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

    // Calculate positive marks (original positive parameters, excluding rejected)
    const positiveMarks = parameters.reduce((acc, param) => {
      const isRejected = param.clarification_details?.clarification_status === "rejected";
      const isNegative = param.negative;
      if (isRejected || isNegative) return acc;
      return acc + (param.marks ?? 0);
    }, 0);

    // Calculate negative marks (original negative parameters, excluding rejected)
    // Note: negative marks are stored as positive values, so we make them negative
    const negativeMarks = parameters.reduce((acc, param) => {
      const isRejected = param.clarification_details?.clarification_status === "rejected";
      if (isRejected || !param.negative) return acc;
      return acc + (param.marks ?? 0); // Keep as positive value for display
    }, 0);

    // Calculate approved marks (sum of all approved marks, excluding rejected parameters)
    // Only count if approved_marks is actually set (not null/undefined/empty)
    const approvedMarks = parameters.reduce((acc, param) => {
      const isRejected = param.clarification_details?.clarification_status === "rejected";
      if (isRejected) {
        return acc;
      }
      
      // Only count if approved_marks is actually set and not empty
      const hasApprovedMarks = param.approved_marks !== null && 
                               param.approved_marks !== undefined && 
                               param.approved_marks !== "" &&
                               !isNaN(Number(param.approved_marks));
      
      if (!hasApprovedMarks) {
        return acc;
      }
      
      const approved_marks = Number(param.approved_marks);
      
      // For negative parameters, use negative value for calculation
      const marksToAdd = param.negative ? -approved_marks : approved_marks;
      return acc + marksToAdd;
    }, 0);

    // Calculate marks added/deducted by role (difference between approved and original)
    const originalTotalMarks = positiveMarks - negativeMarks;
    // Only calculate marksByRole if there are actually approved marks
    const marksByRole = approvedMarks > 0 ? approvedMarks - originalTotalMarks : 0;

    // Total marks = Positive marks - Negative marks + Marks by role + Grace marks
    // For now, let's use the simple calculation: positive - negative
    let totalMarks = positiveMarks - negativeMarks;
    
    // Only add approved marks and grace marks if they exist and are meaningful
    if (marksByRole !== 0) {
      totalMarks += marksByRole;
    }
    if (Number(graceMarks ?? 0) !== 0) {
      totalMarks += Number(graceMarks ?? 0);
    }
    
    // Get approved role information
    const approvedRole = parameters.find((param) => 
      param.approved_by_role && param.approved_marks && Number(param.approved_marks) > 0
    )?.approved_by_role;
    
    return {
      totalParams,
      filledParams,
      marks: positiveMarks, // Keep for backward compatibility
      positiveMarks,
      negativeMarks,
      approvedMarks,
      marksByRole,
      totalMarks,
      approvedRole,
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
      const initialCounts: Record<string, string> = {};
      const initialComments: Record<string, string> = {};
      const initialApprovedMarksDocuments: Record<string, string> = {};
      const initialApprovedMarksReason: Record<string, string> = {};

      unitDetail.fds.parameters.forEach((param: any) => {
        if (approvedMarksState[param.id] === undefined) {
          initialMarks[param.id] = param.approved_marks ?? "";
        }
        if (approvedCountState[param.id] === undefined) {
          initialCounts[param.id] = param.approved_count ?? "";
        }
        if (approvedMarksDocumentsState[param.id] === undefined) {
          initialApprovedMarksDocuments[param.id] = param.approved_marks_documents ?? "";
        }
        if (approvedMarksReasonState[param.id] === undefined) {
          initialApprovedMarksReason[param.id] = param.approved_marks_reason ?? "";
        }

        const matchingComments = (param.comments ?? []).filter(
          (c: any) =>
            c.commented_by_role === profile?.user?.user_role &&
            c.commented_by_role_type === profile?.user?.cw2_type
        );

        if (matchingComments.length > 0) {
          const latest = matchingComments.reduce((a: any, b: any) =>
            new Date(a.commented_at) > new Date(b.commented_at) ? a : b
          );
          initialComments[param.id] = latest.comment ?? "";
        } else {
          initialComments[param.id] = "";
        }
      });

      setApprovedMarksState((prev) => ({ ...initialMarks, ...prev }));
      setApprovedCountState((prev) => ({ ...initialCounts, ...prev }));
      setApprovedMarksDocumentsState((prev: any) => ({ ...initialApprovedMarksDocuments, ...prev }));
      setApprovedMarksReasonState((prev) => ({ ...initialApprovedMarksReason, ...prev }));
      setCommentsState((prev) => ({ ...initialComments, ...prev }));
    }
  }, [unitDetail, profile]);

  const handleSave = async (paramId: string, approvedCountRaw: string, docsOverride?: string[]) => {
    if (approvedCountRaw === undefined) return;

    const parameters = unitDetail?.fds?.parameters ?? [];
    const param = parameters.find((p: any) => p.id === paramId);
    if (!param) return;

    const approved_count = Number(approvedCountRaw);
    
    // Parse per_unit_mark and max_marks from the info string
    // Format: "1 No of Coins = 2 marks (Max 25 marks)"
    let perUnitMark = 0;
    let maxMarks = 0;
    
    if (param.info) {
      const infoMatch = param.info.match(/(\d+(?:\.\d+)?)\s*marks\s*\(Max\s*(\d+(?:\.\d+)?)\s*marks\)/);
      if (infoMatch) {
        perUnitMark = Number(infoMatch[1]);
        maxMarks = Number(infoMatch[2]);
      }
    }

    // Use the same calculation logic as citation/appreciation
    const finalApprovedMarks = Math.min(approved_count * perUnitMark, maxMarks);
    
    // For negative parameters, store the absolute value (same as citation form)
    const marksToStore = param.negative ? Math.abs(finalApprovedMarks) : finalApprovedMarks;

    const body = {
      type: unitDetail?.type ?? "citation",
      application_id: unitDetail?.id ?? 0,
      parameters: [
        {
          id: paramId,
          approved_marks: marksToStore,
          approved_count: approved_count,
          approved_marks_documents: docsOverride ?? (Array.isArray(approvedMarksDocumentsState[paramId])
            ? approvedMarksDocumentsState[paramId]
            : []),
          approved_marks_reason: approvedMarksReasonState[paramId] ?? "",
        },
      ],
    };

    try {
      await dispatch(approveMarks(body)).unwrap();
      await dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
      const updatedStats = calculateParameterStats(unitDetail?.fds?.parameters);
      setParamStats(updatedStats);
    } catch (err) {
    }
  };

  const debouncedHandleSave = useDebounce(handleSave, 600);

  const handleCountChange = (paramId: string, value: string) => {
    // Only allow numbers (including empty string for clearing)
    if (value !== "" && !/^\d+$/.test(value)) {
      return; // Reject non-numeric input
    }
    
    setApprovedCountState((prev) => ({ ...prev, [paramId]: value }));

    // Also update the approved marks state for immediate UI feedback
    const parameters = unitDetail?.fds?.parameters ?? [];
    const param = parameters.find((p: any) => p.id === paramId);
    if (param) {
      const approved_count = Number(value);
      
      // Parse per_unit_mark and max_marks from the info string
      // Format: "1 No of Coins = 2 marks (Max 25 marks)"
      let perUnitMark = 0;
      let maxMarks = 0;
      
      if (param.info) {
        const infoMatch = param.info.match(/(\d+(?:\.\d+)?)\s*marks\s*\(Max\s*(\d+(?:\.\d+)?)\s*marks\)/);
        if (infoMatch) {
          perUnitMark = Number(infoMatch[1]);
          maxMarks = Number(infoMatch[2]);
        }
      }
      
      // Use the same calculation logic as citation/appreciation
      const finalApprovedMarks = Math.min(approved_count * perUnitMark, maxMarks);
      
      // For negative parameters, store the absolute value (same as citation form)
      const marksToStore = param.negative ? Math.abs(finalApprovedMarks) : finalApprovedMarks;
      
      setApprovedMarksState((prev) => ({
        ...prev,
        [paramId]: marksToStore.toFixed(2),
      }));
    }

    debouncedHandleSave(paramId, value);
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

  const handleRemarksChange = (e:any) => {
  const newRemarks = e.target.value;
  // Regular expression to allow only alphanumeric and space
  const regex = /^[A-Za-z0-9\s]*$/;

  if (regex.test(newRemarks) || newRemarks === "") {
    setUnitRemarks(newRemarks);
  } else {
    // You can also show an error message if needed
    setRemarksError("Special characters and symbols are not allowed.");
  }
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

  const makeFieldName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
  };

  const uploadFileToServer = async (
    file: File,
    paramName: string
  ): Promise<string | null> => {
    const fieldName = makeFieldName(paramName);
    const formData = new FormData();
    formData.append(fieldName, file);

    try {
      const response = await Axios.post(
        "/api/applications/upload-doc",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedData = response.data;
      if (Array.isArray(uploadedData) && uploadedData.length > 0) {
        return uploadedData[0].urlPath;
      } else {
        throw new Error("Invalid upload response");
      }
    } catch (error) {
      return null;
    }
  };

  const handleApprovedMarksDocumentsChange = async (
    paramId: string,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFileToServer(file, paramId);
      if (url) uploadedUrls.push(url);
    }

    setApprovedMarksDocumentsState((prev: any) => ({
      ...prev,
      [paramId]: [...(prev[paramId] || []), ...uploadedUrls],
    }));

    setLastUploadedParam(paramId);
    debouncedHandleSave(paramId, approvedCountState[paramId] ?? "");
  };

  const handleApprovedMarksReasonChange = (paramId: any, value: any) => {
    setApprovedMarksReasonState((prev) => ({ ...prev, [paramId]: value }));
    // Don't trigger save on every keystroke to prevent focus loss
    // Save will be triggered when user finishes typing (on blur) or when they save the form
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
      }
    }, 500);
  }, [unitRemarks]);

  const currentRoleIndex = hierarchy.indexOf(role?.toLowerCase());
  const lowerRoles = hierarchy.slice(0, currentRoleIndex)
  const roleMarksMap = unitDetail?.fds?.applicationGraceMarks ?? [];

  const displayedMarks = lowerRoles
    .map((r) => {
      const entry = roleMarksMap.find((e: any) => e.role?.toLowerCase() === r);
      return entry
        ? `Marks by ${r.charAt(0).toUpperCase() + r.slice(1)}: ${entry.marks}`
        : null;
    })
    .filter(Boolean);

  const handleSaveComment = (paramId: string, comment: string) => {
    if (!comment) return;

    const body: any = {
      type: unitDetail?.type ?? "citation",
      application_id: unitDetail?.id ?? 0,
    };

    if (paramId === "__application__") {
      body.comment = comment;
    } else {
      body.parameters = [{ name: paramId, comment }];
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

    // Validate priority range (1-1000)
    if (priorityPoints < 1 || priorityPoints > 1000) {
      toast.error("Priority must be between 1 and 1000");
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
      toast.error("Failed to update priority");
    }
  };

  // Debounced version of handlePriorityChange
  const debouncedHandlePriorityChange = useDebounce(handlePriorityChange, 1000);

  const debouncedHandleSaveComment = useDebounce(handleSaveComment, 600);

  const handleCommentChange = (paramId: string, value: string) => {
    setCommentsState((prev) => ({ ...prev, [paramId]: value }));
    debouncedHandleSaveComment(paramId, value);
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
 

// const handleAddsignature = async (member: any, memberdecision: string) => {
//   const newDecisions: { [memberId: string]: string } = {
//     ...decisions,
//     [member.id]: memberdecision,
//   };
//   setDecisions(newDecisions);

//   const result = await dispatch(
//     TokenValidation({ inputPersID: member.ic_number })
//   );
//   if (TokenValidation.fulfilled.match(result)) {
//     const isValid = result.payload.vaildId;
//     if (!isValid) {
//       return;
//     }
//     const SignPayload = {
//       data: {
//         application_id,
//         member,
//         type: unitDetail?.type,
//       },
//     };
//     const response = await dispatch(getSignedData(SignPayload));

//     const updatePayload = {
//       id: unitDetail?.id,
//       type: unitDetail?.type,
//       member: {
//         name: member.name,
//         ic_number: member.ic_number,
//         member_type: member.member_type,
//         member_id: member.id,
//         is_signature_added: true,
//         sign_digest: response.payload,
//       },
//       level: profile?.user?.user_role,
//     };
//     if (memberdecision === "accepted") {
//       dispatch(updateApplication(updatePayload)).then(() => {
//         dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
//         const allOthersAccepted = profile?.unit?.members
//           .filter((m: any) => m.id !== member.id)
//           .every((m: any) => decisions[m.id] === "accepted");

//         if (allOthersAccepted && memberdecision === "accepted") {
//           navigate("/applications/list");
//         }
//       });
//     } else if (memberdecision === "rejected") {
//       dispatch(
//         updateApplication({
//           ...updatePayload,
//           status: "rejected",
//         })
//       ).then(() => {
//         navigate("/applications/list");
//       });
//     }
//   }
// };


  // without token
  const handleAddsignature = async (member: any, memberdecision: string) => {
    const updatePayload = {
      id: unitDetail?.id,
      type: unitDetail?.type,
      member: {
        name: member.name,
        ic_number: member.ic_number,
        member_type: member.member_type,
        member_id: member.id,
        is_signature_added: true,
        sign_digest: "something while developing",
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
  };

  const handleConfirmDecision = async () => {
    if (pendingDecision) {
      const { member, decision } = pendingDecision;

      try {
        await handleAddsignature(member, decision);
      } catch (error) {
      }
    } else {
      toast.error("No decision to process.");
    }

    setShowDisclaimerModal(false);
    setPendingDecision(null);
  };

  const handleDecisionClick = (member: any, decision: string) => {
    if (isCW2Role && (profile.user.cw2_type === "mo" || profile.user.cw2_type === "ol")) {
      if (!priority || String(priority).trim() === "") {
        setPriorityError("Please Fill First Priority...");
        return;
      }
    }

    setPendingDecision({ member, decision });
    setShowDisclaimerModal(true);
  };

  const renderHeaderRow = (header: string, index: number) => (
    <tr key={`header-${header}-${index}`}>
      <td colSpan={9} style={{ fontWeight: 600, color: "#555", fontSize: 15, background: "#f5f5f5" }}>
        {header}
      </td>
    </tr>
  );

  const renderUploads = (upload: any) => {
    let uploads: string[] = [];

    if (Array.isArray(upload)) {
      uploads = upload;
    } else if (typeof upload === "string") {
      uploads = upload.split(",");
    } else if (upload && typeof upload === 'object') {
      // If it's an object, try to extract a URL property
      const url = upload.url || upload.path || upload.file || '';
      if (url) {
        uploads = [url];
      }
    }

    return uploads.map((filePath: string) => (
      <span key={filePath} style={{ display: "block" }}>
        {filePath.trim().split("/").pop()}
      </span>
    ));
  };

  // Helper function to get file name from upload
  const getFileNameFromUpload = (upload: any): string => {    
    let uploads: string[] = [];

    if (Array.isArray(upload)) {
      uploads = upload;
    } else if (typeof upload === "string") {
      uploads = upload.split(",");
    } else if (upload && typeof upload === 'object') {
      // If it's an object, try to extract a URL property
      const url = upload.url || upload.path || upload.file || '';
      if (url) {
        uploads = [url];
      }
    }

    // Return the first file name, or a default if none found
    if (uploads.length > 0) {
      const fileName = uploads[0].trim().split("/").pop() || "document";
      return fileName;
    }
    return "document";
  };

  const handleClarify = (id: number) => {
    dispatch(updateClarification({ id, clarification_status: "clarified" }))
      .then(() => setIsRefreshData(prev => !prev));
  };

  const handleReject = (id: number) => {
    dispatch(updateClarification({ id, clarification_status: "rejected" }))
      .then(() => setIsRefreshData(prev => !prev));
  };

  const handleRemoveApprovedMarkDocument = (paramId: string, fileIndex: number) => {
    setApprovedMarksDocumentsState((prev: any) => {
      const updatedFiles = [...(prev[paramId] || [])];
      updatedFiles.splice(fileIndex, 1);
      debouncedHandleSave(paramId, approvedCountState[paramId] ?? "", updatedFiles);
      return { ...prev, [paramId]: updatedFiles };
    });
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
    
    // Apply same logic as citation form for negative parameters
    let approvedMarksValue = isRejected ? "0" : approvedMarksState[param.id] ?? "";
    if (!isRejected && param.negative && approvedMarksValue && approvedMarksValue !== "0") {
      const marksNum = Number(approvedMarksValue);
      if (marksNum > 0) {
        approvedMarksValue = (-marksNum).toFixed(2); // Show negative sign for negative parameters
      }
    }
    
    const approvedCountValue = isRejected ? "0" : approvedCountState[param.id] ?? "";
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
            <button
              onClick={() => handleDocumentDownload(param.upload, getFileNameFromUpload(param.upload))}
              style={{ 
                fontSize: 14, 
                wordBreak: "break-word",
                background: "none",
                border: "none",
                color: "#1d4ed8",
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0
              }}
            >
              {renderUploads(param.upload)}
            </button>
          )}
        </td>

        {!isUnitRole && !isHeadquarter && (
          <>
            <td style={{ width: 200 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter approved count"
                autoComplete="off"
                value={approvedCountValue}
                disabled={isRejected}
                onChange={(e) => handleCountChange(param.id, e.target.value)}
              />
            </td>
            <td style={{ width: 200 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter approved marks"
                autoComplete="off"
                value={approvedMarksValue}
                disabled={isRejected}
                readOnly
              />
            </td>
            <td style={{ width: 200 }}>
              {(approvedMarksDocumentsState[param.id] || []).length > 0 &&
                <div
                  className="mb-1"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {(approvedMarksDocumentsState[param.id] || []).map((fileUrl: any, idx: any) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        fontSize: 14,
                        wordBreak: "break-all",
                        background: "#f1f5f9",
                        padding: "4px 8px",
                        borderRadius: 4,
                      }}
                    >
                      <button
                        onClick={() => handleDocumentDownload(fileUrl, fileUrl.split("/").pop() || "document")}
                        style={{
                          flex: 1,
                          color: "#1d4ed8",
                          textDecoration: "underline",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left"
                        }}
                      >
                        {fileUrl.split("/").pop()}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveApprovedMarkDocument(param.id, idx)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontSize: 16,
                        }}
                        title="Remove file"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              }
              <input
                type="file"
                className="form-control"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => handleApprovedMarksDocumentsChange(param.id, e.target.files)}
                disabled={isRejected}
              />

            </td>
            <td style={{ width: 200 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Auth"
                autoComplete="off"
                value={approvedMarksReasonState[param.id] ?? ""}
                onChange={(e) => handleApprovedMarksReasonChange(param.id, e.target.value)}
                onBlur={() => debouncedHandleSave(param.id, approvedCountState[param.id] ?? "")}
                disabled={isRejected}
              />
            </td>
            <td style={{ width: 120 }}>
              {canViewClarification ? (
                <button
                  className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                  onClick={() => {
                    setReqViewCreatedClarificationShow(true);
                    setReviewerClarificationForView(
                      clarificationDetails?.reviewer_comment
                    );
                  }}
                >
                  {SVGICON.app.eye}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setClarificationType(unitDetail?.type ?? "");
                    setClarificationApplicationId(unitDetail?.id ?? 0);
                    setClarificationParameterName(param.name);
                    setClarificationParameterId(param.id);
                    setClarificationDocForView(
                      clarificationDetails?.clarification_doc
                    );
                    setClarificationClarificationForView(
                      clarificationDetails?.clarification
                    );
                    setClarificationShow(true);
                  }}
                  className="fw-5 text-decoration-underline bg-transparent border-0"
                  style={{ fontSize: 14, color: "#0d6efd" }}
                >
                  Ask Clarification
                </button>
              )}
            </td>

            {isRaisedScreen && (
              <>
                <td style={{ width: 200 }}>
                  {clarificationDetails?.clarification && (
                    <button
                      className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                      onClick={() => {
                        setReqClarificationShow(true);
                        setClarificationDocForView(
                          clarificationDetails?.clarification_doc
                        );
                        setClarificationClarificationForView(
                          clarificationDetails?.clarification
                        );
                      }}
                    >
                      {SVGICON.app.eye}
                    </button>
                  )}
                </td>
                <td style={{ width: 150 }}>{clarificationActionContent}</td>
              </>
            )}
          </>
        )
        }
      </tr >
    );

    return rows;
  };

  // Function to add watermark to jsPDF documents (for PDF reports)
  const addWatermarkToJsPDF = (doc: any) => {
    const currentDateTime = new Date().toLocaleString();
    const userIP = window.location.hostname || "localhost";

    // Add diagonal watermark - big size and black color
    doc.setFontSize(40);
    doc.setTextColor(0, 0, 0); // Black color
    
    // Save current graphics state
    doc.saveGraphicsState();
    
    // Set opacity for watermark
    doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
    
    // Calculate center position for diagonal watermark
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    // Draw diagonal watermark - IP first, then time, both centered
    // Adjust positioning to account for diagonal rotation
    doc.text(`${userIP}`, centerX - 50, centerY - 30, { angle: 45 });
    doc.text(`${currentDateTime}`, centerX - 50, centerY + 30, { angle: 45 });
    
    // Restore graphics state
    doc.restoreGraphicsState();
  };

  // Function to download document with watermark using utility function
  const handleDocumentDownload = async (documentUrl: any, fileName: string) => {
    try {
      await downloadDocumentWithWatermark(documentUrl, fileName, baseURL);
      toast.success('Document downloaded with watermark');
    } catch (error) {      
      // Show more specific error message for missing files
      if (error instanceof Error && error.message.includes('Document not found')) {
        toast.error(`File not found: ${fileName}. The file may have been deleted or moved.`);
      } else {
        toast.error('Failed to load document');
      }
    }
  };

  // Excel export handler
// Excel function removed - using PDF instead
const handleDownloadPDF = () => {
  const parameters = unitDetail?.fds?.parameters ?? [];
  
  // Calculate summary statistics
  const stats = calculateParameterStats(parameters);

  // Prepare parameter data with approved marks (remove name and subsubcategory columns, add dash for empty subcategories)
  const paramData = parameters.map((param: any) => [
    param.category ?? "-",
    param.subcategory ?? "-",
    // Show negative sign for negative parameters (like HR Violation)
    param.negative ? (param.marks ? `-${Math.abs(param.marks)}` : "") : (param.marks ?? ""),
    param.approved_count ?? "",
    // Show negative sign for approved marks of negative parameters
    param.negative && param.approved_marks ? `-${Math.abs(param.approved_marks)}` : (param.approved_marks ?? ""),
  ]);

  // Create PDF
  const doc = new jsPDF();

  // Add header
  doc.setFontSize(16);
  doc.text(`Application ID: #${unitDetail?.id ?? ""}`, 14, 30);
  doc.setFontSize(12);
  doc.text(
    `Award Type: ${
      unitDetail?.type
        ? unitDetail.type.charAt(0).toUpperCase() + unitDetail.type.slice(1)
        : ""
    }`,
    14,
    40
  );      
  doc.text(`Unit Name: ${unitDetail?.unit_name ?? ""}`, 14, 50);

  // Parameters Table (moved up)
  if (paramData.length > 0) {
    doc.setFontSize(14);
    doc.text("Parameters Details", 14, 65);
    autoTable(doc, {
      startY: 70,
      head: [["Category", "Subcategory", "Original Marks", "Approved Count", "Approved Marks"]],
      body: paramData,
      theme: 'grid',
      headStyles: { fillColor: [0, 123, 255] },
    });
  }

  // Add summary statistics table (moved below parameters)
  const finalY = (doc as any).lastAutoTable.finalY || 90;
  doc.setFontSize(14);
  doc.text("Summary Statistics", 14, finalY + 15);
  
  const summaryData = [
    ["Filled Params", stats.filledParams.toString()],
    ["Positive Marks", stats.positiveMarks.toFixed(2)],
    ["Negative Marks", `-${stats.negativeMarks}`],
    ["Total Marks", stats.totalMarks.toFixed(2)]
  ];
  
  // Add marks by role if applicable
  if (stats.approvedRole && stats.marksByRole !== 0) {
    summaryData.push([
      `Marks ${stats.marksByRole > 0 ? 'added' : 'deducted'} by ${stats.approvedRole}`,
      `${stats.marksByRole > 0 ? '+' : ''}${stats.marksByRole.toFixed(2)}`
    ]);
  }

  autoTable(doc, {
    startY: finalY + 20,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [0, 123, 255] },
  });

  // Add watermark using the reusable function
  addWatermarkToJsPDF(doc);

  // Save PDF
  doc.save(`Application_${unitDetail?.id ?? ""}_Details.pdf`);
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
              { label: "Applications", href: "/applications/list" },
              { label: "Application Details", href: "/applications/list/1" },
            ]}
          />
          <button className="_btn primary mb-3 d-flex align-items-center gap-2" onClick={handleDownloadPDF}>
            <FaDownload />
            <span>Download PDF Report</span>
          </button>
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
        {unitDetail?.fds?.awards?.length > 0 && (
          <div className="mt-4">
            <h5 className="mb-3">Awards</h5>
            <div className="table-responsive">
              <table className="table-style-2 w-100">
                <thead>
                  <tr style={{ backgroundColor: "#007bff" }}>
                    <th style={{ width: 150, minWidth: 150, maxWidth: 150, fontSize: "17", color: "white" }}>
                      Type
                    </th>
                    <th style={{ width: 200, minWidth: 200, maxWidth: 200, fontSize: "17", color: "white" }}>
                      Year
                    </th>
                    <th style={{ width: 300, minWidth: 300, maxWidth: 300, fontSize: "17", color: "white" }}>
                      Title
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unitDetail?.fds?.awards?.map((award: any) => (
                    <tr key={award.award_id} className="cursor-auto">
                      <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                        <p className="fw-4 text-capitalize">
                          {award.award_type}
                        </p>
                      </td>
                      <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                        <p className="fw-4">{award.award_year}</p>
                      </td>
                      <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                        <p className="fw-4">{award.award_title}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                    <th style={{ width: 200, color: "white" }}>Approved Count</th>
                    <th style={{ width: 200, color: "white" }}>Approved Marks</th>
                    <th style={{ width: 150, color: "white" }}>Approved marks documents</th>
                    <th style={{ width: 150, color: "white" }}>Approved marks reason</th>
                    <th style={{ width: 150, color: "white" }}>Ask Clarification</th>
                    {isRaisedScreen && (
                      <>
                        <th style={{ width: 200, color: "white" }}>Requested Clarification</th>
                        <th style={{ width: 150, color: "white" }}>Action</th>
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
                const rows: JSX.Element[] = [];

                unitDetail?.fds?.parameters?.forEach((param: any, index: number) => {
                  const display = getParamDisplay(param);

                  const showHeader =
                    display.header && display.header !== prevHeader;
                  const showSubheader =
                    display.subheader && display.subheader !== prevSubheader;
                  const showSubsubheader =
                    display.subsubheader && display.subsubheader !== prevSubsubheader;

                  if (showHeader) {
                    rows.push(renderHeaderRow(display.header, index));
                  }

                  if (showSubheader) {
                    rows.push(
                      <tr key={`subheader-${display.subheader}-${index}`}>
                        <td
                          colSpan={8}
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
                <span className="fw-medium text-muted">Positive Marks:</span>
                <div className="fw-bold">{Number(paramStats.positiveMarks).toFixed(2)}</div>
              </div>
                  <div className="col-6 col-sm-2">
  <span className="fw-medium text-muted">Negative Marks:</span>
  <div className="fw-bold text-danger">
    -{paramStats.negativeMarks}
  </div>
</div>
              {paramStats.approvedRole && paramStats.marksByRole !== 0 && (
                <div className="col-6 col-sm-2">
                  <span className="fw-medium text-muted">
                    Marks {paramStats.marksByRole > 0 ? 'added' : 'deducted'} by {paramStats.approvedRole}:
                  </span>
                  <div className={`fw-bold ${paramStats.marksByRole > 0 ? 'text-success' : 'text-danger'}`}>
                    {paramStats.marksByRole > 0 ? '+' : ''}{paramStats.marksByRole.toFixed(2)}
                  </div>
                </div>
              )}
              <div className="col-6 col-sm-2">
                <span className="fw-medium text-muted">Total Marks:</span>
                <div className="fw-bold text-success">
                  {paramStats.totalMarks.toFixed(2)}
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
                  maxLength={200}
                />
                {remarksError && <p className="error-text">{remarksError}</p>}
              </div>
            )}
            {isHeadquarter && (
              <StepProgressBar unitDetail={unitDetail}
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
                                {profile?.user?.is_member ? (
                                  <>
                                    {member.member_type === "presiding_officer" &&
                                      !isSignatureAdded && (
                                        <>
                                          {isReadyToSubmit && (
                                            <button
                                              type="button"
                                              className="_btn success w-sm-auto"
                                              onClick={() => handleDecisionClick(member, "accepted")}
                                            >
                                              Recommend
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            className="_btn danger w-sm-auto"
                                            onClick={() => handleDecisionClick(member, "rejected")}
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
                                          onClick={() => handleDecisionClick(member, "accepted")}
                                        >
                                          Add Signature
                                        </button>
                                      )}

                                    {isSignatureAdded && (
                                      <span className="text-success fw-semibold text-nowrap d-flex align-items-center gap-1">
                                        <FaCheckCircle className="fs-5" /> Signature Added
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {isSignatureAdded ? (
                                      <span className="text-success fw-semibold text-nowrap d-flex align-items-center gap-1">
                                        <FaCheckCircle className="fs-5" /> Signature Added
                                      </span>
                                    ) : (
                                      <span className="text-danger fw-semibold text-nowrap">
                                        Signature Not Added
                                      </span>
                                    )}
                                  </>
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
              {displayedMarks.length > 0 && (
                <div className="text-muted small me-auto align-self-center">
                  {displayedMarks.join(" | ")}
                </div>
              )}

              {isHeadquarter && (
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
                              Sent
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
                      min="1"
                      max="1000"
                      placeholder="Enter priority (1-1000)"
                      value={priority}
                      onChange={(e) => {
                        const value = e.target.value;
                        
                        // Only allow numbers
                        if (value && !/^\d+$/.test(value)) {
                          return;
                        }
                        
                        setPriority(value);
                        
                        // Only call debounced function if value is not empty and is a valid number
                        if (value && !isNaN(Number(value))) {
                          const numValue = Number(value);
                          if (numValue >= 1 && numValue <= 1000) {
                            debouncedHandlePriorityChange(value);
                          }
                        }
                      }}
                    />
                    {priorityError && <p className="error-text">{priorityError}</p>}
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
                                            handleDecisionClick(member, "accepted")
                                          }
                                        >
                                          Recommend
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="_btn danger w-sm-auto"
                                        onClick={() =>
                                          handleDecisionClick(member, "rejected")
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
                                        handleDecisionClick(member, "accepted")
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
      <UnitClarificationModal
        show={clarificationShow}
        handleClose={() => setClarificationShow(false)}
        type={clarificationType}
        application_id={clarificationApplicationId}
        parameter_name={clarificationParameterName}
        parameter_id={clarificationParameterId}
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
      <DisclaimerModal
        show={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
        onConfirm={handleConfirmDecision}
        message={DisclaimerText["All"]}
        pendingDecision={pendingDecision}
      />
    </>
  );
};

export default ApplicationDetails;
