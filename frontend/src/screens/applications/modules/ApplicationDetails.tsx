import { useState } from "react";
import { SVGICON } from "../../../constants/iconsList";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import UnitClarificationModal from "../../../modals/UnitClarificationModal";
import FormSelect from "../../../components/form/FormSelect";
import FormInput from "../../../components/form/FormInput";
import ReqClarificationModal from "../../../modals/ReqClarificationModal";

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

const ApplicationDetails = () => {
    // States
    const [clarificationShow, setClarificationShow] = useState(false);
    const [reqClarificationShow, setReqClarificationShow] = useState(false);

    return (
        <>
            <div className="apply-citation-section">
                <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                    <Breadcrumb
                        title="Application ID: #12345"
                        paths={[
                            { label: "Home", href: "/applications" },
                            { label: "Application Listing", href: "/applications/list" },
                            { label: "Details", href: "/applications/list/1" },
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
                                    <div className="d-flex align-items-start">Approved Marks</div>
                                </th>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <div className="d-flex align-items-start">Add Clarification</div>
                                </th>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <div className="d-flex align-items-start">Requested Clarification</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <div className="d-flex align-items-start"></div>
                                </th>
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
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter approved marks"
                                        autoComplete="off"
                                        value="8"
                                        readOnly
                                    />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    {/* <button
                                        className="border-0 bg-transparent"
                                        style={{ color: "var(--secondary-default)" }}
                                        onClick={() => setClarificationShow(true)}
                                    >
                                        {SVGICON.app.clarification}
                                    </button> */}
                                    <p className="fw-5">Already Asked</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center" onClick={() => setReqClarificationShow(true)}>
                                        {SVGICON.app.eye}
                                    </button>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <div className="d-flex gap-3">
                                        <button className="_btn success">Accepted</button>
                                        <button className="_btn danger">Reject</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <p className="fw-5">Parameter 2</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">3</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">10</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter approved marks"
                                        autoComplete="off"
                                        value="10"
                                        readOnly
                                    />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <button
                                        className="border-0 bg-transparent"
                                        style={{ color: "var(--secondary-default)" }}
                                        onClick={() => setClarificationShow(true)}
                                    >
                                        {SVGICON.app.clarification}
                                    </button>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    -
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>

                                </td>
                            </tr>
                            <tr>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <p className="fw-5">Parameter 2</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">4</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <p className="fw-5">12</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter approved marks"
                                        autoComplete="off"
                                        value="12"
                                        readOnly
                                    />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    {/* <button
                                        className="border-0 bg-transparent"
                                        style={{ color: "var(--secondary-default)" }}
                                        onClick={() => setClarificationShow(true)}
                                    >
                                        {SVGICON.app.clarification}
                                    </button> */}
                                    <p className="fw-5">Already Asked</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center" onClick={() => setReqClarificationShow(true)}>
                                        {SVGICON.app.eye}
                                    </button>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <div className="d-flex gap-3">
                                        <button className="_btn success">Accepted</button>
                                        <button className="_btn danger">Reject</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <UnitClarificationModal
                show={clarificationShow}
                handleClose={() => setClarificationShow(false)}
            />
            <ReqClarificationModal
                show={reqClarificationShow}
                handleClose={() => setReqClarificationShow(false)}
            />
        </>
    );
};

export default ApplicationDetails;
