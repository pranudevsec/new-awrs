import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Loader from "../../../components/ui/loader/Loader";
import Pagination from "../../../components/ui/pagination/Pagination";
import { useAppSelector } from "../../../reduxToolkit/hooks";
import Axios from "../../../reduxToolkit/helper/axios";
import { SVGICON } from "../../../constants/iconsList";  // Import the SVGICON

// Define interfaces for the application data
interface FinalizedApplication {
  id: number;
  type: string;
  unit_id: number;
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
    isFinalized: boolean;
  is_mo_approved: boolean;
  is_ol_approved: boolean;
  last_approved_by_role: string;
}

interface FinalizedApplicationsResponse {
  success: boolean;
  data: FinalizedApplication[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
  message?: string;
}

const FinalizedApplicationsList = () => {
  const profile = useAppSelector((state) => state.admin.profile);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";

  // States
  const [applications, setApplications] = useState<FinalizedApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<FinalizedApplicationsResponse['meta'] | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
const [selectedApplications, setSelectedApplications] = useState<any>([]);

const handleCheckboxChange = (application: FinalizedApplication) => {
  setSelectedApplications((prev:any) => {
    const exists = prev.some((app:any) => app.id === application.id);
    if (exists) {
      // remove if already selected
      return prev.filter((app:any) => app.id !== application.id);
    } else {
      // add the full object
      return [...prev, application];
    }
  });
};
  useEffect(() => {
    fetchFinalizedApplications();
  }, [page, limit]);

  const fetchFinalizedApplications = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append("page", String(page));
      queryParams.append("limit", String(limit));

      const response = await Axios.get<FinalizedApplicationsResponse>(
        `/api/applications/all-app-final?${queryParams.toString()}`
      );

      if (response.data.success) {
        setApplications(response.data.data);
        setMeta(response.data.meta);
      } else {
        toast.error(response.data.message ?? "Failed to fetch finalized applications");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Error fetching finalized applications"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export functionality can be added here
    toast.success("Export functionality will be implemented");
  };

  return (
    <div className="applications-section">
      <Breadcrumb title="Finalized Applications" />

      <div className="applications-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="right-content d-flex flex-wrap align-items-center gap-3">
          <button className="_btn primary" onClick={handleExport}>
            Export
          </button>

          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={async () => {
              try {
                const applicationsForFinalized = selectedApplications.map((unit:any) => ({
                  id: unit.id,
                  type: unit.type,
                }));
          
                await Axios.post(`/api/applications/finalized`, {
                  applicationsForFinalized,
                });
          
                if (role === 'cw2' || role === 'headquarter') {
              fetchFinalizedApplications();
                }
              } catch (error) {
              }
            }}
          >
            Make it Shortlisted
          </button>
        </div>
      </div>

      <div className="table-responsive">
<table className="table-style-2 w-100">
  <thead style={{ backgroundColor: "#007bff" }}>
    <tr>
      <th style={{ width: 50, color: "white" }}>
       
      </th>
      <th style={{ width: 150, color: "white" }}>Application Id</th>
      <th style={{ width: 150, color: "white" }}>Unit Name</th>
      {role === "headquarter" && (
        <th style={{ width: 150, color: "white" }}>Command</th>
      )}
      <th style={{ width: 200, color: "white" }}>Submission Date</th>
      <th style={{ width: 150, color: "white" }}>Type</th>
      <th style={{ width: 150, color: "white" }}>Net Marks</th>
      <th style={{ width: 150, color: "white" }}>Command</th>
      {role !== "unit" && <th style={{ width: 150, color: "white" }}>Arm / Service</th>}
      <th style={{ width: 150, color: "white" }}>Location</th>
      {role === "unit" && (
        <th style={{ width: 150, color: "white" }}>Status</th>
      )}
      <th style={{ width: 100, color: "white" }}></th>
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
      applications.map((application: any) => {
        const canShowCheckbox =
          role === "headquarter" &&
          application?.last_approved_by_role === "command" &&
          application?.status_flag === "approved" &&
          application?.is_mo_approved === true &&
          application?.is_ol_approved === true;

        return (
          <tr key={application.id}>
            <td style={{ width: 50, textAlign: "center" }}>
              {application?.isfinalized ? (
                <span style={{ color: "green", fontWeight: 600 }}>Finalized</span>
              ) : canShowCheckbox ? (
              <input
  type="checkbox"
  checked={selectedApplications.some((app:any) => app.id === application.id)}
  onChange={() => handleCheckboxChange(application)}
/>
              ) : (
                <span className="text-muted">Not Approved</span>
              )}
            </td>
            <td style={{ width: 150 }}>
              <p className="fw-4">{application.id}</p>
            </td>
            <td style={{ width: 150 }}>
              <p className="fw-4">{application.unit_details.name}</p>
            </td>
            {role === "headquarter" && (
              <td style={{ width: 150 }}>
                <p className="fw-4">{application.fds.command}</p>
              </td>
            )}
            <td style={{ width: 200 }}>
              <p className="fw-4">
                {new Date(application.date_init).toLocaleDateString()}
              </p>
            </td>
            <td style={{ width: 150 }}>
              <p className="fw-4">{application.fds.award_type}</p>
            </td>
            <td style={{ width: 150 }}>
              <p className="fw-4">{application.netMarks}</p>
            </td>
            <td style={{ width: 150 }}>
              <p className="fw-4">{application.fds.command}</p>
            </td>
            {role !== "unit" && (
              <td style={{ width: 150 }}>
                <p className="fw-4">{application.fds.arms_service}</p>
              </td>
            )}
            <td style={{ width: 150 }}>
              <p className="fw-4">{application.fds.location}</p>
            </td>
            {role === "unit" && (
              <td style={{ width: 150 }}>
                <p className="fw-4">{application.status_flag}</p>
              </td>
            )}
            <td style={{ width: 100 }}>
              <Link
                to={`/applications/list/${application.id}?award_type=${application.fds.award_type}`}
                className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                onClick={(e) => e.stopPropagation()}
              >
                {SVGICON.app.eye}
              </Link>
            </td>
          </tr>
        );
      })
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

export default FinalizedApplicationsList;
