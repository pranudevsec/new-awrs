import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { unwrapResult } from "@reduxjs/toolkit";
import { SVGICON } from "../../constants/iconsList";
import { awardTypeOptions } from "../../data/options";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { deleteParameter, fetchParameters } from "../../reduxToolkit/services/parameter/parameterService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import Pagination from "../../components/ui/pagination/Pagination";
import DeleteModal from "../../modals/DeleteModal";
import Loader from "../../components/ui/loader/Loader";
import EmptyTable from "../../components/ui/empty-table/EmptyTable";

const ParametersList = () => {
    const dispatch = useAppDispatch();

    const { loading, parameters, meta } = useAppSelector((state) => state.parameter);

    // States
    const [id, setId] = useState<string>("");
    const [awardType, setAwardType] = useState<string | null>("");
    const [deleteShow, setDeleteShow] = useState<boolean>(false);
    const [selectedParam, setSelectedParam] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const fetchParametersList = async () => {
        await dispatch(fetchParameters({ awardType: awardType ?? "", search: debouncedSearch, page, limit }));
    };

    const handleDelete = async () => {
        const resultAction = await dispatch(deleteParameter({ id }));
        setDeleteShow(false);
        const result = unwrapResult(resultAction);
        if (result.success) fetchParametersList();
    };

    useEffect(() => {
        fetchParametersList();
    }, [awardType, debouncedSearch, page, limit])

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
                        <input
                            type="text"
                            placeholder="search..."
                            className="form-control"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <FormSelect
                        name="awardType"
                        options={awardTypeOptions}
                        value={awardTypeOptions.find((opt) => opt.value === awardType) ?? null}
                        onChange={(option) => setAwardType(option?.value ?? null)}
                        placeholder="Select Type"
                    />
                </div>
                <div className="table-responsive">
                    <table className="table-style-2 w-100">
                        <thead style={{ backgroundColor: "#007bff" }}>
                            <tr>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                                    <div className="d-flex align-items-start">Name</div>
                                </th>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                                    <div className="d-flex align-items-start">Category</div>
                                </th>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                                    <div className="d-flex align-items-start">Award Type</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                                    <div className="d-flex align-items-start">Per unit mark</div>
                                </th>
                                <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                                    <div className="d-flex align-items-start">Max marks</div>
                                </th>
                                <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                                    <div className="d-flex align-items-start">Is Proof required</div>
                                </th>
                                <th style={{ width: 100, minWidth: 100, maxWidth: 100, color: "white" }}>
                                    <div className="d-flex align-items-start"></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="d-flex justify-content-center py-5">
                                            <Loader inline size={40} />
                                        </div>
                                    </td>
                                </tr>
                            ) : parameters.length > 0 && (
                                parameters.map((item) => (
                                    <tr key={item.param_id}>
                                        <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                            <p className="fw-4">{item.name}</p>
                                        </td>
                                        <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                            <p className="fw-4">{item.category}</p>
                                        </td>
                                        <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                            <p className="fw-4">{item.award_type}</p>
                                        </td>
                                        <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                            <p className="fw-4">{item.per_unit_mark}</p>
                                        </td>
                                        <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                                            <p className="fw-4">{item.max_marks}</p>
                                        </td>
                                        <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                                            <p className="fw-4">{item.proof_reqd ? "Yes" : "No"}</p>
                                        </td>
                                        <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <Link
                                                    to={`/parameters/${item.param_id}`}
                                                    state={item}
                                                    className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                                >
                                                    {SVGICON.app.edit}
                                                </Link>
                                                <button className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                                                    onClick={() => {
                                                        setSelectedParam(item.name);
                                                        setId(item.param_id);
                                                        setDeleteShow(true);
                                                    }}
                                                >
                                                    {SVGICON.app.delete}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Empty Data */}
                {!loading && parameters.length === 0 && <EmptyTable />}

                {/* Pagination */}
                {parameters.length > 0 && (
                    <Pagination
                        meta={meta}
                        page={page}
                        limit={limit}
                        setPage={setPage}
                        setLimit={setLimit}
                    />
                )}
            </div>

            {/* Delete Modal */}
            <DeleteModal
                titleName={`“${selectedParam}” Parameter`}
                name="Parameter"
                show={deleteShow}
                handleClose={() => setDeleteShow(false)}
                handleDelete={handleDelete}
            />
        </>
    );
};

export default ParametersList;
