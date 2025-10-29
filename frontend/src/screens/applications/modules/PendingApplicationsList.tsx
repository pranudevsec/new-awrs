import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Loader from "../../../components/ui/loader/Loader";
import Pagination from "../../../components/ui/pagination/Pagination";
import { awardTypeOptions } from "../../../data/options";
import { SVGICON } from "../../../constants/iconsList";
import { useAppSelector } from "../../../reduxToolkit/hooks";
import Axios from "../../../reduxToolkit/helper/axios";
import { formatCompactDateTime } from "../../../utils/dateUtils";

interface PendingApplication {
  id: number;
  type: string;
  unit_id: number;
  // Approval flags
  is_mo_approved?: boolean;
  is_ol_approved?: boolean;
  unit_details: {
    unit_id: number;
    name: string;
    comd: string;
    unit_type: string;
    location: string;
  };
  date_init: string;
  fds: {
    award_type: string;
    command: string;
    arms_service: string;
    location: string;
  };
  status_flag: string;
  totalMarks: number;
  totalNegativeMarks: number;
  netMarks: number;
}

interface PendingApplicationsResponse {
  success: boolean;
  data: PendingApplication[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
  message?: string;
}

const PendingApplicationsList = () => {
  const profile = useAppSelector((state) => state.admin.profile);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";


  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PendingApplicationsResponse['meta'] | null>(null);
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
    fetchPendingApplications();
  }, [awardType, debouncedSearch, page, limit]);

  const fetchPendingApplications = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (awardType && awardType !== "All") {
        queryParams.append("award_type", awardType);
      }
      if (debouncedSearch) {
        queryParams.append("search", debouncedSearch);
      }
      queryParams.append("page", String(page));
      queryParams.append("limit", String(limit));

      const response = await Axios.get<PendingApplicationsResponse>(
        `/api/applications/all-app-pending?${queryParams.toString()}`
      );

      if (response.data.success) {
        setApplications(response.data.data);
        setMeta(response.data.meta);
      } else {
        toast.error(response.data.message ?? "Failed to fetch pending applications");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Error fetching pending applications"
      );
    } finally {
      setLoading(false);
    }
  };

  // no export on pending page per requirement

  return (
    <div className="applications-section">
      <Breadcrumb
        title="Pending Applications"
      />

      <div className="applications-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        {/* LEFT: Search */}
        <div className="left-content d-flex flex-wrap align-items-center gap-3 flex-grow-1">
          <div className="search-box w-100" style={{ maxWidth: 480 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID, award type, command, brigade, division, corps, unit type, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* RIGHT: Filters */}
        <div className="right-content d-flex flex-wrap align-items-center gap-3">
          <FormSelect
            name="awardType"
            label="Award Type"
            value={awardTypeOptions.find((opt) => opt.value === (awardType ?? 'All')) ?? awardTypeOptions[0]}
            onChange={(option: any) => setAwardType(option?.value ?? null)}
            options={[...awardTypeOptions]}
            placeholder="Select Award Type"
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead style={{ backgroundColor: "#007bff" }}>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Application Id
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Unit Name</th>
              {role === "headquarter" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Command</th>
              )}
              {role === "headquarter" && (
                <>
                  <th style={{ width: 100, minWidth: 100, maxWidth: 120, color: "white" }}>MO</th>
                  <th style={{ width: 100, minWidth: 100, maxWidth: 120, color: "white" }}>OL</th>
                </>
              )}
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Submission Date
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Type</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Net Marks</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Command</th>
              {role !== "unit" && <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Arm / Service</th>}
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Location</th>
              {role === "unit" && (<th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Status</th>)}
              <th style={{ width: 100, minWidth: 100, maxWidth: 100, color: "white" }}></th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="text-center">
                  <Loader />
                </td>
              </tr>
            ) : (
              applications.length > 0 &&
              applications.map((application: PendingApplication) => (
                <tr key={application.id}>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{application.id}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{application.unit_details.name}</p>
                  </td>
                  {role === "headquarter" && (
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{application.fds.command}</p>
                    </td>
                  )}
                {role === "headquarter" && (
                  <>
                    <td style={{ width: 100, minWidth: 100, maxWidth: 120 }}>
                      <p className="fw-4">{application.is_mo_approved ? "True" : "False"}</p>
                    </td>
                    <td style={{ width: 100, minWidth: 100, maxWidth: 120 }}>
                      <p className="fw-4">{application.is_ol_approved ? "True" : "False"}</p>
                    </td>
                  </>
                )}
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">
                      {formatCompactDateTime(application.date_init)}
                    </p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{application.fds.award_type}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{application.netMarks}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{application.fds.command}</p>
                  </td>
                  {role !== "unit" && (
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{application.fds.arms_service}</p>
                    </td>
                  )}
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{application.fds.location}</p>
                  </td>
                  {role === "unit" && (
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{application.status_flag}</p>
                    </td>
                  )}
                  <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                    <Link
                      to={`/applications/list/${application.id}?award_type=${application.fds.award_type}`}
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
      {!loading && applications.length === 0 && <EmptyTable />}

      {/* Pagination */}
      {applications.length > 0 && meta && (
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

export default PendingApplicationsList;
