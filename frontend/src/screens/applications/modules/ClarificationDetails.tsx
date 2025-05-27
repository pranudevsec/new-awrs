import { useState } from "react";
import { SVGICON } from "../../../constants/iconsList";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import ClarificationModal from "../../../modals/ClarificationModal";
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

const ClarificationDetails = () => {
    // States
    const [clarificationShow, setClarificationShow] = useState(false);

    return (
        <>
            <div className="apply-citation-section">
                <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                    <Breadcrumb
                        title="Clarification ID: #12345"
                        paths={[
                            { label: "Home", href: "/applications" },
                            { label: "Clarification Listing", href: "/applications/clarification/list" },
                            { label: "Details", href: "/applications/clarification/1" },
                        ]}
                    />
                </div>
                <div className="table-filter-area mb-4">
                    <div className="row">
                        <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
                            <FormSelect
                                label="Award Type"
                                name="awardType"
                                options={awardTypeOptions}
                                value={
                                    awardTypeOptions.find((opt) => opt.value === "citation") ||
                                    null
                                }
                                placeholder="Select"
                                isDisabled={true}
                            />
                        </div>
                        <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
                            <FormSelect
                                label="Cycle Period"
                                name="cyclePeriod"
                                options={cyclePeriodOptions}
                                value={
                                    cyclePeriodOptions.find((opt) => opt.value === "2024 - H1") ||
                                    null
                                }
                                placeholder="Select"
                                isDisabled={true}
                            />
                        </div>
                        <div className="col-lg-3 col-sm-4">
                            <FormInput
                                label="Last Date"
                                name="lastDate"
                                placeholder="Enter last date"
                                type="date"
                                value="2025-04-15"
                                readOnly={true}
                            />
                        </div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table-style-1 w-100">
                        <thead>
                            <tr>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <div className="d-flex align-items-start">Parameter</div>
                                </th>
                                <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div className="d-flex align-items-start">Count</div>
                                </th>
                                <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div className="d-flex align-items-start">Marks</div>
                                </th>
                                <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div className="d-flex align-items-start">Document</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <div className="d-flex align-items-start">
                                        Reviewers Comment
                                    </div>
                                </th>
                                <th style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <div className="d-flex align-items-start">Upload Doc</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <div className="d-flex align-items-start">Clarification</div>
                                </th>
                                {/* <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <div className="d-flex align-items-start"></div>
                                </th> */}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <p className="fw-5">Parameter 1</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">2</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">8</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <p className="fw-4">
                                        Please upload the correct document for parameter 4
                                    </p>
                                </td>
                                <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <input
                                        type="file"
                                        className="form-control"
                                        autoComplete="off"
                                    />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button
                                        className="_btn outline"
                                        onClick={() => setClarificationShow(true)}
                                    >
                                        Add Clarification
                                    </button>
                                </td>
                                {/* <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="_btn primary">Submit</button>
                                </td> */}
                            </tr>
                            <tr>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <p className="fw-5">Parameter 1</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">2</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">8</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <p className="fw-4">
                                        Please upload the correct document for parameter 4
                                    </p>
                                </td>
                                <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <input
                                        type="file"
                                        className="form-control"
                                        autoComplete="off"
                                    />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button
                                        className="_btn outline"
                                        onClick={() => setClarificationShow(true)}
                                    >
                                        Add Clarification
                                    </button>
                                </td>
                                {/* <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="_btn primary">Submit</button>
                                </td> */}
                            </tr>
                            <tr>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <p className="fw-5">Parameter 1</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">2</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">8</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <p className="fw-4">
                                        Please upload the correct document for parameter 4
                                    </p>
                                </td>
                                <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <input
                                        type="file"
                                        className="form-control"
                                        autoComplete="off"
                                    />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button
                                        className="_btn outline"
                                        onClick={() => setClarificationShow(true)}
                                    >
                                        Add Clarification
                                    </button>
                                </td>
                                {/* <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="_btn primary">Submit</button>
                                </td> */}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <ClarificationModal
                show={clarificationShow}
                handleClose={() => setClarificationShow(false)}
            />
        </>
    );
};

export default ClarificationDetails;
