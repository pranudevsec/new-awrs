import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Loader from "../../../components/ui/loader/Loader";
import Pagination from "../../../components/ui/pagination/Pagination";
import { awardTypeOptions, commandOptions } from "../../../data/options";
import { SVGICON } from "../../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { fetchApplicationsForHQ, fetchApplicationUnits, fetchSubordinates } from "../../../reduxToolkit/services/application/applicationService";
import * as XLSX from "xlsx";

const ApplicationsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading, meta } = useAppSelector((state) => state.application);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";

  // States
  const [awardType, setAwardType] = useState<string | null>(null);
  const [commandType, setCommandType] = useState<string | null>(null);
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

    const fetchData = async () => {
      const role = profile.user.user_role;
      const params = {
        ...(awardType && awardType !== "All" ? { award_type: awardType } : {}),
        command_type: commandType === "All" ? undefined : commandType ?? undefined,
        search: debouncedSearch,
        page,
        limit,
      };

      if (role === 'cw2' || role === 'headquarter') {
        dispatch(fetchApplicationsForHQ(params));
      } else if (role !== 'unit') {
        const updatedParams = {
          ...params,
          isGetNotClarifications: true,
        };

        try {
          await dispatch(fetchSubordinates(updatedParams)).unwrap();
        } catch (error: any) {
          const errorMessage = error?.errors ?? error?.message ?? "An error occurred.";

          if (error?.errors === "Please complete your unit profile before proceeding.") {
            navigate("/profile-settings");
            toast.error(errorMessage);
          } else {
            toast.error(errorMessage);
          }
        }
      } else {
        dispatch(fetchApplicationUnits(params));
      }
    };

    fetchData();
  }, [awardType, commandType, debouncedSearch, profile, page, limit]);

  const hierarchy = ["unit", "brigade", "division", "corps", "command"];

  const getTotalMarks = (unit: any): number => {
    const parameters = unit?.fds?.parameters ?? [];
    const graceMarks =
      unit?.fds?.applicationGraceMarks?.reduce(
        (acc: number, item: any) => acc + (item?.marks ?? 0),
        0
      ) ?? 0;
    let totalNegativeMarks = 0;
    const totalParameterMarks = parameters.reduce((acc: number, param: any) => {
      const isRejected =
        param?.clarification_details?.clarification_status === "rejected";
      if (isRejected) return acc;
      const hasValidApproved =
        param?.approved_marks !== undefined &&
        param?.approved_marks !== null &&
        param?.approved_marks !== "" &&
        !isNaN(Number(param?.approved_marks));
      const approved = hasValidApproved ? Number(param.approved_marks) : null;
      let original = 0;
      if (param?.negative) {
        totalNegativeMarks += Number(param?.marks ?? 0);
      } else {
        original = Number(param?.marks ?? 0);
      }
      return acc + (approved ?? original);
    }, 0);
    return totalParameterMarks + graceMarks - totalNegativeMarks;
  };

  const getTotalNegativeMarks = (unit: any): number => {
    const parameters = unit?.fds?.parameters ?? [];
    return parameters.reduce((acc: number, param: any) => {
      if (param?.negative) {
        return acc + Number(param?.marks ?? 0);
      }
      return acc;
    }, 0);
  };

  const getLowerRolePriority = (unit: any) => {
    const role = profile?.user?.user_role?.toLowerCase() ?? "";
    const lowerRole = hierarchy[hierarchy.indexOf(role) - 1] ?? null;
    if (!lowerRole || !unit?.fds?.applicationPriority) return "-";
    const priorityEntry = unit?.fds.applicationPriority.find(
      (p: any) => p.role?.toLowerCase() === lowerRole
    );
    return priorityEntry?.priority ?? "-";
  };

  const handleDownloadExcel = () => {
    let col = [
      "Application Id",
      "Unit ID",
      ...(role === "headquarter" ? ["Command"] : []),
      "Submission Date",
      "Dead Line",
      "Type",
      "Total Marks",
      "Negative Marks",
      ...(role !== "brigade" && role !== "unit" ? ["Lower Role Priority"] : []),
      ...(role === "unit" ? ["Status"] : []),
    ];
    let rows = units.map((unit: any) => [
      `#${unit.id}`,
      `#${unit.unit_id}`,
      ...(role === "headquarter" ? [unit?.fds?.command ?? "-"] : []),
      new Date(unit.date_init).toLocaleDateString(),
      unit.fds?.last_date ? new Date(unit.fds.last_date).toLocaleDateString() : "-",
      unit.type.charAt(0).toUpperCase() + unit.type.slice(1),
      getTotalMarks(unit),
      getTotalNegativeMarks(unit),
      ...(role !== "brigade" && role !== "unit" ? [getLowerRolePriority(unit)] : []),
      ...(role === "unit" ? [unit?.status_flag ? unit.status_flag.charAt(0).toUpperCase() + unit.status_flag.slice(1) : "Submitted"] : []),
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([col, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
    XLSX.writeFile(workbook, "applications-list.xlsx");
  };

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Applications"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Applications", href: "/applications/list" },
          ]}
        />
        <button className="btn btn-primary" onClick={handleDownloadExcel}>
          Download Excel
        </button>
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
        <div className="d-flex flex-wrap align-items-center gap-2">
          <FormSelect
            name="awardType"
            options={awardTypeOptions}
            value={awardTypeOptions.find((opt) => opt.value === awardType) ?? null}
            onChange={(option) => setAwardType(option?.value ?? null)}
            placeholder="Select Type"
          />
          {profile?.user?.user_role === "headquarter" &&
            <FormSelect
              name="commandType"
              options={commandOptions}
              value={commandOptions.find((opt) => opt.value === commandType) ?? null}
              onChange={(option) => setCommandType(option?.value ?? null)}
              placeholder="Select Command Type"
            />
          }
        </div>
      </div>

      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Application Id
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Unit ID</th>
              {role === "headquarter" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Command</th>
              )}
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Submission Date
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>Dead Line</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Type</th>
              {/* New columns */}
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Total Marks</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Negative Marks</th>
              {role !== "brigade" && role !== "unit" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Lower Role Priority</th>
              )}
              {role === "unit" && (<th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Status</th>)}
              <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}></th>
              <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}></th>
            </tr>
          </thead>

          <tbody>
            {loading ?
              <tr>
                <td colSpan={10}>
                  <div className="d-flex justify-content-center py-5">
                    <Loader inline size={40} />
                  </div>
                </td>
              </tr>
              : units.length > 0 && units.map((unit: any) => (
                <tr
                  key={unit.id}
                  onClick={() => {
                    if (unit.status_flag === "draft") return; // Prevent navigation

                    if (location.pathname === "/submitted-forms/list") {
                      navigate(`/submitted-forms/list/${unit.id}?award_type=${unit.type}`);
                    } else {
                      navigate(`/applications/list/${unit.id}?award_type=${unit.type}`);
                    }
                  }}

                  style={{ cursor: "pointer" }}
                >
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">#{unit.id}</p>
                  </td>

                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">#{unit.unit_id}</p>
                  </td>
                  {role === "headquarter" && <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit?.fds?.command}</p>
                  </td>}
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
                  {/* New columns */}
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{getTotalMarks(unit).toFixed(2)}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{getTotalNegativeMarks(unit)}</p>
                  </td>
                  {role !== "brigade" && (
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{getLowerRolePriority(unit)}</p>
                    </td>
                  )}
                  {role === "unit" && (
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">
                        {unit?.status_flag
                          ? unit.status_flag.charAt(0).toUpperCase() + unit.status_flag.slice(1)
                          : "Submitted"}
                      </p>
                    </td>
                  )}
                  <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                    {unit?.status_flag === "draft" ? (
                      <Link
                        to={`/applications/${unit.type}?id=${unit?.id}`}
                        className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {SVGICON.app.edit}
                      </Link>
                    ) : (
                      <Link
                        to={`/applications/list/${unit.id}?award_type=${unit.type}`}
                        className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {SVGICON.app.eye}
                      </Link>
                    )}
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