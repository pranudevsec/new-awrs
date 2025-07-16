import { format } from "date-fns";

const steps = [
  { label: "Brigade" },
  { label: "Division" },
  { label: "Corps" },
  { label: "Command" },
  { label: "MO" },
  { label: "OL" },
  { label: "CW2" },
];

interface StepProgressBarProps {
  award_type: string;
  unitDetail: any;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({
  award_type,
  unitDetail,
}) => {
  console.log(award_type)
  const getCurrentStep = () => {
    if (!unitDetail) return 0;

    const roleToStepIndex: Record<string, number> = {
      brigade: 0,
      division: 1,
      corps: 2,
      command: 3,
    };

    const lastApprovedRole = unitDetail.last_approved_by_role?.toLowerCase();
    let step = (roleToStepIndex[lastApprovedRole] ?? -1) + 1;

    if (unitDetail.is_ol_approved) {
      step = 7;
    } else if (unitDetail.is_mo_approved) {
      step = 5;
    }

    return step;
  };
  const getStepDate = (label: string): string | null => {
    if (!unitDetail) return null;

    const lowerLabel = label.toLowerCase();

    if (lowerLabel === "mo" && unitDetail.mo_approved_at) {
      return format(new Date(unitDetail.mo_approved_at), "dd MMM yyyy");
    }

    if (lowerLabel === "ol" && unitDetail.ol_approved_at) {
      return format(new Date(unitDetail.ol_approved_at), "dd MMM yyyy");
    }

    if (lowerLabel === "cw2" && unitDetail.is_ol_approved && unitDetail.ol_approved_at) {
      return format(new Date(unitDetail.ol_approved_at), "dd MMM yyyy");
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
      {steps.map((step, index) => (
        <div className="step-item position-relative text-center" key={step.label}>
          <div
            className={`step-circle d-flex align-items-center justify-content-center fw-6 ${index < currentStep
              ? "completed"
              : index === currentStep
                ? "current"
                : ""
              }`}
          >
            {index < currentStep ? "✔" : index + 1}
          </div>

          {index < steps.length - 1 && (
            <div
              className={`step-line ${index < currentStep ? "completed" : ""}`}
            ></div>
          )}

          <div className="step-label">
            <div>{step.label}</div>
            <div className="text-muted small">
              {getStepDate(step.label) ?? "Pending"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepProgressBar;

