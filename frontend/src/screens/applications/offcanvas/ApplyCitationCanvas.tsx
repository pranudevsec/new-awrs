import type { FC } from "react"
import { SVGICON } from "../../../constants/iconsList";
import Offcanvas from "react-bootstrap/Offcanvas";
import FormSelect from "../../../components/form/FormSelect";
import FormInput from "../../../components/form/FormInput";

const awardTypeOptions: OptionType[] = [
    { value: "citation", label: "Citation" },
    { value: "clarification", label: "Clarification" },
];

const cyclePeriodOptions: OptionType[] = [
    { value: "2024 - H1", label: "2024 - H1" },
    { value: "2024 - H2", label: "2024 - H2" },
    { value: "2025 - H1", label: "2025 - H1" },
    { value: "2025 - H2", label: "2025 - H2" },
];

interface ApplyCitationCanvasProps {
    show: boolean;
    handleClose: () => void;
}

const ApplyCitationCanvas: FC<ApplyCitationCanvasProps> = ({ show, handleClose }) => {
    return (
        <Offcanvas
            show={show}
            onHide={handleClose}
            placement={"end"}
            className="filter-menu-offcanvas"
        >
            <div className="offcanvas-header d-flex align-items-center justify-content-between">
                <h4 className="font-lexend fw-7">Table Filters</h4>
                <button className='bg-transparent border-0' onClick={handleClose}>{SVGICON.app.close}</button>
            </div>
            <div className="offcanvas-body">
                <div className="mb-4">
                    <FormSelect
                        label="Award Type"
                        name="awardType"
                        options={awardTypeOptions}
                        value={awardTypeOptions.find((opt) => opt.value === "citation") || null}
                        placeholder="Select award type"
                        isDisabled={true}
                    />
                </div>
                <div className="mb-4">
                    <FormSelect
                        label="Cycle Period"
                        name="cyclePeriod"
                        options={cyclePeriodOptions}
                        value={cyclePeriodOptions.find((opt) => opt.value === "citation") || null}
                        placeholder="Select award type"
                    />
                </div>
                <div className="mb-4">
                    <FormInput
                        label="Last Date"
                        name="lastDate"
                        type="date"
                        placeholder="Enter last date"
                        value={new Date().toISOString().split("T")[0]}
                        readOnly={true}
                    />
                </div>
            </div>
            <div className="offcanvas-footer">
                <button className="w-100 border-0">Show Results</button>
            </div>
        </Offcanvas>
    )
}

export default ApplyCitationCanvas