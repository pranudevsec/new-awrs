import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Loader from "../../../components/ui/loader/Loader";
import Pagination from "../../../components/ui/pagination/Pagination";
import { awardTypeOptions, commandOptions } from "../../../data/options";
import { SVGICON } from "../../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { fetchApplicationsForHQ, fetchApplicationUnits, fetchSubordinates } from "../../../reduxToolkit/services/application/applicationService";

const ApplicationsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading, meta } = useAppSelector((state) => state.application);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";


  const [awardType, setAwardType] = useState<string | null>(null);
  const [commandType, setCommandType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedUnits, setSelectedUnits] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectUnit = (unit: any) => {
    setSelectedUnits((prev) => {
      if (prev.find((u) => u.id === unit.id)) {
        return prev.filter((u) => u.id !== unit.id);
      } else {
        return [...prev, unit];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUnits([]);
      setSelectAll(false);
    } else {
      setSelectedUnits(units);
      setSelectAll(true);
    }
  };

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
    

    if (role === "unit") {
      let totalNegativeMarks = 0;
      const totalParameterMarks = parameters.reduce((acc: number, param: any) => {
        const isRejected =
          param?.clarification_details?.clarification_status === "rejected";
        if (isRejected) return acc;
        

        if (param?.negative) {
          totalNegativeMarks += Number(param?.marks ?? 0);
          return acc; // Don't add to positive marks
        }
        

        const originalMarks = Number(param?.marks ?? 0);
        return acc + originalMarks;
      }, 0);
      return totalParameterMarks - totalNegativeMarks;
    }
    

    const graceMarks =
      unit?.fds?.applicationGraceMarks?.reduce(
        (acc: number, item: any) => acc + (item?.marks ?? 0),
        0
      ) ?? 0;
    
    let totalPositiveMarks = 0;
    let totalNegativeMarks = 0;
    
    parameters.forEach((param: any) => {
      const isRejected =
        param?.clarification_details?.clarification_status === "rejected";

      if (isRejected) return;


      const hasApprovedMarks = param?.approved_marks !== undefined &&
        param?.approved_marks !== null &&
        param?.approved_marks !== "" &&
        !isNaN(Number(param?.approved_marks)) &&
        param?.approved_by_user !== null;

      const marksToUse = hasApprovedMarks ? Number(param.approved_marks) : Number(param?.marks ?? 0);
      
      if (param?.negative) {
        totalNegativeMarks += marksToUse;
      } else {
        totalPositiveMarks += marksToUse;
      }
    });
    
    return totalPositiveMarks + graceMarks - totalNegativeMarks;
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

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    

    doc.setFontSize(16);
    doc.text("Applications List Report", 14, 22);


    const headers = [
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


    const rows = units.map((unit: any) => [
      `#${unit.id}`,
      `#${unit.unit_id}`,
      ...(role === "headquarter" ? [unit?.fds?.command ?? "-"] : []),
      new Date(unit.date_init).toLocaleDateString(),
      unit.fds?.last_date ? new Date(unit.fds.last_date).toLocaleDateString() : "-",
      unit.type.charAt(0).toUpperCase() + unit.type.slice(1),
      unit.netMarks ?? getTotalMarks(unit),
      getTotalNegativeMarks(unit),
      ...(role !== "brigade" && role !== "unit" ? [getLowerRolePriority(unit)] : []),
      ...(role === "unit" ? [unit?.status_flag ? unit.status_flag.charAt(0).toUpperCase() + unit.status_flag.slice(1) : "Submitted"] : []),
    ]);


    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      columnStyles: {
        6: { cellWidth: 60, halign: "right" }, // Total Marks column
        7: { cellWidth: 60, halign: "right" }, // Negative Marks column
      },
    });

    doc.save("applications-list.pdf");
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
        {location.pathname !== "/submitted-forms/list" && (
          <button className="btn btn-primary" onClick={handleDownloadPDF}>
            Download PDF Report
          </button>
        )}
      </div>

      <div className="filter-wrapper d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div className="search-wrapper position-relative d-flex align-items-center gap-2">
        <div className="position-relative flex-grow-1">
          <button className="border-0 bg-transparent position-absolute translate-middle-y top-50 start-0" style={{ zIndex: 10 }}>
            {SVGICON.app.search}
          </button>
          <input
            type="text"
            placeholder="Search by ID, award type, command, brigade, division, corps, unit type, location..."
            className="form-control ps-5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
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
      <thead style={{ backgroundColor: "#007bff" }}>
        <tr>
          {role === "headquarter" && (
            <th style={{ width: 50, textAlign: "center", color: "white" }}>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
          )}
          <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
            Application Id
          </th>
          <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Unit ID</th>
          {role === "headquarter" && (
            <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Command</th>
          )}
          <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
            Submission Date
          </th>
          <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Type</th>
          <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Total Marks</th>
          <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Command</th>
          {role !== "unit" && <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Arm / Service</th>}
          {role !== "unit" && <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Role / Deployment</th>}
          <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Location</th>
          {role === "unit" && (
            <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Status</th>
          )}
         
          <th style={{ width: 100, minWidth: 100, maxWidth: 100, color: "white" }}></th>
        </tr>
      </thead>

  <tbody>
  {loading ? (
    <tr>
      <td colSpan={role === "headquarter" ? 11 : (role === "unit" ? 9 : 10)}>
        <div className="d-flex justify-content-center py-5">
          <Loader inline size={40} />
        </div>
      </td>
    </tr>
  ) : (
    units.length > 0 &&
    units.map((unit: any) => {
      const canShowCheckbox =
        role === "headquarter" &&
        unit?.last_approved_by_role === "command" &&
        unit?.status_flag === "approved" &&
        unit?.is_mo_approved === true &&
        unit?.is_ol_approved === true;

      const onRowClick = () => {
        if (unit.status_flag === "draft") return;
        if (location.pathname === "/submitted-forms/list") {
          navigate(`/submitted-forms/list/${unit.id}?award_type=${unit.type}`);
        } else {
          navigate(`/applications/list/${unit.id}?award_type=${unit.type}`);
        }
      };

      const renderNetMarks = () => {
        const netMarks = unit.netMarks?.toFixed(2) ?? getTotalMarks(unit).toFixed(2);
        return netMarks;
      };

      return (
        <tr
          key={unit.id}
          onClick={onRowClick}
          style={{ cursor: "pointer" }}
        >
         {role === "headquarter" && (
  <td
    style={{ width: 200, textAlign: "center" }}
    onClick={(e) => e.stopPropagation()}
  >
    {unit?.isfinalized ? (
      <span style={{ color: "green", fontWeight: 600 }}>Finalized</span>
    ) : canShowCheckbox ? (
      <input
        type="checkbox"
        checked={selectedUnits.some((u) => u.id === unit.id)}
        onChange={() => handleSelectUnit(unit)}
      />
    ) : (
      <span className="text-muted">Not Approved</span>
    )}
  </td>
)}

          <td style={{ width: 150 }}>
            <p className="fw-4">#{unit.id}</p>
          </td>
          <td style={{ width: 150 }}>
            <p className="fw-4">#{unit.unit_id}</p>
          </td>

          {role === "headquarter" && (
            <td style={{ width: 150 }}>
              <p className="fw-4">{unit?.fds?.command}</p>
            </td>
          )}

          <td style={{ width: 200 }}>
            <p className="fw-4">
              {unit.date_init
                ? new Date(unit.date_init).toLocaleDateString()
                : "-"}
            </p>
          </td>
          <td style={{ width: 150 }}>
            <p className="fw-4">
              {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
            </p>
          </td>
          <td style={{ width: 150 }}>
            <p className="fw-4">
              {renderNetMarks()}
            </p>
          </td>
          <td style={{ width: 150 }}>
            <p className="fw-4">{unit.fds.command ?? "-"}</p>
          </td>
          {role !== "unit" && (
            <td style={{ width: 150 }}>
              <p className="fw-4">{unit.fds.arms_service ?? "-"}</p>
            </td>
          )}
          {role !== "unit" && (
            <td style={{ width: 150 }}>
              <p className="fw-4">{unit.fds.matrix_unit ?? "-"}</p>
            </td>
          )}
          <td style={{ width: 150 }}>
            <p className="fw-4">{unit.fds.location ?? "-"}</p>
          </td>

          {role === "unit" && (
            <td style={{ width: 150 }}>
              <p className="fw-4" style={{
                color: unit?.status_flag === "rejected" ? "#dc3545" : 
                       unit?.status_flag === "approved" ? "#28a745" : "inherit",
                fontWeight: unit?.status_flag === "rejected" ? "bold" : "normal"
              }}>
                {unit?.status_flag === "rejected" 
                  ? "Rejected"
                  : unit?.status_flag
                    ? unit.status_flag.charAt(0).toUpperCase() +
                      unit.status_flag.slice(1)
                    : "Submitted"}
              </p>
            </td>
          )}

          {role === "unit" && (
            <td style={{ width: 200 }}>
              <p className="fw-4" style={{ 
                color: unit?.status_flag === "rejected" ? "#dc3545" : "inherit",
                fontStyle: unit?.status_flag === "rejected" ? "italic" : "normal"
              }}>
                {unit?.status_flag === "rejected" 
                  ? "Click to view reason" 
                  : "-"}
              </p>
            </td>
          )}

          <td style={{ width: 100 }}>
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

export default ApplicationsList;