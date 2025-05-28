import { useState } from "react";
import { Link } from "react-router-dom";
import { SVGICON } from "../../constants/iconsList";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import Pagination from "../../components/ui/pagination/Pagination";
import DeleteModal from "../../modals/DeleteModal";

const awardTypeOptions: OptionType[] = [
    { value: "citation", label: "Citation" },
    { value: "clarification", label: "Clarification" },
];

const ParametersList = () => {
    // States 
    const [deleteShow, setDeleteShow] = useState<boolean>(false);

    return (
        <>
            <div className="clarification-section">
                <div className="d-flex flex-sm-row flex-column justify-content-between mb-4">
                    <Breadcrumb title="Parameters Listing" />
                    <div className="d-flex align-items-center justify-content-end gap-3 mt-sm-0 mt-3">
                        <Link to="/parameters/add" className="_btn primary">Add Parameter</Link>
                    </div>
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
                                    <div className="d-flex align-items-start">Name</div>
                                </th>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <div className="d-flex align-items-start">Category</div>
                                </th>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <div className="d-flex align-items-start">Award Type</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <div className="d-flex align-items-start">Per unit mark</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                    <div className="d-flex align-items-start">Max marks</div>
                                </th>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                    <div className="d-flex align-items-start">Is Proof required</div>
                                </th>
                                <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div className="d-flex align-items-start"></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Rescue Ops</p>
                                </td>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Some1</p>
                                </td>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Citation</p>
                                </td>
                                <td style={{ width: 200 }}>
                                    <p className="fw-4">5</p>
                                </td>
                                <td style={{ width: 200 }}>
                                    <p className="fw-4">15</p>
                                </td>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Yes</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <Link
                                            to="/parameters/1"
                                            className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        >
                                            {SVGICON.app.edit}
                                        </Link>
                                        <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                            onClick={() => setDeleteShow(true)}
                                        >
                                            {SVGICON.app.delete}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Enemy Kills</p>
                                </td>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Some2</p>
                                </td>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Citation</p>
                                </td>
                                <td style={{ width: 200 }}>
                                    <p className="fw-4">4</p>
                                </td>
                                <td style={{ width: 200 }}>
                                    <p className="fw-4">20</p>
                                </td>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Yes</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <Link
                                            to="/parameters/1"
                                            className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        >
                                            {SVGICON.app.edit}
                                        </Link>
                                        <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                            onClick={() => setDeleteShow(true)}
                                        >
                                            {SVGICON.app.delete}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Medical Camps</p>
                                </td>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Some3</p>
                                </td>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">Appreciation</p>
                                </td>
                                <td style={{ width: 200 }}>
                                    <p className="fw-4">2</p>
                                </td>
                                <td style={{ width: 200 }}>
                                    <p className="fw-4">10</p>
                                </td>
                                <td style={{ width: 150 }}>
                                    <p className="fw-4">No</p>
                                </td>
                                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <Link
                                            to="/parameters/1"
                                            className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                        >
                                            {SVGICON.app.edit}
                                        </Link>
                                        <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                            onClick={() => setDeleteShow(true)}
                                        >
                                            {SVGICON.app.delete}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <Pagination />
            </div>
            {/* Delete Modal */}
            <DeleteModal
                titleName={`“${'Rescue Ops'}” Parameter`}
                name="Parameter"
                show={deleteShow}
                handleClose={() => setDeleteShow(false)}
            // handleDelete={handleDelete}
            />
        </>
    );
};

export default ParametersList;
