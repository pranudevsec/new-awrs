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
  let steps: any = isCommand
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
  if (!isCommand) {
    const moStep = { label: "MO", date: unitDetail?.mo_approved_at };
    const olStep = { label: "OL", date: unitDetail?.ol_approved_at };

    if (unitDetail?.is_mo_approved && unitDetail?.is_ol_approved) {
      if (
        new Date(unitDetail.mo_approved_at) <=
        new Date(unitDetail.ol_approved_at)
      ) {
        steps.push(moStep, olStep);
      } else {
        steps.push(olStep, moStep);
      }
    } else if (unitDetail?.is_mo_approved && !unitDetail?.is_ol_approved) {
      steps.push(moStep, olStep);
    } else if (!unitDetail?.is_mo_approved && unitDetail?.is_ol_approved) {
      steps.push(olStep, moStep);
    } else {
      steps.push(moStep, olStep);
    }
  }

  //  Always add CW2 at the end
  if (!isCommand) {
    steps.push({ label: "CW2", date: unitDetail?.finalized_at });
  }
  const getCurrentStep = () => {
    if (!unitDetail) return 0;

    if (unitDetail?.status_flag === "rejected") {
      const rejectedRole = unitDetail?.last_rejected_by_role?.toLowerCase();
      const rejectedIndex = steps.findIndex((step: any) =>
        step.label.toLowerCase().includes(rejectedRole)
      );
      if (rejectedIndex >= 0) return rejectedIndex;
    }

    const roleToStepIndex: Record<string, number> = {
      brigade: 0,
      division: 1,
      corps: 2,
      command: 3,
    };

    const lastApprovedRole = unitDetail.last_approved_by_role?.toLowerCase();
    let step = (roleToStepIndex[lastApprovedRole] ?? -1) + 1;

    if (unitDetail.is_mo_approved || unitDetail.is_ol_approved) {
      if (unitDetail.is_mo_approved && !unitDetail.is_ol_approved) step = 5;
      else if (!unitDetail.is_mo_approved && unitDetail.is_ol_approved)
        step = 5;
      else if (unitDetail.is_mo_approved && unitDetail.is_ol_approved) step = 6;
    }

    //  CW2 step is only marked if isfinalized is true
    if (unitDetail.isfinalized) step = steps.length;

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
    if (
      lowerLabel.includes("cw2") &&
      unitDetail.isfinalized &&
      unitDetail.finalized_at
    ) {
      return format(new Date(unitDetail.finalized_at), "dd MMM yyyy");
    }

    const applicationPriority = unitDetail?.fds?.applicationPriority;
    if (!applicationPriority || !Array.isArray(applicationPriority))
      return null;

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
      {steps.map((step: any, index: number) => {
        let rejectedRole = unitDetail?.last_rejected_by_role?.toLowerCase();
        if (rejectedRole === "cw2_mo") rejectedRole = "medical officer (mo)";
        if (rejectedRole === "cw2_ol") rejectedRole = "operational leader (ol)";

        const isRejected =
          unitDetail?.status_flag === "rejected" &&
          rejectedRole &&
          step.label.toLowerCase().includes(rejectedRole);

        const isCompleted =
          !isRejected &&
          (index < currentStep ||
            (step.label === "CW2" && unitDetail?.isfinalized === true));

        const isCurrent = !isRejected && index === currentStep;

        let stepStatusClass = "";
        if (isRejected) stepStatusClass = "rejected";
        else if (isCompleted) stepStatusClass = "completed";
        else if (isCurrent) stepStatusClass = "current";

        const stepCircleClass = `step-circle d-flex align-items-center justify-content-center fw-6 ${stepStatusClass}`;

        return (
          <div
            className="step-item position-relative text-center"
            key={step.label}
          >
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
              <div
                className={`small ${isRejected ? "text-danger" : "text-muted"}`}
              >
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
