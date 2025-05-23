import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb"
import { SVGICON } from "../../constants/iconsList";

const ClarificationDetail = () => {
    return (
        <div className="apply-citation-section">
            <Breadcrumb
                title="Application ID: #12345"
                paths={[
                    { label: "Clarification", href: "/clarification" },
                    { label: "Clarification Detail", href: "/clarification/1" }
                ]}
            />
            <div className="table-responsive">
                <table className="main-table w-100">
                    <thead>
                        <tr>
                            <th>
                                <div className="d-flex align-items-start">Parameter</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Count</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Marks</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Document</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Reviewers Comment</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Upload Doc</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Clarification</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
                                <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
                                <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
                                <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
                                <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
                                <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
                                <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
                                <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
                                <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
                                <input type="text" className="form-control" autoComplete="off" value="Lorem, ipsum dolor sit amet consectetur adipisicing elit." />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td>
                                <p className="fw-5">2</p>
                            </td>
                            <td>
                                <p className="fw-5">8</p>
                            </td>
                            <td>
                                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                            </td>
                            <td>
                                <p className="fw-4">Please upload the correct  document for parameter 4</p>
                            </td>
                            <td>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                            <td>
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
    )
}

export default ClarificationDetail