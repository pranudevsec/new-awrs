import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { awardTypeOptions } from "../../../data/options";
import { SVGICON } from "../../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { fetchApplicationUnits, fetchSubordinates } from "../../../reduxToolkit/services/application/applicationService";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Loader from "../../../components/ui/loader/Loader";
import Pagination from "../../../components/ui/pagination/Pagination";

const ApplicationsList = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading, meta } = useAppSelector((state) => state.application);

  // States
  const [awardType, setAwardType] = useState<string | null>(null);
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
    if (!profile?.user?.user_role) return;

    const fetchData = () => {
      const params = { award_type: awardType || '', search: debouncedSearch, page, limit };
      if (profile.user.user_role !== 'unit') {
        dispatch(fetchSubordinates(params));
      } else {
        dispatch(fetchApplicationUnits(params));
      }
    };

    fetchData();
  }, [awardType, debouncedSearch, profile, page, limit]);

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Application Listing"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Application Listing", href: "/applications/list" },
          ]}
        />
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
          value={awardType}
          placeholder="Select Type"
          onChange={(option: OptionType | null) => setAwardType(option ? option.value : null)}
        />
      </div>

      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Application Id
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Unit ID</th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Submission Date
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>Dead Line</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Type</th>
              <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}></th>
            </tr>
          </thead>

          <tbody>
            {loading ?
              <tr>
                <td colSpan={6}>
                  <div className="d-flex justify-content-center py-5">
                    <Loader inline size={40} />
                  </div>
                </td>
              </tr>
              : units.length > 0 && units.map((unit: any, idx) => (
                <tr
                  key={idx}
                  onClick={() => navigate(`/applications/list/${unit.id}?award_type=${unit.type}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">#{unit.id}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">#{unit.unit_id}</p>
                  </td>
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">
                      {new Date(unit.date_init).toLocaleDateString()}
                    </p>
                  </td>
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">
                      {unit.fds?.last_date
                        ? new Date(unit.fds.last_date).toLocaleDateString()
                        : "-"}
                    </p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}</p>
                  </td>
                  {/* <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <div className="status-content approved pending d-flex align-items-center gap-3">
                      <span></span>
                      <p className="text-capitalize fw-5">Accepted</p>
                    </div>
                  </td> */}
                  <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                    <Link
                      to={`/applications/list/${unit.id}?award_type=${unit.type}`}
                      className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {SVGICON.app.eye}
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {/* Empty Data */}
      {!loading && units.length === 0 && <EmptyTable />}

      {/* Pagination */}
      {units.length > 0 && (
        <Pagination
          meta={meta}
          page={page}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
        />
      )}
    </div>
  );
};

export default ApplicationsList;
