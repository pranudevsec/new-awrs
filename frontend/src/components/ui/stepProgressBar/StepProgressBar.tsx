const steps = [
    { label: "Brigade" },
    { label: "Division" },
    { label: "Corps" },
    { label: "Command" },
    { label: "CONDITIONAL" },
    { label: "CW2" },
];

interface StepProgressBarProps {
    currentStep: number;
    award_type: string;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep = 4, award_type }) => {
    return (
        <div className="step-progress-container d-flex align-items-center justify-content-center position-relative">
            {steps.map((step, index) => {
                const label =
                    index === 4 ? (award_type.toLowerCase() === "citation" ? "MO" : "OL") : step.label;

                return (
                    <div className="step-item position-relative text-center" key={index}>
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
                                className={`step-line ${index < currentStep - 1 ? "completed" : ""
                                    }`}
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
