import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../reduxToolkit/hooks";
import { fetchApplicationUnitDetail } from "../../reduxToolkit/services/application/applicationService";
import { baseURL } from "../../reduxToolkit/helper/axios";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import GiveClarificationModal from "../../modals/GiveClarificationModal";

const UnitClarificationDetail = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { application_id } = useParams();

  // States
  const [clarificationShow, setClarificationShow] = useState(false);
  const [unitDetail, setUnitDetail] = useState<any>(null);
  const [clarificationId, setClarificationId] = useState<number>(0);
  const [isRefreshData, setIsRefreshData] = useState(false);

  const award_type = searchParams.get("award_type") || "";
  const numericAppId = Number(application_id);

  useEffect(() => {
    if (award_type && numericAppId) {
      dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }))
        .unwrap()
        .then((res: any) => {
          setUnitDetail(res.data);
        })
        .catch((err: any) => {
          console.error("Fetch failed:", err);
        });
    }
  }, [award_type, numericAppId, isRefreshData]);

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
              <label className="form-label fw-semibold" aria-hidden="true">Award Type</label>
              <p className="fw-5 mb-0">
                {unitDetail?.type
                  ? unitDetail.type.charAt(0).toUpperCase() + unitDetail.type.slice(1)
                  : "--"}
              </p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <label className="form-label fw-semibold" aria-hidden="true">Cycle Period</label>
              <p className="fw-5 mb-0">{unitDetail?.fds?.cycle_period || "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <label className="form-label fw-semibold" aria-hidden="true">Last Date</label>
              <p className="fw-5 mb-0">{unitDetail?.fds?.last_date || "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <label className="form-label fw-semibold" aria-hidden="true">Command</label>
              <p className="fw-5 mb-0">{unitDetail?.fds?.command || "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <label className="form-label fw-semibold" aria-hidden="true">Unit Name</label>
              <p className="fw-5 mb-0">{unitDetail?.unit_name || "--"}</p>
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
                  <div className="d-flex align-items-start">
                    Reviewers Comment
                  </div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Clarification</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {unitDetail?.fds?.parameters
                ?.filter((param: any) => param.clarification_id).map((param: any) => (
                  <tr key={param.name}>
                    <td style={{ width: 150 }}>
                      <p className="fw-5">{param.name}</p>
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
                      {
                        param.upload ? <a
                          href={`${baseURL}${param.upload}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 18 }}
                        >
                          {/* {SVGICON.app.pdf} */}
                          <span style={{ fontSize: 14, wordBreak: 'break-word' }}>
                            {Array.isArray(param?.upload)
                              ? param.upload.map((filePath: any, idx: any) => (
                                <span key={idx} style={{ display: "block" }}>
                                  {filePath.split("/").pop()}
                                </span>
                              ))
                              : param?.upload
                                ? param.upload
                                  .toString()
                                  .split(",")
                                  .map((filePath: any, idx: any) => (
                                    <span key={idx} style={{ display: "block" }}>
                                      {filePath.trim().split("/").pop()}
                                    </span>
                                  ))
                                : null}
                          </span>
                        </a> : "--"
                      }
                    </td>
                    <td style={{ width: 200 }}>
                      <p className="fw-4">
                        {param.clarification_details?.reviewer_comment || '—'}
                      </p>
                    </td>
                    <td style={{ width: 200 }}>
                      {param?.clarification_details?.clarification ? (
                        <div>
                          {param?.clarification_details?.clarification
                            ? `${param.clarification_details.clarification.slice(0, 10)}...`
                            : null}
                        </div>
                      ) : (
                        <button
                          className="_btn outline"
                          onClick={() => {
                            setClarificationId(param?.clarification_id);
                            setClarificationShow(true);
                          }}
                        >
                          Add Clarification
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
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
    </>
  );
};

export default UnitClarificationDetail;
