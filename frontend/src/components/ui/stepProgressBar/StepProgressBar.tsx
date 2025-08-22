import { format } from "date-fns";

interface StepProgressBarProps {
  unitDetail: any;
  isCommand?: boolean;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({
  unitDetail,
  isCommand = false,
}) => {
  // Base steps
  let steps = isCommand
    ? [
        { label: "Brigade" },
        { label: "Division" },
        { label: "Corps" },
        { label: "Command" },
      ]
    : [
        { label: "Brigade" },
        { label: "Division" },
        { label: "Corps" },
        { label: "Command" },
      ];

  // Handle MO / OL dynamic order
 // Handle MO / OL dynamic order
if (!isCommand) {
  const moStep = { label: "Medical Officer (MO)", date: unitDetail?.mo_approved_at };
  const olStep = { label: "Operational Leader (OL)", date: unitDetail?.ol_approved_at };

  if (unitDetail?.is_mo_approved && unitDetail?.is_ol_approved) {
    // ✅ Both approved → order by approval date
    if (new Date(unitDetail.mo_approved_at) <= new Date(unitDetail.ol_approved_at)) {
      steps.push(moStep, olStep);
    } else {
      steps.push(olStep, moStep);
    }
  } else if (unitDetail?.is_mo_approved && !unitDetail?.is_ol_approved) {
    // ✅ Only MO approved → MO comes first
    steps.push(moStep, olStep);
  } else if (!unitDetail?.is_mo_approved && unitDetail?.is_ol_approved) {
    // ✅ Only OL approved → OL comes first
    steps.push(olStep, moStep);
  } else {
    // ❌ None approved yet → default MO → OL
    steps.push(moStep, olStep);
  }

  // CW2 always last
  steps.push({ label: "Chief Warrant 2 (CW2)", date: unitDetail?.cw2_approved_at } as any);
}


const getCurrentStep = () => {
  if (!unitDetail) return 0;

  //  If status is rejected
  if (unitDetail?.status_flag === "rejected") {
    const rejectedRole = unitDetail?.last_rejected_by_role?.toLowerCase();
    const rejectedIndex = steps.findIndex(step =>
      step.label.toLowerCase().includes(rejectedRole)
    );

    if (rejectedIndex >= 0) {
      return rejectedIndex; 
    }
  }

  // 🔹 Normal flow if not rejected
  const roleToStepIndex: Record<string, number> = {
    brigade: 0,
    division: 1,
    corps: 2,
    command: 3,
  };

  const lastApprovedRole = unitDetail.last_approved_by_role?.toLowerCase();
  let step = (roleToStepIndex[lastApprovedRole] ?? -1) + 1;

  // Handle MO/OL dynamic logic
  if (unitDetail.is_mo_approved || unitDetail.is_ol_approved) {
    const moApproved = !!unitDetail.is_mo_approved;
    const olApproved = !!unitDetail.is_ol_approved;

    if (moApproved && !olApproved) step = 5;
    else if (!moApproved && olApproved) step = 5;
    else if (moApproved && olApproved) step = 6;
  }

  if (unitDetail.cw2_approved_at) step = steps.length;

  return step;
};

  const getStepDate = (label: string): string | null => {
    if (!unitDetail) return null;

    const lowerLabel = label.toLowerCase();

    if (lowerLabel.includes("mo") && unitDetail.mo_approved_at) {
      return format(new Date(unitDetail.mo_approved_at), "dd MMM yyyy");
    }

    if (lowerLabel.includes("ol") && unitDetail.ol_approved_at) {
      return format(new Date(unitDetail.ol_approved_at), "dd MMM yyyy");
    }

    if (lowerLabel.includes("cw2") && unitDetail.cw2_approved_at) {
      return format(new Date(unitDetail.cw2_approved_at), "dd MMM yyyy");
    }

    const applicationPriority = unitDetail?.fds?.applicationPriority;
    if (!applicationPriority || !Array.isArray(applicationPriority)) return null;

    const found = applicationPriority.find(
      (p: any) => p.role?.toLowerCase() === lowerLabel
    );

    if (found?.priorityAddedAt) {
      return format(new Date(found.priorityAddedAt), "dd MMM yyyy");
    }

    return null;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="step-progress-container d-flex align-items-center justify-content-center position-relative">
{steps.map((step, index) => {
  // Normalize rejected role
  let rejectedRole = unitDetail?.last_rejected_by_role?.toLowerCase();
  if (rejectedRole === "cw2_mo") rejectedRole = "medical officer (mo)";
  if (rejectedRole === "cw2_ol") rejectedRole = "operational leader (ol)";

  const isRejected =
    unitDetail?.status_flag === "rejected" &&
    rejectedRole &&
    step.label.toLowerCase().includes(rejectedRole);

  const isCompleted = !isRejected && index < currentStep;
  const isCurrent = !isRejected && index === currentStep;

  let stepStatusClass = "";
  if (isRejected) stepStatusClass = "rejected";
  else if (isCompleted) stepStatusClass = "completed";
  else if (isCurrent) stepStatusClass = "current";

  const stepCircleClass = `step-circle d-flex align-items-center justify-content-center fw-6 ${stepStatusClass}`;

  return (
    <div className="step-item position-relative text-center" key={step.label}>
      <div className={stepCircleClass}>
        {isRejected ? "✘" : isCompleted ? "✔" : index + 1}
      </div>

      {index < steps.length - 1 && (
        <div
          className={`step-line ${
            isCompleted ? "completed" : isRejected ? "rejected" : ""
          }`}
        ></div>
      )}

      <div className="step-label">
        <div>{step.label}</div>
        <div className={`small ${isRejected ? "text-danger" : "text-muted"}`}>
          {isRejected ? "Rejected" : getStepDate(step.label) ?? "Pending"}
        </div>
      </div>
    </div>
  );
})}


    </div>
  );
};


export default StepProgressBar;

