import React from "react";
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

const StepProgressBar: React.FC<StepProgressBarProps> = ({ award_type, unitDetail }) => {
    const getCurrentStep = () => {
        if (!unitDetail) {
            return 0;
        }

        const roleToStepIndex: Record<string, number> = {
            brigade: 0,
            division: 1,
            corps: 2,
            command: 3,
        };

        const lastApprovedRole = unitDetail.last_approved_by_role?.toLowerCase();
        let step = (roleToStepIndex[lastApprovedRole] ?? -1) + 1;

        if (lastApprovedRole === "command" && unitDetail.is_mo_ol_approved) {
            step = 5; // All up to MO/OL completed, CW2 current
        }

        return step;
    };

    const getStepDate = (label: string): string | null => {
        const applicationPriority = unitDetail?.fds?.applicationPriority;
        if (!applicationPriority || !Array.isArray(applicationPriority)) return null;

        const roleKey = label.toLowerCase(); // brigade, division, etc.
        const found = applicationPriority.find((p: any) => p.role?.toLowerCase() === roleKey);

        if (found?.priorityAddedAt) {
            return format(new Date(found.priorityAddedAt), "dd MMM yyyy");
        }

        return null;
    };

    const currentStep = getCurrentStep();

    return (
        <div className="step-progress-container d-flex align-items-center justify-content-center position-relative">
            {steps.map((step, index) => {
                let label = step.label;
                if (label === "MO" && award_type.toLowerCase() !== "citation") {
                    label = "OL";
                }
                if (label === "OL" && award_type.toLowerCase() === "citation") {
                    label = "MO";
                }

                return (
                    <div className="step-item position-relative text-center" key={index}>
                        <div
                            className={`step-circle d-flex align-items-center justify-content-center fw-6 ${
                                index < currentStep
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
    <div>{label}</div>
    <div className="text-muted small">
        {getStepDate(label) ?? <span style={{opacity:0}}>Pending</span>}
    </div>
</div>

                    </div>
                );
            })}
        </div>
    );
};

export default StepProgressBar;
