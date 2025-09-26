import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import EmptyTable from "../../components/ui/empty-table/EmptyTable";
import Loader from "../../components/ui/loader/Loader";
import Pagination from "../../components/ui/pagination/Pagination";
import { awardTypeOptions, brigadeOptions, commandOptions, corpsOptions, divisionOptions } from "../../data/options";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { fetchAllApplications } from "../../reduxToolkit/services/application/applicationService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const TrackApplications = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading, meta } = useAppSelector((state) => state.application);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";

  // States
  const [awardType, setAwardType] = useState<string | null>(null);
  const [commandType, setCommandType] = useState<string | null>(null);
  const [corpsType, setCorpsType] = useState<string | null>(null);
  const [divisionType, setDivisionType] = useState<string | null>(null);
  const [brigadeType, setBrigadeType] = useState<string | null>(null);
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
    const fetchData = async () => {
      const params = {
        ...(awardType && awardType !== "All" ? { award_type: awardType } : {}),
        command_type: commandType === "All" ? undefined : commandType ?? undefined,
        division_type: divisionType === "All" ? undefined : divisionType ?? undefined,
        corps_type: corpsType === "All" ? undefined : corpsType ?? undefined,
        brigade_type: brigadeType === "All" ? undefined : brigadeType ?? undefined,
        search: debouncedSearch,
        page,
        limit,
      };
      try {
        await dispatch(fetchAllApplications(params)).unwrap();
      } catch (error: any) {
        const errorMessage = error?.errors ?? error?.message ?? "An error occurred.";

        if (error?.errors === "Please complete your unit profile before proceeding.") {
          navigate("/profile-settings");
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    };

    fetchData();
  }, [awardType, commandType, corpsType, divisionType, brigadeType, debouncedSearch, profile, page, limit]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Create simplified headers for PDF
    const headers = [
      "S. No",
      "Award Type", 
      "Unit Name",
      "Location",
      "Brigade",
      "Division", 
      "Corps",
      "Command",
      "Total Marks"
    ];

    // Create simplified rows for PDF
    const rows = units.map((unit: any, index: number) => {
      let totalMarks = 0;

      // Calculate total marks from parameters
      (unit.fds?.parameters ?? []).forEach((p: any) => {
        const marksVal = p.approved_marks ?? p.marks ?? 0;
        const numVal = Number(marksVal) || 0;
        if (p.negative) {
          totalMarks -= numVal;
        } else {
          totalMarks += numVal;
        }
      });

      // Add grace marks
      const roleOrder = ["brigade", "division", "corps", "command"];
      for (let i = roleOrder.length - 1; i >= 0; i--) {
        const role = roleOrder[i];
        const graceEntry = (unit.fds?.applicationGraceMarks ?? []).find((g: any) => g.role === role);
        if (graceEntry && graceEntry.marks) {
          totalMarks += Number(graceEntry.marks) || 0;
          break;
        }
      }

      return [
        index + 1,
        unit.type ?? "-",
        unit.unit_details?.name ?? "-",
        unit.unit_details?.location ?? "-",
        unit.unit_details?.bde ?? "-",
        unit.unit_details?.div ?? "-",
        unit.unit_details?.corps ?? "-",
        unit.unit_details?.comd ?? "-",
        totalMarks,
      ];
    });

    // Add title
    doc.setFontSize(16);
    doc.text("Applications Report", 14, 22);

    // Create table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      columnStyles: {
        8: { cellWidth: 60, halign: "right" }, // Total Marks column
      },
    });

    doc.save("applications.pdf");
  };

  // const handleExportFMNExcel = () => {
  //   // Updated matric units
  //   const matricUnits = [
  //     { label: "CI/CT", value: "HINTERLAND" },
  //     { label: "LC", value: "LC" },
  //     { label: "AIOS", value: "AIOS" },
  //     { label: "LAC", value: "LAC" },
  //     { label: "HAA", value: "HAA" },
  //     { label: "AGPL", value: "AGPL" },
  //     { label: "Internal Security (IS)", value: "IS" },
  //   ];

  //   // Updated non-matric units for matching matrix_unit values
  //   const nonMatricUnits = [
  //     { label: "Non Metrics (NM)", value: "NM" },
  //     { label: "Peace/Mod Fd", value: "Peace" },
  //   ];

  //   // Group by FMN
  //   const groupedByFMN: any = {};

  //   units.forEach(unit => {
  //     const fmn = unit.fds.command || "Unknown FMN";
  //     if (!groupedByFMN[fmn]) {
  //       groupedByFMN[fmn] = {
  //         matricCounts: matricUnits.reduce((acc: any, u) => {
  //           acc[u.label] = 0;
  //           return acc;
  //         }, {}),
  //         nonMatricCounts: nonMatricUnits.reduce((acc: any, u) => {
  //           acc[u.label] = 0;
  //           return acc;
  //         }, {}),
  //         unitCitations: 0,
  //         unitAppreciations: 0,
  //         total: 0,
  //       };
  //     }
  //     const fmnGroup = groupedByFMN[fmn];

  //     // Count matric units based on fds.matrix_unit matching matric units
  //     const isMatric = matricUnits.some(({ value }) => value === unit.fds.matrix_unit);
  //     if (isMatric) {
  //       matricUnits.forEach(({ label, value }) => {
  //         if (unit.fds.matrix_unit === value) {
  //           if (unit.type === "citation") {
  //             fmnGroup.matricCounts[label]++;
  //             fmnGroup.unitCitations++;
  //           } else if (unit.type === "appreciation") {
  //             fmnGroup.matricCounts[label]++;
  //             fmnGroup.unitAppreciations++;
  //           }
  //         }
  //       });
  //     } else {
  //       // For non-matric units, only count if matrix_unit matches any of nonMatricUnits values
  //       const matchedNonMatric = nonMatricUnits.find(({ value }) => value === unit.fds.matrix_unit);
  //       if (matchedNonMatric) {
  //         if (unit.type === "citation") {
  //           fmnGroup.nonMatricCounts[matchedNonMatric.label]++;
  //           fmnGroup.unitCitations++;
  //         } else if (unit.type === "appreciation") {
  //           fmnGroup.nonMatricCounts[matchedNonMatric.label]++;
  //           fmnGroup.unitAppreciations++;
  //         }
  //       }
  //     }

  //     fmnGroup.total++;
  //   });

  //   // Prepare header rows
  //   const headerRow1 = [
  //     "FMN",
  //     "Matric Units", "", "", "", "", "", "",
  //     "Non-Matric Units", "",
  //     "Unit Citations",
  //     "Unit Appreciations",
  //     "Total",
  //   ];

  //   const headerRow2 = [
  //     "",
  //     "CI/CT", "LC", "AIOS", "LAC", "HAA", "AGPL", "Internal Security (IS)", 
  //     "Non Metrics (NM)", "Peace/Mod Fd", 
  //     "", "", "",
  //   ];

  //   // Data rows
  //   const dataRows = Object.entries(groupedByFMN).map(([fmn, counts]: any) => [
  //     fmn,
  //     ...matricUnits.map(({ label }) => counts.matricCounts[label] > 0 ? counts.matricCounts[label] : "-"),
  //     ...nonMatricUnits.map(({ label }) => counts.nonMatricCounts[label] > 0 ? counts.nonMatricCounts[label] : "-"),
  //     counts.unitCitations,
  //     counts.unitAppreciations,
  //     counts.total,
  //   ]);

  //   const worksheetData = [headerRow1, headerRow2, ...dataRows];

  //   // Create worksheet
  //   const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  //   // Merge cells for grouped headers
  //   worksheet["!merges"] = [
  //     { s: { r: 0, c: 1 }, e: { r: 0, c: 7 } },  // B1:H1 Matric Units (unchanged)
  //     { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } },  // I1:J1 Non-Matric Units (reduced by 1)
  //     { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },  // A1:A2 FMN
  //     { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // K1:K2 Unit Citations (shifted left by 1)
  //     { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } }, // L1:L2 Unit Appreciations (shifted left by 1)
  //     { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } }, // M1:M2 Total (shifted left by 1)
  //   ];

  //   // Create workbook and append sheet
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "FMN Report");

  //   // Export Excel file
  //   XLSX.writeFile(workbook, "FMN_Report.xlsx");
  // };

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Track Application"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Track Applications", href: "/track-applications" },
          ]}
        />
        <div className="d-flex gap-2">
          <button className="_btn primary mb-3 d-flex align-items-center gap-2" onClick={handleExportPDF}>
            {/* <FaDownload /> */}
            <span>Download PDF Report</span>
          </button>
          {/* <button className="_btn primary mb-3 d-flex align-items-center justify-content-center gap-2" onClick={handleExportExcel}>
                
                  <span>
  Generate {role === "headquarter" ? "CW2" : role.charAt(0).toUpperCase() + role.slice(1)} Report
</span>
                </button> */}
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
        <div className="d-flex gap-2">
          <div className="d-flex gap-2">
            <FormSelect
              name="awardType"
              options={awardTypeOptions}
              value={awardTypeOptions.find((opt) => opt.value === awardType) ?? null}
              placeholder="Select Award Type"
              onChange={(option) => setAwardType(option?.value ?? null)}
            />
          </div>
          <div className="d-flex gap-2">
            {profile?.user?.user_role === "headquarter" &&
              <FormSelect
                name="commandType"
                options={commandOptions}
                value={commandOptions.find((opt) => opt.value === commandType) ?? null}
                placeholder="Select Command"
                onChange={(option) => setCommandType(option?.value ?? null)}
              />
            }
            {profile?.user?.user_role === "headquarter" &&
              <FormSelect
                name="corpsType"
                options={corpsOptions}
                value={corpsOptions.find((opt) => opt.value === corpsType) ?? null}
                placeholder="Select Corps"
                onChange={(option) => setCorpsType(option?.value ?? null)}
              />
            }
            {profile?.user?.user_role === "headquarter" &&
              <FormSelect
                name="divisionType"
                options={divisionOptions}
                value={divisionOptions.find((opt) => opt.value === divisionType) ?? null}
                placeholder="Select Division"
                onChange={(option) => setDivisionType(option?.value ?? null)}
              />
            }
            {profile?.user?.user_role === "headquarter" &&
              <FormSelect
                name="brigadeType"
                options={brigadeOptions}
                value={brigadeOptions.find((opt) => opt.value === brigadeType) ?? null}
                placeholder="Select Brigade"
                onChange={(option) => setBrigadeType(option?.value ?? null)}
              />
            }
          </div>
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
                Current Stage
              </th>
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

                let approverRole = "Unit";
                if (unit?.status_flag === "rejected" && unit?.last_rejected_by_role) {
                  approverRole = unit.last_rejected_by_role.charAt(0).toUpperCase() + unit.last_rejected_by_role.slice(1);
                } else if (unit?.status_flag === "shortlisted_approved" && unit?.last_shortlisted_approved_role) {
                  approverRole = unit.last_shortlisted_approved_role.charAt(0).toUpperCase() + unit.last_shortlisted_approved_role.slice(1);
                } else if (unit?.last_approved_by_role) {
                  approverRole = unit.last_approved_by_role.charAt(0).toUpperCase() + unit.last_approved_by_role.slice(1);
                }

                return (
                  <tr key={unit.id} onClick={() => navigate(`/track-applications/${unit.id}?award_type=${unit.type}`)}>
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

                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p
                        className="fw-4"
                        style={{
                          color: ["approved", "shortlisted_approved", "in_review"].includes(unit?.status_flag)
                            ? "green"
                            : "red",
                        }}

                      >
                        {unit.status_flag === "shortlisted_approved" || unit?.status_flag === "in_review"
                          ? "Approved"
                          : unit.status_flag.charAt(0).toUpperCase() + unit.status_flag.slice(1)
                        }
                      </p>
                    </td>
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{approverRole}</p>
                    </td>
                  </tr>
                )
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

export default TrackApplications;
