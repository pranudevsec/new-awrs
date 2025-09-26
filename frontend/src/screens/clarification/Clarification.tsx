import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SVGICON } from "../../constants/iconsList";
import { awardTypeOptions } from "../../data/options";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { getClarifications, getSubordinateClarifications } from "../../reduxToolkit/services/clarification/clarificationService";
import type { Parameter } from "../../reduxToolkit/services/parameter/parameterInterface";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import Loader from "../../components/ui/loader/Loader";
import EmptyTable from "../../components/ui/empty-table/EmptyTable";
import Pagination from "../../components/ui/pagination/Pagination";

const Clarification = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch();

  const { profile } = useAppSelector((state) => state.admin);
  const { loading, unitClarifications, meta } = useAppSelector((state) => state.clarification);

  // States 
  const [awardType, setAwardType] = useState<string | null>("");
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

  useEffect(() => {
    if (profile?.user?.user_role) {
      if (profile?.user?.user_role?.trim() === "unit") {
        dispatch(getClarifications({ awardType: awardType ?? "", search: debouncedSearch, page, limit }));
      } else {
        dispatch(getSubordinateClarifications({ awardType: awardType ?? "", search: debouncedSearch, page, limit }));
      }
    }
  }, [profile?.user?.user_role, awardType, debouncedSearch, page, limit]);

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Clarification to Resolve" />
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
              <th style={{ width: 150, color: "white" }}>Application Id</th>
              <th style={{ width: 150, color: "white" }}>Unit ID</th>
              <th style={{ width: 200, color: "white" }}>Submission Date</th>
              <th style={{ width: 200, color: "white" }}>Dead Line</th>
              <th style={{ width: 150, color: "white" }}>Type</th>
              <th style={{ width: 200, color: "white" }}>Clarifications</th>
              <th style={{ width: 100, color: "white" }}></th>
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
            ) : unitClarifications.length > 0 &&
            (unitClarifications.map((app) => {
              const clarificationsCount = app.fds.parameters.filter((p: Parameter) => p.clarification_id).length;

              return (
                <tr key={app.id} onClick={() => navigate(`/clarification/unit/${app.id}?award_type=${app.type}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ width: 150 }}><p className="fw-4">#{app.id}</p></td>
                  <td style={{ width: 150 }}><p className="fw-4">#{app.unit_id}</p></td>
                  <td style={{ width: 200 }}><p className="fw-4">{new Date(app.date_init).toLocaleDateString()}</p></td>
                  <td style={{ width: 200 }}><p className="fw-4">{new Date(app.fds.last_date).toLocaleDateString()}</p></td>
                  <td style={{ width: 150 }}><p className="fw-4">  {app.type.charAt(0).toUpperCase() + app.type.slice(1)}</p></td>
                  <td style={{ width: 200 }}>
                    <div
                      className={`status-content approved ${clarificationsCount > 0 ? 'reject' : 'pending'} d-flex align-items-center gap-3`}
                    >
                      <span></span>
                      <p className={`text-capitalize fw-5 ${clarificationsCount > 0 ? 'text-danger' : ''}`}>
                        {clarificationsCount > 0 ? `${clarificationsCount} Clarifications` : 'No Clarifications'}
                      </p>
                    </div>
                  </td>
                  <td style={{ width: 100 }}>
                    <div>
                      <Link
                        to={`/clarification/unit/${app.id}?award_type=${app.type}`}
                        className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                        onClick={e => e.stopPropagation()}
                      >
                        {SVGICON.app.eye}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            }))
            }
          </tbody>
        </table>
      </div>
      {/* Empty Data */}
      {!loading && unitClarifications.length === 0 && <EmptyTable />}
      {/* Pagination */}
      {unitClarifications.length > 0 && (
        <Pagination
          meta={meta}
          page={page}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
        />
      )}
    </div >
  );
};

export default Clarification;
