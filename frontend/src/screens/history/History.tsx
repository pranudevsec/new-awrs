import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import EmptyTable from "../../components/ui/empty-table/EmptyTable";
import Loader from "../../components/ui/loader/Loader";
import Pagination from "../../components/ui/pagination/Pagination";
import { awardTypeOptions } from "../../data/options";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { fetchApplicationHistory, updateApplication, } from "../../reduxToolkit/services/application/applicationService";

const getStatusColor = (status: string) => {
  if (["pending", "in_review", "shortlisted_approved"].includes(status)) return "orange";
  if (status === "approved") return "green";
  return "red";
};

const getStatusLabel = (status: string) => {
  if (["pending", "in_review", "shortlisted_approved"].includes(status)) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const History = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading, meta } = useAppSelector((state) => state.application);

  // States
  const [awardType, setAwardType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";

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
      const params = {
        award_type: awardType || "",
        search: debouncedSearch,
        page,
        limit,
      };

      try {
        dispatch(fetchApplicationHistory(params)).unwrap();
      } catch (error: any) {
        const errorMessage = error?.errors || error?.message || "An error occurred.";

        if (error?.errors === "Please complete your unit profile before proceeding.") {
          navigate("/profile-settings");
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }

    };

    fetchData();
  }, [awardType, debouncedSearch, profile, page, limit]);

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="History"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "History", href: "/history" },
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
        <div className="d-flex gap-2">
          <FormSelect
            name="awardType"
            options={awardTypeOptions}
            value={awardTypeOptions.find((opt) => opt.value === awardType) || null}
            placeholder="Select Type"
            onChange={(option: OptionType | null) =>
              setAwardType(option ? option.value : null)
            }
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Application Id
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Unit ID
              </th>
              {role === "headquarter" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  Command
                </th>
              )}
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Submission Date
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Dead Line
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Type</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Status
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Approved By Stage
              </th>
              {role !== 'cw2' && <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Action
              </th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="d-flex justify-content-center py-5">
                    <Loader inline size={40} />
                  </div>
                </td>
              </tr>
            ) : (
              units.length > 0 &&
              units.map((unit: any) => {
                const submissionDate = new Date(unit.date_init).toLocaleDateString();
                const deadline = unit.fds?.last_date
                  ? new Date(unit.fds.last_date).toLocaleDateString()
                  : "-";
                const typeLabel = unit?.type
                  ? unit.type.charAt(0).toUpperCase() + unit.type.slice(1)
                  : "-";
                const statusLabel = unit?.status_flag
                  ? getStatusLabel(unit.status_flag)
                  : "-";
                const statusColor = getStatusColor(unit?.status_flag);

                let roleDisplay = "-";
                if (unit?.status_flag === "rejected") {
                  if (unit?.last_rejected_by_role) {
                    roleDisplay =
                      unit.last_rejected_by_role.charAt(0).toUpperCase() +
                      unit.last_rejected_by_role.slice(1);
                  }
                } else if (unit?.last_approved_by_role) {
                  roleDisplay =
                    unit.last_approved_by_role.charAt(0).toUpperCase() +
                    unit.last_approved_by_role.slice(1);
                }

                let withdrawAction = null;
                if (unit?.status_flag !== "rejected") {
                  withdrawAction = (
                    <button
                      type="button"
                      className="_btn success text-nowrap w-sm-auto"
                      onClick={() => {
                        dispatch(
                          updateApplication({
                            id: unit?.id,
                            type: unit?.type,
                            withdrawRequested: true,
                          })
                        ).then(() => {
                          const params = {
                            award_type: awardType || "",
                            search: debouncedSearch,
                            page,
                            limit,
                          };
                          dispatch(fetchApplicationHistory(params));
                        });
                      }}
                    >
                      Withdraw
                    </button>
                  );
                } else {
                  withdrawAction = (
                    <p className="fw-4" style={{ color: "red" }}>
                      Rejected
                    </p>
                  );
                }

                return (
                  <tr key={unit.id} style={{ height: 75 }} className="cursor-auto">
                    <td><p className="fw-4">#{unit.id}</p></td>
                    <td><p className="fw-4">#{unit.unit_id}</p></td>
                    {role === "headquarter" && (
                      <td><p className="fw-4">{unit?.fds?.command}</p></td>
                    )}
                    <td><p className="fw-4">{submissionDate}</p></td>
                    <td><p className="fw-4">{deadline}</p></td>
                    <td><p className="fw-4">{typeLabel}</p></td>
                    <td>
                      <p className="fw-4" style={{ color: statusColor }}>
                        {statusLabel}
                      </p>
                    </td>
                    <td><p className="fw-4">{roleDisplay}</p></td>
                    {role !== "cw2" && (
                      <td>
                        {unit?.is_withdraw_requested ? (
                          <>
                            {unit.withdraw_status === "approved" && (
                              <span className="badge bg-success text-nowrap">Withdraw Approved</span>
                            )}
                            {unit.withdraw_status === "rejected" && (
                              <span className="badge bg-danger text-nowrap">Withdraw Rejected</span>
                            )}
                            {["pending", "in_review", "shortlisted_approved"].includes(unit.withdraw_status) && (
                              <span className="badge bg-warning text-white text-nowrap">Withdraw Pending</span>
                            )}
                          </>
                        ) : (
                          withdrawAction
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
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

export default History;
