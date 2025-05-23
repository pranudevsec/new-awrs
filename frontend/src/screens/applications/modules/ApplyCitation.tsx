import { useNavigate } from "react-router-dom";
import FormInput from "../../../components/form/FormInput"
import FormSelect from "../../../components/form/FormSelect";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb"

const awardTypeOptions: OptionType[] = [
    { value: "citation", label: "Citation" },
    { value: "clarification", label: "Clarification" },
];

const ApplyCitation = () => {
    const navigate = useNavigate();

    return (
        <div className="apply-citation-section">
            <Breadcrumb
                title="Apply for Citation"
                paths={[
                    { label: "Applications", href: "/applications" },
                    { label: "Apply for Citation", href: "/applications/citation" }
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
                            label="Last Date"
                            name="lastDate"
                            type="date"
                            placeholder="Enter last date"
                            value={new Date().toISOString().split("T")[0]}
                            readOnly={true}
                        />
                    </div>
                </div>
            </div>
            <div className="table-responsive">
                <table className="main-table w-100">
                    <thead>
                        <tr>
                            <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <div className="d-flex align-items-start">Parameter</div>
                            </th>
                            <th style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="d-flex align-items-start">Count</div>
                            </th>
                            <th style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="d-flex align-items-start">Marks</div>
                            </th>
                            <th style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="d-flex align-items-start">Upload</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-5">Enemy Kills</p>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-5">Parameter 2</p>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-5">Parameter 3</p>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-5">Parameter 4</p>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-5">Parameter 5</p>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-5">Parameter 6</p>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="submit-button-wrapper">
                <div className="d-flex  gap-3 justify-content-end">
                    <button className="draft-btn bg-transparent">Save as Draft</button>
                    <button className="submit-btn border-0" onClick={() => navigate("/applications/thanks")}>Submit</button>
                </div>
            </div>
        </div>
    )
}

export default ApplyCitation