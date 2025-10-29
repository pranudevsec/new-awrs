import { useEffect, useState, type JSX } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../reduxToolkit/hooks";
import { fetchApplicationUnitDetail } from "../../reduxToolkit/services/application/applicationService";
import { baseURL } from "../../reduxToolkit/helper/axios";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import GiveClarificationModal from "../../modals/GiveClarificationModal";
import ReviewCommentModal from "../../modals/ReviewCommentModal";
import { downloadDocumentWithWatermark } from "../../utils/documentUtils";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "../../utils/dateUtils";

const UnitClarificationDetail = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { application_id } = useParams();


  const [clarificationShow, setClarificationShow] = useState(false);
  const [unitDetail, setUnitDetail] = useState<any>(null);
  const [clarificationId, setClarificationId] = useState<number>(0);
  // Removed inline expand/collapse; using modal instead
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewCommentsData, setReviewCommentsData] = useState<any>(null);
  const [isRefreshData, setIsRefreshData] = useState(false);

  const award_type = searchParams.get("award_type") ?? "";
  const numericAppId = Number(application_id);

  useEffect(() => {
    if (award_type && numericAppId) {
      dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }))
        .unwrap()
        .then((res: any) => {
          setUnitDetail(res.data);
        })
        .catch(() => {
        });
    }
  }, [award_type, numericAppId, isRefreshData]);

  const getParamDisplay = (param: any) => {
    if (param.name != "no") {
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

  const renderHeaderRow = (
    text: string | null,
    level: "header" | "subheader" | "subsubheader",
    index: number
  ): JSX.Element | null => {
    if (!text) return null;

    const styles = {
      header: {
        colSpan: 6,
        style: {
          fontWeight: 600,
          color: "#555",
          fontSize: 15,
          background: "#f5f5f5",
        },
      },
      subheader: {
        colSpan: 6,
        style: {
          color: "#1976d2",
          fontSize: 13,
          background: "#f8fafc",
        },
      },
      subsubheader: {
        colSpan: 6,
        style: {
          color: "#666",
          fontSize: 12,
          background: "#fafbfc",
          fontStyle: "italic",
        },
      },
    };

    return (
      <tr key={`${level}-${text}-${index}`}>
        <td {...styles[level]}>{text}</td>
      </tr>
    );
  };

  const renderParamRow = (param: any, display: any, index: number): JSX.Element => (
    <tr key={`param-${index}-${display.main}`}>
      <td style={{ width: 150 }}>
        <p className="fw-5">{display.main}</p>
      </td>
      <td style={{ width: 100 }}>
        <p className="fw-5">{param.count}</p>
      </td>
      <td style={{ width: 100 }}>
        <p className="fw-5">{param.marks}</p>
      </td>
      <td style={{ width: 200 }}>
        <p className="fw-5">{param.marks}</p>
      </td>
      <td style={{ width: 200 }}>
  {Array.isArray(param?.upload) && param.upload.length > 0 ? (
    param.upload.map((filePath: string) => (
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
          display: "block",
        }}
      >
        {filePath.split("/").pop()}
      </button>
    ))
  ) : (
    "--"
  )}
</td>
      <td style={{ width: 200, wordWrap: "break-word", wordBreak: "break-word", overflowWrap: "break-word" }}>
        {(() => {
          const comment = param.clarification_details?.reviewer_comment;
          if (!comment) return <span>—</span>;
          return (
            <div>
              <div
                className="fw-4"
                style={{
                  wordWrap: "break-word",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  maxHeight: "60px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 3 as any,
                  WebkitBoxOrient: "vertical" as any,
                }}
              >
                {comment}
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  className="_btn outline"
                  onClick={() => {
                    setReviewCommentsData([
                      {
                        comment: comment,
                        commented_by_role_type: "Reviewer",
                        commented_by_role: "reviewer",
                        commented_at: new Date().toISOString(),
                        commented_by: 0,
                      },
                    ]);
                    setShowReviewModal(true);
                  }}
                >
                  Reviewers Comment
                </button>
              </div>
            </div>
          );
        })()}
      </td>
      <td style={{ width: 200 }}>
  {param?.clarification_details?.clarification ? (
    <div>
      <div
        style={{ 
          maxHeight: "60px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          wordWrap: "break-word",
          wordBreak: "break-word"
        }}
      >
        {param.clarification_details.clarification}
      </div>
      <div className="mt-2">
        <button
          type="button"
          className="_btn outline"
          onClick={() => {
            setReviewCommentsData([
              {
                comment: param.clarification_details.clarification,
                commented_by_role_type: "Clarification",
                commented_by_role: "clarification",
                commented_at: new Date().toISOString(),
                commented_by: 0,
              },
            ]);
            setShowReviewModal(true);
          }}
        >
          View Clarification
        </button>
      </div>
    </div>
  ) : param?.clarification_details?.clarification_id ? (
    <button
      className="_btn outline"
      onClick={() => {
        setClarificationId(param?.clarification_id);
        setClarificationShow(true);
      }}
    >
      Add Clarification
    </button>
  ) : (
    "--"
  )}
</td>

    </tr>
  );

  const generateParameterRows = (parameters: any[]): JSX.Element[] => {
    let prevHeader: string | null = null;
    let prevSubheader: string | null = null;
    let prevSubsubheader: string | null = null;

    return parameters.flatMap((param: any, index: number) => {
      const display = getParamDisplay(param);
      const rows: JSX.Element[] = [];

      const headerRow = renderHeaderRow(display.header, "header", index);
      const subheaderRow = renderHeaderRow(display.subheader, "subheader", index);
      const subsubheaderRow = renderHeaderRow(display.subsubheader, "subsubheader", index);

      if (display.header && display.header !== prevHeader && headerRow) {
        rows.push(headerRow);
        prevHeader = display.header;
      }

      if (display.subheader && display.subheader !== prevSubheader && subheaderRow) {
        rows.push(subheaderRow);
        prevSubheader = display.subheader;
      }

      if (display.subsubheader && display.subsubheader !== prevSubsubheader && subsubheaderRow) {
        rows.push(subsubheaderRow);
        prevSubsubheader = display.subsubheader;
      }

      rows.push(renderParamRow(param, display, index));
      return rows;
    });
  };

  return (
    <>
      <div className="apply-citation-section">
        <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
          <Breadcrumb
            title={`Application ID: #${unitDetail?.id}`}
            paths={[
              { label: "Clarification", href: "/clarification" },
              { label: "Application Details", href: "/clarification/1" },
            ]}
          />
        </div>
        <div className="table-filter-area mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <div className="form-label fw-semibold">Award Type</div>
              <p className="fw-5 mb-0">
                {unitDetail?.type
                  ? unitDetail.type.charAt(0).toUpperCase() + unitDetail.type.slice(1)
                  : "--"}
              </p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <div className="form-label fw-semibold">Cycle Period</div>
              <p className="fw-5 mb-0">
                {unitDetail?.fds?.cycle_period ? (
                  (() => {
                    const cp = unitDetail.fds.cycle_period;
                    if (typeof cp === 'string' && cp.includes(' to ')) {
                      const [startDate, endDate] = cp.split(' to ');
                      return `${formatDate(startDate, { format: 'medium' })} to ${formatDate(endDate, { format: 'medium' })}`;
                    }
                    return formatDate(cp, { format: 'medium' });
                  })()
                ) : "--"}
              </p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <div className="form-label fw-semibold">Last Date</div>
              <p className="fw-5 mb-0">{formatDateTime(unitDetail?.fds?.last_date) ?? "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <div className="form-label fw-semibold" >Command</div>
              <p className="fw-5 mb-0">{unitDetail?.fds?.command ?? "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <div className="form-label fw-semibold" >Unit Name</div>
              <p className="fw-5 mb-0">{unitDetail?.unit_name ?? "--"}</p>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table-style-1 w-100">
            <thead>
              <tr>
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <div className="d-flex align-items-start">Parameter</div>
                </th>
                <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div className="d-flex align-items-start">Count</div>
                </th>
                <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div className="d-flex align-items-start">Marks</div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Total applied marks</div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Document</div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Reviewers Comment</div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Clarification</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {generateParameterRows(unitDetail?.fds?.parameters ?? [])}
            </tbody>
          </table>
        </div>
      </div>
      <GiveClarificationModal
        show={clarificationShow}
        handleClose={() => setClarificationShow(false)}
        clarificationId={clarificationId}
        setIsRefreshData={setIsRefreshData}
        isRefreshData={isRefreshData}
      />
      <ReviewCommentModal
        show={showReviewModal}
        handleClose={() => setShowReviewModal(false)}
        reviewCommentsData={reviewCommentsData}
      />
    </>
  );
};

export default UnitClarificationDetail;
