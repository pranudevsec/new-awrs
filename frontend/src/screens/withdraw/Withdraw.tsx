import { useEffect, useState } from "react";
import { awardTypeOptions } from "../../data/options";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { fetchSubordinates, updateApplication } from "../../reduxToolkit/services/application/applicationService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import EmptyTable from "../../components/ui/empty-table/EmptyTable";
import Loader from "../../components/ui/loader/Loader";
import Pagination from "../../components/ui/pagination/Pagination";

const Withdraw = () => {
  const dispatch = useAppDispatch();

  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading, meta } = useAppSelector((state) => state.application);

  const role = profile?.user?.user_role?.toLowerCase() ?? "";

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

    return () => { clearTimeout(handler) };
  }, [searchTerm]);

  useEffect(() => {
    if (!profile?.user?.user_role) return;

    const fetchData = () => {
      const role = profile.user.user_role;

      const params = {
        award_type: awardType ?? "",
        search: debouncedSearch,
        page,
        limit,
        isGetWithdrawRequests: true,
      };
      if (role !== "unit") dispatch(fetchSubordinates(params));
    };

    fetchData();
  }, [awardType, debouncedSearch, profile, page, limit]);

  const renderWithdrawActions = (unit: any) => {
    const commonParams = {
      award_type: awardType ?? "",
      search: debouncedSearch,
      page,
      limit,
      isGetWithdrawRequests: true,
    };

    if (unit?.withdraw_status === "approved") {
      return (
        <span className="badge bg-success text-white text-nowrap">Approved</span>
      );
    }

    if (unit?.withdraw_status === "rejected") {
      return (
        <span className="badge bg-danger text-white text-nowrap">Rejected</span>
      );
    }

    return (
      <>
        <button
          type="button"
          className="_btn success text-nowrap w-sm-auto"
          onClick={() => {
            dispatch(
              updateApplication({
                id: unit?.id,
                type: unit?.type,
                withdraw_status: "approved",
              })
            ).then(() => dispatch(fetchSubordinates(commonParams)));
          }}
        >
          Accept
        </button>

        <button
          type="button"
          className="_btn danger text-nowrap w-sm-auto"
          onClick={() => {
            dispatch(
              updateApplication({
                id: unit?.id,
                type: unit?.type,
                withdraw_status: "rejected",
              })
            ).then(() => dispatch(fetchSubordinates(commonParams)));
          }}
        >
          Reject
        </button>
      </>
    );
  };

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Withdraw Requests"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Withdraw Requests", href: "/withdraw-quests" },
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
          value={awardTypeOptions.find((opt) => opt.value === awardType) ?? null}
          placeholder="Select Type"
          onChange={(option: OptionType | null) =>
            setAwardType(option ? option.value : null)
          }
        />
      </div>

      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead style={{ backgroundColor: "#007bff" }}>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Application Id
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Unit ID
              </th>
              {role === "headquarter" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                  Command
                </th>
              )}
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Submission Date
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Dead Line
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Type</th>
              <th style={{ width: 100, minWidth: 100, maxWidth: 100, color: "white" }}>
                Withdraw Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="d-flex justify-content-center py-5">
                    <Loader inline size={40} />
                  </div>
                </td>
              </tr>
            ) : (
              units.length > 0 &&
              units.map((unit: any) => (
                <tr
                  key={unit.id}
                  className="cursor-auto"
                >
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">#{unit.id}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">#{unit.unit_id}</p>
                  </td>
                  {role === "headquarter" && (
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{unit?.fds?.command}</p>
                    </td>
                  )}
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
                    <p className="fw-4">
                      {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
                    </p>
                  </td>
                  <td>
                    <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-1">
                      {renderWithdrawActions(unit)}
                    </div>
                  </td>
                </tr>
              ))
            )}
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

export default Withdraw;
