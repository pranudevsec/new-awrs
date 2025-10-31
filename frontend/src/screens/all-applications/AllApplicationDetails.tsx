import { useEffect, useState, type JSX } from "react";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import Loader from "../../components/ui/loader/Loader";
import StepProgressBar from "../../components/ui/stepProgressBar/StepProgressBar";
import { useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { fetchApplicationUnitDetail } from "../../reduxToolkit/services/application/applicationService";
import { baseURL } from "../../reduxToolkit/helper/axios";
import { downloadDocumentWithWatermark } from "../../utils/documentUtils";
import toast from "react-hot-toast";
import { formatTableDate, formatDate } from "../../utils/dateUtils";

const AllApplicationDetails = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { application_id } = useParams();

  const profile = useAppSelector((state) => state.admin.profile);
  const { loading, unitDetail } = useAppSelector((state) => state.application);


  const [graceMarks, setGraceMarks] = useState("");
  const [paramStats, setParamStats] = useState({
    totalParams: 0,
    filledParams: 0,
    marks: 0,
    approvedMarks: 0,
    totalMarks: 0,
    negativeMarks: 0,
  });

  const isUnitRole = ["unit", "cw2"].includes(profile?.user?.user_role ?? "");
  const isHeadquarter = profile?.user?.user_role === "headquarter";
  const isCommand = profile?.user?.user_role === "command";
  const role = profile?.user?.user_role?.toLowerCase() ?? "";
  const award_type = searchParams.get("award_type") ?? "";
  const numericAppId = Number(application_id);

  useEffect(() => {
    if (award_type && numericAppId) dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
  }, [award_type, numericAppId]);

  const calculateParameterStats = (parameters: any[]) => {
    const totalParams = parameters.length;

    const filledParams = parameters.filter(
      (param) => (param.count ?? 0) > 0 || (param.marks ?? 0) > 0
    ).length;

    // Sum of positive (non-negative) parameter marks, excluding rejected
    const marks = parameters.reduce((acc, param) => {
      const isRejected = param.clarification_details?.clarification_status === "rejected";
      if (isRejected) return acc;
      if (param.negative === true) return acc;
      return acc + (Number(param.marks ?? 0) || 0);
    }, 0);

    // Sum of approved marks where approved_marks > 0, excluding rejected
    const approvedMarks = parameters.reduce((acc, param) => {
      const isRejected = param.clarification_details?.clarification_status === "rejected";
      if (isRejected) return acc;
      const val = Number(param.approved_marks ?? 0) || 0;
      return acc + (val > 0 ? val : 0);
    }, 0);

    // Negative marks come from negative parameters; prefer approved_marks if present (>0), else original
    const negativeMarks = parameters.reduce((acc, param) => {
      const isRejected = param.clarification_details?.clarification_status === "rejected";
      if (isRejected) return acc;
      if (param.negative === true) {
        const a = Number(param.approved_marks ?? 0) || 0;
        const o = Number(param.marks ?? 0) || 0;
        return acc + (a > 0 ? a : o);
      }
      return acc;
    }, 0);

    // Total = parameter positive marks + approved (>0) - negative
    let totalMarks = marks + approvedMarks - negativeMarks;
    if (totalMarks < 0) totalMarks = 0;
    return { totalParams, filledParams, marks, approvedMarks, negativeMarks, totalMarks };
  };

  useEffect(() => {
    const parameters = unitDetail?.fds?.parameters ?? [];
    const stats = calculateParameterStats(parameters);
    setParamStats(stats);
  }, [unitDetail, graceMarks]);

  // Build role-wise marks view (brigade/division/corps/command)
  const roleMarksList: Array<{ role: string; marks: number }> = (() => {
    const list: Array<{ role: string; marks: number }> = [];
    const arr = unitDetail?.fds?.applicationGraceMarks ?? [];
    if (!Array.isArray(arr)) return list;
    const order = ["brigade", "division", "corps", "command"];
    const norm = arr
      .map((g: any) => ({ role: String(g?.role ?? "").toLowerCase(), marks: Number(g?.marks ?? 0) || 0 }))
      .filter((g: any) => g.role);
    norm.sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
    return norm;
  })();

  const sumRoleMarks = roleMarksList.reduce((s, r) => s + (Number.isFinite(r.marks) ? r.marks : 0), 0);
  const brigadeMarks = roleMarksList.find((r) => r.role === "brigade")?.marks ?? 0;
  const adjustedTotal = isHeadquarter
    ? Math.max(0, (paramStats.totalMarks - Number(graceMarks || 0)) + sumRoleMarks)
    : paramStats.totalMarks;

  useEffect(() => {
    if (unitDetail?.fds?.parameters && profile) {
      const initialMarks: Record<string, string> = {};
      const initialComments: Record<string, string> = {};

      unitDetail.fds.parameters.forEach((param: any) => {
        initialMarks[param.name] = param.approved_marks ?? "";

        const matchingComments = (param.comments ?? []).filter(
          (c: any) =>
            c.commented_by_role === profile?.user?.user_role &&
            c.commented_by_role_type === profile?.user?.cw2_type
        );

        if (matchingComments.length > 0) {
          const latest = matchingComments.reduce((a: any, b: any) =>
            new Date(a.commented_at) > new Date(b.commented_at) ? a : b
          );
          initialComments[param.name] = latest.comment ?? "";
        } else {
          initialComments[param.name] = "";
        }
      });

    }
  }, [unitDetail, profile]);

  useEffect(() => {
    const grace = unitDetail?.fds?.applicationGraceMarks?.find(
      (entry: any) => entry.role?.toLowerCase() === role
    )?.marks;

    if (grace !== undefined) {
      setGraceMarks(grace.toString());
    }
  }, [unitDetail, role]);


  const handleDocumentDownload = async (documentUrl: any, fileName: string) => {
    try {
      await downloadDocumentWithWatermark(documentUrl, fileName, baseURL);
      toast.success('Document downloaded with watermark');
    } catch (error) {      

      if (error instanceof Error && error.message.includes('Document not found')) {
        toast.error(`File not found: ${fileName}. The file may have been deleted or moved.`);
      } else {
        toast.error('Failed to load document');
      }
    }
  };

  const getParamDisplay = (param: any) => {
    if (param.name !== "no") {
      return {
        main: param.name,
        header: param.category ?? null,
        subheader: param.subcategory ?? null,
        subsubheader: param.subsubcategory ?? null,
      };
    } else if (param.subsubcategory) {
      return {
        main: param.subsubcategory,
        header: param.category ?? null,
        subheader: param.subcategory ?? null,
        subsubheader: null,
      };
    } else if (param.subcategory) {
      return {
        main: param.subcategory,
        header: param.category ?? null,
        subheader: null,
        subsubheader: null,
      };
    } else {
      return {
        main: param.category,
        header: null,
        subheader: null,
        subsubheader: null,
      };
    }
  };

  const normalizeUploads = (upload: any): string[] => {
    if (Array.isArray(upload)) return upload;
    if (typeof upload === "string") return upload.split(",");
    return [];
  };

  const renderUploadButtons = (upload: any) => {
    const uploads = normalizeUploads(upload);
    return uploads.map((filePath: string) => (
      <button
        key={filePath}
        onClick={() => handleDocumentDownload(filePath, filePath.split("/").pop() || "document")}
        style={{
          fontSize: 14,
          wordBreak: "break-word",
          background: "none",
          border: "none",
          color: "#1d4ed8",
          textDecoration: "underline",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
        }}
      >
        {filePath.split("/").pop()}
      </button>
    ));
  };

  const renderParameterRow = (param: any, display: any, index: number) => {
    const rows: JSX.Element[] = [];

    rows.push(
      <tr key={`param-${index}-${display.main}`}>
        <td style={{ width: 150 }}>
          <p className="fw-5 mb-0">{display.main}</p>
        </td>

        <td style={{ width: 100 }}>
          <p className="fw-5">{param.count}</p>
        </td>

        <td style={{ width: 100 }}>
          <p className="fw-5">{param.negative ? `-${param.marks}` : param.marks}</p>
        </td>

        <td style={{ width: 200 }}>
          {param.upload && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {renderUploadButtons(param.upload)}
            </div>
          )}
        </td>

      </tr>
    );

    return rows;
  };



  if (loading) return <Loader />;

  return (
    <div className="apply-citation-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title={`Application ID: #${unitDetail?.id}`}
          paths={[
            { label: "Home", href: "/applications" },
            { label: "All Applications", href: "/all-applications" },
            { label: "Application Details", href: "/applications/list/1" },
          ]}
        />
      </div>
      <div className="table-filter-area mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div
            className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
            style={{ minWidth: "150px" }}
          >
            <div className="form-label fw-semibold">Award Type</div>
            <p className="fw-5 mb-0">
              {unitDetail?.type
                ? unitDetail.type.charAt(0).toUpperCase() +
                unitDetail.type.slice(1)
                : "--"}
            </p>
          </div>

          <div
            className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
            style={{ minWidth: "150px" }}
          >
            <div className="form-label fw-semibold">Cycle Period</div>
            <p className="fw-5 mb-0">
              {unitDetail?.fds?.cycle_period ? 
                (() => {
                  // If cycle_period is a string like "2025-01-01 to 2025-06-30", format it properly
                  if (typeof unitDetail.fds.cycle_period === 'string' && unitDetail.fds.cycle_period.includes(' to ')) {
                    const [startDate, endDate] = unitDetail.fds.cycle_period.split(' to ');
                    return `${formatDate(startDate, { format: 'medium' })} to ${formatDate(endDate, { format: 'medium' })}`;
                  }
                  // If it's a single date or other format, format it directly
                  return formatDate(unitDetail.fds.cycle_period, { format: 'medium' });
                })() : "--"}
            </p>
          </div>

          <div
            className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
            style={{ minWidth: "150px" }}
          >
            <div className="form-label fw-semibold">Last Date</div>
            <p className="fw-5 mb-0">{formatTableDate(unitDetail?.fds?.last_date, true)}</p>
          </div>

          <div
            className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
            style={{ minWidth: "150px" }}
          >
            <div className="form-label fw-semibold">Command</div>
            <p className="fw-5 mb-0">{unitDetail?.fds?.command ?? "--"}</p>
          </div>

          <div
            className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto"
            style={{ minWidth: "150px" }}
          >
            <div className="form-label fw-semibold">Unit Name</div>
            <p className="fw-5 mb-0">{unitDetail?.unit_name ?? "--"}</p>
          </div>
        </div>
      </div>
      {/* {unitDetail?.fds?.awards?.length > 0 && (
                    <div className="mt-4">
                        <h5 className="mb-3">Awards</h5>
                        <div className="table-responsive">
                            <table className="table-style-2 w-100">
                                <thead>
                                    <tr style={{ backgroundColor: "#007bff" }}>
                                        <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                                            Type
                                        </th>
                                        <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                                            Year
                                        </th>
                                        <th style={{ width: 300, minWidth: 300, maxWidth: 300, color: "white" }}>
                                            Title
                                        </th>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )} */}
      <div className="table-responsive mt-4">
        <table className="table-style-1 w-100">
          <thead>
            <tr style={{ backgroundColor: "#007bff" }}>
              <th style={{ width: 150, fontSize: "17", color: "white" }}>Parameter</th>
              <th style={{ width: 100, fontSize: "17", color: "white" }}>Count</th>
              <th style={{ width: 100, fontSize: "17", color: "white" }}>Marks</th>
              <th style={{ width: 100, fontSize: "17", color: "white" }}>Document</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let prevHeader: string | null = null;
              let prevSubheader: string | null = null;
              let prevSubsubheader: string | null = null;
              const rows: any[] = [];

              unitDetail?.fds?.parameters?.forEach(
                (param: any, index: number) => {
                  const display = getParamDisplay(param);

                  const showHeader =
                    display.header && display.header !== prevHeader;
                  const showSubheader =
                    display.subheader && display.subheader !== prevSubheader;
                  const showSubsubheader =
                    display.subsubheader && display.subsubheader !== prevSubsubheader;

                  if (showHeader) {
                    rows.push(
                      <tr key={`header-${display.header}-${index}`}>
                        <td
                          colSpan={6}
                          style={{
                            fontWeight: 600,
                            color: "#555",
                            fontSize: 15,
                            background: "#f5f5f5",
                          }}
                        >
                          {display.header}
                        </td>
                      </tr>
                    );
                  }

                  if (showSubheader) {
                    rows.push(
                      <tr key={`subheader-${display.subheader}-${index}`}>
                        <td
                          colSpan={6}
                          style={{
                            color: display.header ? "#1976d2" : "#888",
                            fontSize: 13,
                            background: "#f8fafc",
                          }}
                        >
                          {display.subheader}
                        </td>
                      </tr>
                    );
                  }

                  if (showSubsubheader) {
                    rows.push(
                      <tr key={`subsubheader-${display.subsubheader}-${index}`}>
                        <td
                          colSpan={6}
                          style={{
                            color: "#666",
                            fontSize: 12,
                            background: "#fafbfc",
                            fontStyle: "italic",
                          }}
                        >
                          {display.subsubheader}
                        </td>
                      </tr>
                    );
                  }

                  prevHeader = display.header;
                  prevSubheader = display.subheader;
                  prevSubsubheader = display.subsubheader;

                  rows.push(...renderParameterRow(param, display, index));
                });

              return rows;
            })()}
          </tbody>
        </table>
      </div>
      {!isUnitRole && (
        <ul
          style={{
            listStyleType: "none",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            padding: 0,
            marginBottom: "16px",
          }}
        >
          {/* Unit Remark */}
          {unitDetail?.fds?.unitRemarks && (
            <li
              style={{
                padding: "8px 12px",
                backgroundColor: "#e8f0fe",
                borderRadius: "6px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                fontSize: "14px",
                color: "#333",
              }}
            >
              <strong>Unit:</strong> {unitDetail.fds.unitRemarks}
            </li>
          )}

          {/* Other Remarks */}
          {Array.isArray(unitDetail?.remarks) &&
            unitDetail.remarks.map((item: any) => (
              <li
                key={item?.remarks}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "6px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  fontSize: "14px",
                  color: "#333",
                }}
              >
                <strong>{item?.remark_added_by_role}:</strong>{" "}
                {item?.remarks}
              </li>
            ))}
        </ul>
      )}
      {!isUnitRole && (
        <div
          style={{
            borderTop: "1px solid var(--gray-200)",
            paddingTop: "20px",
            paddingBottom: "20px",
          }}
        >
          <div className="row text-center text-sm-start mb-3">
            <div className="col-6 col-sm-2">
              <span className="fw-medium text-muted">Filled Params:</span>
              <div className="fw-bold">{paramStats.filledParams}</div>
            </div>
            <div className="col-6 col-sm-2">
              <span className="fw-medium text-muted">Marks:</span>
              <div className="fw-bold">{paramStats.marks}</div>
            </div>
           <div className="col-6 col-sm-2">
  <span className="fw-medium text-muted">Negative Marks:</span>
  <div className="fw-bold text-danger">
    {paramStats.negativeMarks > 0 ? `-${paramStats.negativeMarks}` : paramStats.negativeMarks}
  </div>
</div>

            <div className="col-6 col-sm-2">
              <span className="fw-medium text-muted">Approved Marks:</span>
              <div className="fw-bold text-primary">
                {paramStats.approvedMarks}
              </div>
            </div>
            <div className="col-6 col-sm-2">
              <span className="fw-medium text-muted">Total Marks:</span>
              <div className="fw-bold text-success">
                {adjustedTotal}
              </div>
            </div>
          </div>

          {isHeadquarter && roleMarksList.length > 0 && (
            <div className="mt-3">
              <div className="mb-2" style={{ borderLeft: "4px solid #28a745", paddingLeft: 12 }}>
                <h5 className="mb-1" style={{ fontWeight: 700 }}>Marks by Roles</h5>
                <div className="text-muted" style={{ fontSize: 13 }}>Includes Brigade, Division, Corps, Command</div>
              </div>
              <div className="table-responsive">
                <table className="table-style-2 w-100">
                  <thead>
                    <tr style={{ backgroundColor: "#007bff" }}>
                      <th style={{ width: 200, color: "white" }}>Role</th>
                      <th style={{ width: 150, color: "white" }}>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleMarksList.map((rm, idx) => (
                      <tr key={`${rm.role}-${idx}`} className="cursor-auto">
                        <td style={{ width: 200 }}>
                          <p className="fw-5 text-capitalize" style={rm.role === "brigade" ? { fontWeight: 700 } : undefined}>
                            {rm.role}
                          </p>
                        </td>
                        <td style={{ width: 150 }}>
                          <p className="fw-5">{rm.marks}</p>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ width: 200 }}>
                        <p className="fw-5">Total Role Marks</p>
                      </td>
                      <td style={{ width: 150 }}>
                        <p className="fw-5">{sumRoleMarks}</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="row mt-2">
                <div className="col-12 col-sm-4">
                  <span className="fw-medium text-muted">Marks by Brigade:</span>
                  <div className="fw-bold" style={{ borderLeft: "4px solid #28a745", paddingLeft: 8 }}>{brigadeMarks}</div>
                </div>
                <div className="col-12 col-sm-4">
                  <span className="fw-medium text-muted">Total (Params + Role Marks - Negative):</span>
                  <div className="fw-bold text-success">{adjustedTotal}</div>
                </div>
              </div>
            </div>
          )}

          {(isHeadquarter || isCommand) && (
            <StepProgressBar
              unitDetail={unitDetail}
              isCommand={isCommand}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AllApplicationDetails;
