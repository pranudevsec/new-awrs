import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb"
import FormSelect from "../../components/form/FormSelect";
import { SVGICON } from "../../constants/iconsList";
import { Link } from "react-router-dom";

const awardTypeOptions: OptionType[] = [
    { value: "citation", label: "Citation" },
    { value: "clarification", label: "Clarification" },
];

const Clarification = () => {
    return (
        <div className="clarification-section">
            <Breadcrumb title="Application Listing" />
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
                <div className="search-wrapper position-relative">
                    <button className="border-0 bg-transparent position-absolute translate-middle-y top-50">{SVGICON.app.search}</button>
                    <input type="text" placeholder="search..." className="form-control" />
                </div>
                <FormSelect
                    name="awardType"
                    options={awardTypeOptions}
                    value={null}
                    placeholder="Select type"
                />
            </div>
            <div className="table-responsive">
                <table className="main-table w-100">
                    <thead>
                        <tr>
                            <th>
                                <div className="d-flex align-items-start">Application Id</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Unit ID</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Submition Date</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Dead Line</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Type</div>
                            </th>
                            <th>
                                <div className="d-flex align-items-start">Status</div>
                            </th>
                            <th style={{ width: 100, minWidth: 100 }}>
                                <div className="d-flex align-items-start"></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td>
                                <p className="fw-4">Citation</p>
                            </td>
                            <td>
                                <div className="status-content pending d-flex align-items-center gap-3">
                                    <span></span>
                                    <p className="text-capitalize fw-5">pending</p>
                                </div>
                            </td>
                            <td style={{ width: 100, minWidth: 100 }}>
                                <div>
                                    <Link to="/clarification/1" className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center">{SVGICON.app.eye}</Link>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td>
                                <p className="fw-4">Citation</p>
                            </td>
                            <td>
                                <div className="status-content approved d-flex align-items-center gap-3">
                                    <span></span>
                                    <p className="text-capitalize fw-5">Accepted</p>
                                </div>
                            </td>
                            <td style={{ width: 100, minWidth: 100 }}>
                                <div>
                                    <Link to="/clarification/1" className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center">{SVGICON.app.eye}</Link>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td>
                                <p className="fw-4">Citation</p>
                            </td>
                            <td>
                                <div className="status-content reject d-flex align-items-center gap-3">
                                    <span></span>
                                    <p className="text-capitalize fw-5">pending</p>
                                </div>
                            </td>
                            <td style={{ width: 100, minWidth: 100 }}>
                                <div>
                                    <Link to="/clarification/1" className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center">{SVGICON.app.eye}</Link>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td>
                                <p className="fw-4">#123456</p>
                            </td>
                            <td>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td>
                                <p className="fw-4">12-05-2025</p>
                            </td>
                            <td>
                                <p className="fw-4">Citation</p>
                            </td>
                            <td>
                                <div className="status-content pending d-flex align-items-center gap-3">
                                    <span></span>
                                    <p className="text-capitalize fw-5">pending</p>
                                </div>
                            </td>
                            <td style={{ width: 100, minWidth: 100 }}>
                                <div>
                                    <Link to="/clarification/1" className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center">{SVGICON.app.eye}</Link>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Clarification