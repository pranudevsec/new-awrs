import { useState } from "react";
import FormInput from "../../components/form/FormInput";
import FormSelect from "../../components/form/FormSelect";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb"
import { SVGICON } from "../../constants/iconsList";
import UnitClarificationCanvas from "./offcanvas/UnitClarificationCanvas";

const awardTypeOptions: OptionType[] = [
    { value: "citation", label: "Citation" },
    { value: "clarification", label: "Clarification" },
];

const statusOptions: OptionType[] = [
    { value: "Paid", label: "paid" },
    { value: "Pending", label: "pending" },
    { value: "Reject", label: "reject" },
];

const ClarificationDetail = () => {
    // States
    // const [clarificationShow, setClarificationShow] = useState(false)
    const [filterVisible, setFilterVisible] = useState(false);

    return (
        <>
            <div className="apply-citation-section">
                <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                    <Breadcrumb
                        title="Application ID: #12345"
                        paths={[
                            { label: "Clarification", href: "/clarification" },
                            { label: "Details", href: "/clarification/1" }
                        ]}
                    />
                </div>

                {/* <div className="filters-fields-area">
                <div className="row align-items-center justify-content-between row-gap-2">
                    <div className="col-md-4">
                        <FormSelect
                            label="Award Type"
                            name="awardType"
                            options={awardTypeOptions}
                            value={awardTypeOptions.find((opt) => opt.value === "citation") || null}
                            placeholder="Select award type"
                            isDisabled={true}
                        />
                    </div>
                    <div className="col-md-4">
                        <FormInput
                            label="Cycle Period"
                            name="cyclePeriod"
                            placeholder="Enter cycle period"
                            type="text"
                            value="2024 - H1"
                        />
                    </div>
                    <div className="col-md-4">
                        <FormInput
                            label="Unit"
                            name="lastDate"
                            placeholder="Enter unit"
                            value=""
                            readOnly={true}
                        />
                    </div>
                </div>
            </div> */}
                <div className="table-filter-area mb-3">
                    <div className="row">
                        <div className="col-md-3">
                            <FormSelect
                                name="awardType"
                                options={awardTypeOptions}
                                // value={awardTypeOptions.find((opt) => opt.value === "citation") || null}
                                value={null}
                                placeholder="Select award type"
                            // isDisabled={true}
                            />
                        </div>
                        <div className="col-md-3">
                            <FormInput
                                name="cyclePeriod"
                                placeholder="Enter cycle period"
                                type="text"
                                value="2024 - H1"
                            />
                        </div>
                        <div className="col-md-3">
                            <FormInput
                                name="lastDate"
                                placeholder="Enter unit"
                                value=""
                                readOnly={true}
                            />
                        </div>
                        <div className="col-md-3">
                            <FormSelect
                                name="awardType"
                                options={statusOptions}
                                value={null}
                                placeholder="Select status"
                            // isDisabled={true}
                            />
                        </div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="main-table w-100">
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
                                <th style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div className="d-flex align-items-start">Clarification</div>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
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
                                    <input type="text" className="form-control" placeholder="Enter approved marks" autoComplete="off" value="0" readOnly />
                                </td>
                                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                                    <div style={{ color: "var(--secondary-default)" }}>{SVGICON.app.clarification}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="submit-button-wrapper">
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="accept-btn border-0">Accepted</button>
                        <button className="reject-btn border-0">Reject</button>
                    </div>
                </div>
            </div>
            <UnitClarificationCanvas show={filterVisible} handleClose={() => setFilterVisible(false)} />
        </>
    )
}

export default ClarificationDetail