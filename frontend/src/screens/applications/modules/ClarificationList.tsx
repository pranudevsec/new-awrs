import { Link, useNavigate } from "react-router-dom";
import { SVGICON } from "../../../constants/iconsList";
import { awardTypeOptions } from "../../../data/options";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";

const ClarificationList = () => {
    const navigate = useNavigate();

    return (
        <div className="clarification-section">
            <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                <Breadcrumb
                    title="Clarification Listing"
                    paths={[
                        { label: "Home", href: "/applications" },
                        { label: "Clarification Listing", href: "/applications/clarification/list" },
                    ]}
                />
            </div>
            <div className="filter-wrapper d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="search-wrapper position-relative">
                    <button className="border-0 bg-transparent position-absolute translate-middle-y top-50">
                        {SVGICON.app.search}
                    </button>
                    <input type="text" placeholder="search..." className="form-control" />
                </div>
                <FormSelect
                    name="awardType"
                    options={awardTypeOptions}
                    value={null}
                    placeholder="Select Type"
                />
            </div>
            <div className="table-responsive">
                <table className="table-style-2 w-100">
                    <thead>
                        <tr>
                            <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                <div className="d-flex align-items-start">Application Id</div>
                            </th>
                            <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                <div className="d-flex align-items-start">Unit ID</div>
                            </th>
                            <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <div className="d-flex align-items-start">Submission Date</div>
                            </th>
                            <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <div className="d-flex align-items-start">Dead Line</div>
                            </th>
                            <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                <div className="d-flex align-items-start">Type</div>
                            </th>
                            <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <div className="d-flex align-items-start">Clarifications</div>
                            </th>
                            <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                <div className="d-flex align-items-start"></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr onClick={() => navigate("/applications/clarification/list/1")}>
                            <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                <p className="fw-4">Citation</p>
                            </td>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <div className="status-content approved reject d-flex align-items-center gap-3">
                                    <span></span>
                                    <p className="text-capitalize text-danger fw-5">3 Clarifications</p>
                                </div>
                            </td>
                            <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                <div>
                                    <Link
                                        to="/applications/list/1"
                                        className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                    >
                                        {SVGICON.app.eye}
                                    </Link>
                                </div>
                            </td>
                        </tr>
                        <tr onClick={() => navigate("/applications/clarification/list/1")}>
                            <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                <p className="fw-4">Citation</p>
                            </td>
                            <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                <div className="status-content approved pending d-flex align-items-center gap-3">
                                    <span></span>
                                    <p className="text-capitalize fw-5">No Clarifications</p>
                                </div>
                            </td>
                            <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                <div>
                                    <Link
                                        to="/applications/list/1"
                                        className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                    >
                                        {SVGICON.app.eye}
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* <Pagination /> */}
        </div >
    );
};

export default ClarificationList;
