import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { SVGICON } from "../../../constants/iconsList";
import { fetchApplicationUnits, fetchSubordinates } from "../../../reduxToolkit/services/application/applicationService";
import { awardTypeOptions } from "../../../data/options";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import Loader from "../../../components/ui/loader/Loader";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Pagination from "../../../components/ui/pagination/Pagination";

const ClarificationRaisedList = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { profile } = useAppSelector((state) => state.admin);
  const { units, loading, meta } = useAppSelector((state) => state.application);

  // States
  const [awardType, setAwardType] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    if (!profile?.user?.user_role) return;

    const fetchData = () => {
      const params = {
        ...(awardType && awardType !== "All" ? { award_type: awardType } : {}),
        search,
        page,
        limit
      };
      if (profile.user.user_role !== 'unit') {
        dispatch(fetchSubordinates(params));
      } else {
        dispatch(fetchApplicationUnits(params));
      }
    };

    fetchData();
  }, [awardType, search, profile, page, limit]);

  const filteredUnits = useMemo(() => {
    return Array.isArray(units)
      ? units.filter((unit: any) => unit.clarifications_count > 0)
      : [];
  }, [units]);

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Clarification Raised"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Clarification Raised", href: "/applications/raised-list" },
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FormSelect
          name="awardType"
          options={awardTypeOptions}
          value={awardTypeOptions.find((opt) => opt.value === awardType) ?? null}
          placeholder="Select Type"
          onChange={(option) => setAwardType(option?.value ?? null)}
        />
      </div>

      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead style={{ backgroundColor: "#007bff" }}>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Application Id
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Unit ID</th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Submission Date
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>Dead Line</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Type</th>
              <th style={{ width: 100, minWidth: 100, maxWidth: 100, color: "white" }}></th>
            </tr>
          </thead>

          <tbody>
            {loading ?
              (<tr>
                <td colSpan={7}>
                  <div className="d-flex justify-content-center py-5">
                    <Loader inline size={40} />
                  </div>
                </td>
              </tr>
              ) : filteredUnits.length > 0 && (
                filteredUnits.map((unit: any) => (
                  <tr
                    key={unit.id}
                    onClick={() => navigate(`/applications/list/${unit.id}?award_type=${unit.type}&raised_clarifications=true`)}
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
                      <p className="fw-4">  {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}</p>
                    </td>
                    <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                      <Link
                        to={`/applications/list/${unit.id}?award_type=${unit.type}&raised_clarifications=true`}
                        className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {SVGICON.app.eye}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>

      {/* Empty Data */}
      {!loading && filteredUnits.length === 0 && <EmptyTable />}

      {/* Pagination */}
      {filteredUnits.length > 0 && (
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

export default ClarificationRaisedList;
