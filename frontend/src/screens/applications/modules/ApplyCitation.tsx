import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb"
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


const ApplyCitation = () => {
    const navigate = useNavigate();

    // States
    // const [filterVisible, setFilterVisible] = useState(false);

    return (
        <>
            <div className="apply-citation-section">
                <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                    <Breadcrumb
                        title="Apply for Citation"
                        paths={[
                            { label: "Applications", href: "/applications" },
                            { label: "Apply for Citation", href: "/applications/citation" }
                        ]}
                    />
                    {/* <button className="filter-btn d-inline-flex align-items-center justify-content-center gap-1 border-0 mt-sm-0 mt-3" onClick={() => setFilterVisible(true)}>
                        <span className="rotate-90">{SVGICON.app.filters}</span>Filters
                    </button> */}
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
                <div className="table-filter-area mb-4">
                    <div className="row">
                        <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
                            <FormSelect
                                label="Award Type"
                                name="awardType"
                                options={awardTypeOptions}
                                value={awardTypeOptions.find((opt) => opt.value === "citation") || null}
                                placeholder="Select award type"
                                isDisabled={true}
                            />
                        </div>
                        <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
                            <FormSelect
                                label="Cycle Period"
                                name="cyclePeriod"
                                options={cyclePeriodOptions}
                                value={cyclePeriodOptions.find((opt) => opt.value === "citation") || null}
                                placeholder="Select award type"
                            />
                        </div>
                        <div className="col-lg-3 col-sm-4">
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
                    <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-1 justify-content-end">
                        <button className="draft-btn bg-transparent">Save as Draft</button>
                        <button className="submit-btn border-0" onClick={() => navigate("/applications/thanks")}>Submit</button>
                        <button className="reject-btn">Delete</button>
                    </div>
                </div>
            </div>
            {/* <ApplyCitationCanvas show={filterVisible} handleClose={() => setFilterVisible(false)} /> */}
        </>
    )
}

export default ApplyCitation