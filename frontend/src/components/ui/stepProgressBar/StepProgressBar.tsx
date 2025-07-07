const steps = [
    { label: "Brigade" },
    { label: "Division" },
    { label: "Corps" },
    { label: "Command" },
    { label: "CONDITIONAL" }, // MO/OL, shown conditionally
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

    const currentStep = getCurrentStep();

    return (
        <div className="step-progress-container d-flex align-items-center justify-content-center position-relative">
            {steps.map((step, index) => {
                const label =
                    index === 4
                        ? award_type.toLowerCase() === "citation"
                            ? "MO"
                            : "OL"
                        : step.label;

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
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StepProgressBar;
