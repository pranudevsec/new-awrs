import { useState } from "react";
import { SVGICON } from "../../constants/iconsList";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb"
import ClarificationModal from "../../modals/ClarificationModal";
import FormSelect from "../../components/form/FormSelect";
import FormInput from "../../components/form/FormInput";

const awardTypeOptions: OptionType[] = [
    { value: "citation", label: "Citation" },
    { value: "clarification", label: "Clarification" },
];

const UnitClarificationDetail = () => {

    const [clarificationShow, setClarificationShow] = useState(false)

    return (
        <>
            <div className="apply-citation-section">
                <Breadcrumb
                    title="Application ID: #12345"
                    paths={[
                        { label: "Clarification", href: "/clarification" },
                        { label: "Details", href: "/clarification/1" }
                    ]}
                />
                <div className="filters-fields-area">
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
                            {/* <FormInput
                            label="Cycle Period"
                            name="cyclePeriod"
                            placeholder="Enter cycle period"
                            type="month"
                            value=""
                        /> */}
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
                                    <div className="d-flex align-items-start">Reviewers Comment</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <div className="d-flex align-items-start">Upload Doc</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="bg-transparent border-0" style={{ color: "var(--secondary-default)" }} onClick={() => setClarificationShow(true)}>{SVGICON.app.clarification2}</button>
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="submit-button-wrapper">
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="submit-btn border-0">Submit</button>
                    </div>
                </div>
            </div>
            <ClarificationModal show={clarificationShow} handleClose={() => setClarificationShow(false)} />
        </>
    )
}

export default UnitClarificationDetail