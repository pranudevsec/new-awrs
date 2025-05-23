import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb"
import { SVGICON } from "../../constants/iconsList";

const ClarificationDetail = () => {
    return (
        <div className="apply-citation-section">
            <Breadcrumb
                title="Application ID: #12345"
                paths={[
                    { label: "Clarification", href: "/clarification" },
                    { label: "Application #12345", href: "/clarification/1" }
                ]}
            />
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
    )
}

export default ClarificationDetail