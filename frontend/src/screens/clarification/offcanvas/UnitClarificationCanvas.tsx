import type { FC } from "react"
import { SVGICON } from "../../../constants/iconsList";
import Offcanvas from "react-bootstrap/Offcanvas";
import FormSelect from "../../../components/form/FormSelect";
import FormInput from "../../../components/form/FormInput";

const awardTypeOptions: OptionType[] = [
    { value: "citation", label: "Citation" },
    { value: "clarification", label: "Clarification" },
];

const statusOptions: OptionType[] = [
    { value: "Paid", label: "paid" },
    { value: "Pending", label: "pending" },
    { value: "Reject", label: "reject" },
];

interface UnitClarificationCanvasProps {
    show: boolean;
    handleClose: () => void;
}

const UnitClarificationCanvas: FC<UnitClarificationCanvasProps> = ({ show, handleClose }) => {
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
                        name="awardType"
                        options={awardTypeOptions}
                        value={null}
                        placeholder="Select award type"
                    />
                </div>
                <div className="mb-4">
                    <FormInput
                        name="cyclePeriod"
                        placeholder="Enter cycle period"
                        type="text"
                        value="2024 - H1"
                    />
                </div>
                <div className="mb-4">
                    <FormInput
                        name="unit"
                        placeholder="Enter unit"
                        value=""
                        readOnly={true}
                    />
                </div>
                <div className="mb-4">
                    <FormSelect
                        name="awardType"
                        options={statusOptions}
                        value={null}
                        placeholder="Select status"
                    />
                </div>
            </div>
            <div className="offcanvas-footer">
                <button className="w-100 border-0">Show Results</button>
            </div>
        </Offcanvas>
    )
}

export default UnitClarificationCanvas