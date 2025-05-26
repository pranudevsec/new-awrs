import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SVGICON } from "../../../constants/iconsList";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb"
import ApplyCitationCanvas from "../offcanvas/ApplyCitationCanvas";

const ApplyCitation = () => {
    const navigate = useNavigate();

    // States
    const [filterVisible, setFilterVisible] = useState(false);

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
                    <button className="filter-btn d-inline-flex align-items-center justify-content-center gap-1 border-0 mt-sm-0 mt-3" onClick={() => setFilterVisible(true)}>
                        <span className="rotate-90">{SVGICON.app.filters}</span>Filters
                    </button>
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
            <ApplyCitationCanvas show={filterVisible} handleClose={() => setFilterVisible(false)} />
        </>
    )
}

export default ApplyCitation