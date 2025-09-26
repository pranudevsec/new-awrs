import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import EmptyTable from "../../components/ui/empty-table/EmptyTable";
import Loader from "../../components/ui/loader/Loader";
import Pagination from "../../components/ui/pagination/Pagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  awardTypeOptions,
  brigadeOptions,
  commandOptions,
  corpsOptions,
  divisionOptions,
} from "../../data/options";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { fetchAllApplications } from "../../reduxToolkit/services/application/applicationService";

const History = () => {
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

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!profile?.user?.user_role) return;
    const fetchData = async () => {
      const params = {
        ...(awardType && awardType !== "All" ? { award_type: awardType } : {}),
        command_type:
          commandType === "All" ? undefined : commandType ?? undefined,
        division_type:
          divisionType === "All" ? undefined : divisionType ?? undefined,
        corps_type: corpsType === "All" ? undefined : corpsType ?? undefined,
        brigade_type:
          brigadeType === "All" ? undefined : brigadeType ?? undefined,
        search: debouncedSearch,
        page,
        limit,
      };
      try {
        await dispatch(fetchAllApplications(params)).unwrap();
      } catch (error: any) {
        const errorMessage =
          error?.errors ?? error?.message ?? "An error occurred.";

        if (
          error?.errors ===
          "Please complete your unit profile before proceeding."
        ) {
          navigate("/profile-settings");
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    };

    fetchData();
  }, [
    awardType,
    commandType,
    corpsType,
    divisionType,
    brigadeType,
    debouncedSearch,
    profile,
    page,
    limit,
  ]);


 // helper: public IP (fallback-friendly)
// helper: public IP (fallback-friendly)
// helper: public IP (fallback-friendly)
const getPublicIP = async (): Promise<string> => {
  try {
    const r = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    const j = await r.json();
    if (j?.ip) return j.ip;
  } catch {}
  try {
    const r2 = await fetch("https://ipinfo.io/json", { cache: "no-store" });
    const j2 = await r2.json();
    if (j2?.ip) return j2.ip;
  } catch {}
  // last resort: host (not true public IP, but better than blank)
  return window.location?.hostname || "Unknown IP";
};

// helper: IST timestamp
const formatNowIST = (): string => {
  const dt = new Date();
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(dt);
  const get = (t: string) => p.find((x) => x.type === t)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
};

// helper: draw a light, diagonal watermark centered on the page (UNDER the table)
const drawWatermark = (doc: jsPDF, text: string) => {
  const { width, height } = doc.internal.pageSize;
  const cx = width / 2;
  const cy = height / 2;

  (doc as any).saveGraphicsState?.();

  // Slightly darker grey + opacity
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  let fontSize = 28;
  doc.setFontSize(fontSize);

  // Use graphics state opacity if available (fallback safe)
  try {
    const GS = (doc as any).GState;
    if (GS) (doc as any).setGState(new GS({ opacity: 0.18 })); // tweak 0.15–0.22
  } catch {}

  // Fit text to page diagonal so it won’t clip
  const txt = String(text ?? "");
  const textWidth = doc.getTextWidth(txt);
  const diagonalUsable = Math.hypot(width, height) - 72; // ~1" margin
  if (textWidth > diagonalUsable) {
    fontSize = Math.max(14, (diagonalUsable / textWidth) * fontSize);
    doc.setFontSize(fontSize);
  }

  // Single draw (no fake-bold double draw)
  (doc as any).text(txt, cx, cy, { align: "center", angle: -30 as any });

  (doc as any).restoreGraphicsState?.();
};

const handleExportPDF = async () => {
  const ip = await getPublicIP();
  const stamp = `IP: ${ip} • ${formatNowIST()}`;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  // Create the table headers and rows as before
  const MARK_ROLES = ["brigade", "division", "corps", "command"] as const;
  const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  const headers: string[] = [
    "S. No",
    "Award Type",
    "Unit Name",
    "Location",
    "ARMS",
    "Fmm",
    "Role/Dply",
    "Command",
    "Application Marks",
    ...MARK_ROLES.map((r) => `Marks by ${cap(r)}`),
    "Total Marks",
  ];

  const rows = units.map((unit: any, index: number) => {
    let applicationMarks = 0;
    (unit.fds?.parameters ?? []).forEach((p: any) => {
      const val = Number(p?.approved_marks ?? p?.marks ?? 0) || 0;
      applicationMarks += p?.negative ? -val : val;
    });

    const graceMap: Record<string, number | string> = {};
    (unit.fds?.applicationGraceMarks ?? []).forEach((g: any) => {
      const role = String(g?.role ?? "").toLowerCase();
      graceMap[role] = g?.marks ?? "-";
    });
    const marksByRole = MARK_ROLES.map((r) => graceMap[r] ?? "-");

    const totalMarks =
      applicationMarks +
      MARK_ROLES.reduce((sum, r) => {
        const v = graceMap[r];
        const n = typeof v === "number" ? v : Number(v);
        return sum + (isNaN(n) ? 0 : n);
      }, 0);

    return [
      index + 1,
      unit?.type ?? "-",
      unit?.unit_details?.name ?? "-",
      unit?.unit_details?.location ?? "-",
      unit?.unit_details?.unit_type ?? "-",
      unit?.unit_details?.corps ?? "-",
      unit?.unit_details?.matrix_unit ?? "-",
      unit?.unit_details?.comd ?? "-",
      applicationMarks,
      ...marksByRole,
      totalMarks,
    ];
  });

  const appMarksIdx = headers.indexOf("Application Marks");
  const totalMarksIdx = headers.indexOf("Total Marks");

  // Render the table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,  // Adjust the Y position to place the table below the watermark
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    columnStyles: {
      [appMarksIdx]: { cellWidth: 60, halign: "right" },
      [totalMarksIdx]: { cellWidth: 60, halign: "right" },
    },
  });

  // Now, add watermark after the table
  const paintWatermarkAfterTable = () => {
    drawWatermark(doc, stamp);  // Add watermark after the table
  };

  // Call the function to paint watermark after the table
  paintWatermarkAfterTable();

  doc.save("applications.pdf");
};





  
  
  
  // Excel function removed - using PDF instead

  // Excel function removed - using PDF instead

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="All Application"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "All Application", href: "/all-applications" },
          ]}
        />
        <div className="d-flex gap-2">
          <button
            className="_btn primary mb-3 d-flex align-items-center gap-2"
            onClick={handleExportPDF}
          >
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
              value={
                awardTypeOptions.find((opt) => opt.value === awardType) ?? null
              }
              placeholder="Select Award Type"
              onChange={(option) => setAwardType(option?.value ?? null)}
            />
          </div>
          <div className="d-flex gap-2">
            {profile?.user?.user_role === "headquarter" && (
              <FormSelect
                name="commandType"
                options={commandOptions}
                value={
                  commandOptions.find((opt) => opt.value === commandType) ??
                  null
                }
                placeholder="Select Command"
                onChange={(option) => setCommandType(option?.value ?? null)}
              />
            )}
            {profile?.user?.user_role === "headquarter" && (
              <FormSelect
                name="corpsType"
                options={corpsOptions}
                value={
                  corpsOptions.find((opt) => opt.value === corpsType) ?? null
                }
                placeholder="Select Corps"
                onChange={(option) => setCorpsType(option?.value ?? null)}
              />
            )}
            {profile?.user?.user_role === "headquarter" && (
              <FormSelect
                name="divisionType"
                options={divisionOptions}
                value={
                  divisionOptions.find((opt) => opt.value === divisionType) ??
                  null
                }
                placeholder="Select Division"
                onChange={(option) => setDivisionType(option?.value ?? null)}
              />
            )}
            {profile?.user?.user_role === "headquarter" && (
              <FormSelect
                name="brigadeType"
                options={brigadeOptions}
                value={
                  brigadeOptions.find((opt) => opt.value === brigadeType) ??
                  null
                }
                placeholder="Select Brigade"
                onChange={(option) => setBrigadeType(option?.value ?? null)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead style={{ backgroundColor: "#007bff" }}>
            <tr>
              <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Application Id
              </th>
              <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Unit ID
              </th>
               <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Unit Name
              </th>
              <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Arm Service
              </th>
              <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Role
              </th>
              {role === "headquarter" && (
                <th
                  style={{
                    width: 150,
                    minWidth: 150,
                    maxWidth: 150,
                    color: "white",
                  }}
                >
                  Command
                </th>
              )}
                <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Type
              </th>
              <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Status
              </th>
              <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Current Stage
              </th>
              <th
                style={{
                  width: 200,
                  minWidth: 200,
                  maxWidth: 200,
                  color: "white",
                }}
              >
                Submission Date
              </th>
            
              <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Dead Line
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
                if (
                  unit?.status_flag === "rejected" &&
                  unit?.last_rejected_by_role
                ) {
                  approverRole =
                    unit.last_rejected_by_role.charAt(0).toUpperCase() +
                    unit.last_rejected_by_role.slice(1);
                } else if (
                  unit?.status_flag === "shortlisted_approved" &&
                  unit?.last_shortlisted_approved_role
                ) {
                  approverRole =
                    unit.last_shortlisted_approved_role
                      .charAt(0)
                      .toUpperCase() +
                    unit.last_shortlisted_approved_role.slice(1);
                } else if (unit?.last_approved_by_role) {
                  approverRole =
                    unit.last_approved_by_role.charAt(0).toUpperCase() +
                    unit.last_approved_by_role.slice(1);
                }

                return (
                  <tr
                    key={unit.id}
                    onClick={() =>
                      navigate(
                        `/all-applications/${unit.id}?award_type=${unit.type}`
                      )
                    }
                  >
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">#{unit.id}</p>
                    </td>
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">#{unit.unit_id}</p>
                    </td>
                      <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">#{unit?.unit_details?.name}</p>
                    </td>
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{unit.fds?.arms_service}</p>
                    </td>
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{unit.fds?.matrix_unit}</p>
                    </td>
                    {role === "headquarter" && (
                      <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                        <p className="fw-4">{unit?.fds?.command}</p>
                      </td>
                    )}

                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">
                        {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
                      </p>
                    </td>

                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p
                        className="fw-4"
                        style={{
                          color: [
                            "approved",
                            "shortlisted_approved",
                            "in_review",
                          ].includes(unit?.status_flag)
                            ? "green"
                            : "red",
                        }}
                      >
                        {unit.status_flag === "shortlisted_approved" ||
                        unit?.status_flag === "in_review"
                          ? "Approved"
                          : unit.status_flag.charAt(0).toUpperCase() +
                            unit.status_flag.slice(1)}
                      </p>
                    </td>
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{approverRole}</p>
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
