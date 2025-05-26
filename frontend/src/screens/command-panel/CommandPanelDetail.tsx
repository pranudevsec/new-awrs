import { useState } from "react";
import { SVGICON } from "../../constants/iconsList";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb"
import ClarificationModal from "../../modals/ClarificationModal";
import UnitClarificationCanvas from "../clarification/offcanvas/UnitClarificationCanvas";


const CommandPanelDetail = () => {
    // States
    const [clarificationShow, setClarificationShow] = useState(false)
    const [filterVisible, setFilterVisible] = useState(false);

    return (
        <>
            <div className="apply-citation-section d-flex flex-column h-100">
                <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                    <Breadcrumb
                        title="Application ID: #12345"
                        paths={[
                            { label: "Scoreboard", href: "/command-panel" },
                            { label: "Details", href: "/command-panel/1" }
                        ]}
                    />
                    <button className="filter-btn d-inline-flex align-items-center justify-content-center gap-1 border-0 mt-sm-0 mt-3" onClick={() => setFilterVisible(true)}>
                        <span className="rotate-90">{SVGICON.app.filters}</span>Filters
                    </button>
                </div>
                {/* <div className="filters-fields-area flex-shrink-0">
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
                <div className="table-responsive flex-shrink-0">
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
                                <th style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <div className="d-flex align-items-start">Upload Doc</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <div className="d-flex align-items-start">Clarification</div>
                                </th>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
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
                                    <p className="fw-4">Please upload the correct  document for parameter 4</p>
                                </td>
                                <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        onClick={() => setClarificationShow(true)}>{SVGICON.app.edit}
                                    </button>
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="submit-btn">Submit</button>
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
                                <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        onClick={() => setClarificationShow(true)}>{SVGICON.app.edit}
                                    </button>
                                </td>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <button className="submit-btn">Submit</button>
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
                                <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        onClick={() => setClarificationShow(true)}>{SVGICON.app.edit}
                                    </button>
                                </td>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <button className="submit-btn">Submit</button>
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
                                <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        onClick={() => setClarificationShow(true)}>{SVGICON.app.edit}
                                    </button>
                                </td>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <button className="submit-btn">Submit</button>
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
                                <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        onClick={() => setClarificationShow(true)}>{SVGICON.app.edit}
                                    </button>
                                </td>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <button className="submit-btn">Submit</button>
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
                                <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                                    <input type="file" className="form-control" autoComplete="off" />
                                </td>
                                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        onClick={() => setClarificationShow(true)}>{SVGICON.app.edit}
                                    </button>
                                </td>
                                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <button className="submit-btn">Submit</button>
                                </td>
                            </tr>
                            {/* <tr>
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
                            </tr> */}
                        </tbody>
                    </table>
                </div>
                {/* <div className="submit-button-wrapper">
                    <div className="d-flex gap-3 justify-content-end">
                        <button className="submit-btn border-0">Submit</button>
                    </div>
                </div> */}
            </div>
            <ClarificationModal show={clarificationShow} handleClose={() => setClarificationShow(false)} />
            <UnitClarificationCanvas show={filterVisible} handleClose={() => setFilterVisible(false)} />
        </>
    )
}

export default CommandPanelDetail