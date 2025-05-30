import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch } from "../../reduxToolkit/hooks";
import { fetchApplicationUnitDetail } from "../../reduxToolkit/services/application/applicationService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormInput from "../../components/form/FormInput";
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
  }, [award_type, numericAppId, dispatch, isRefreshData]);

  return (
    <>
      <div className="apply-citation-section">
        <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
          <Breadcrumb
            title={`Application ID: #${unitDetail?.id}`}
            paths={[
              { label: "Clarification", href: "/clarification" },
              { label: "Details", href: "/clarification/1" },
            ]}
          />
        </div>
        <div className="table-filter-area mb-4">
          <div className="row">
            <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
              <FormInput
                label="Award Type"
                name="awardType"
                value={unitDetail?.type || "--"}
                readOnly={true}
              />
            </div>
            <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">

              <FormInput
                label="Cycle Period"
                name="cyclePeriod"
                value={unitDetail?.fds?.cycle_period || "--"}
                readOnly={true}
              />
            </div>
            <div className="col-lg-3 col-sm-4">
              <FormInput
                label="Last Date"
                name="lastDate"
                type="date"
                value={unitDetail?.fds?.last_date || "--"}
                readOnly={true}
              />
            </div>
            <div className="col-lg-3 col-sm-4">
              <FormInput
                label="Command"
                name="command"
                value={unitDetail?.fds?.command || "--"}
                readOnly={true}
              />
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
                <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div className="d-flex align-items-start">Document</div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">
                    Reviewers Comment
                  </div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Upload Doc</div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Clarification</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {unitDetail?.fds?.parameters
                ?.filter((param: any) => param.clarification_id).map((param: any, index: any) => (
                  <tr key={index}>
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
                    <td style={{ width: 100 }}>
                      <a
                        href={param.upload}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 18 }}
                      >
                        {SVGICON.app.pdf}
                      </a>
                    </td>
                    <td style={{ width: 200 }}>
                      <p className="fw-4">
                        {param.clarification_details?.reviewer_comment || '—'}
                      </p>
                    </td>
                    <td style={{ width: 200 }}>
                      {param?.clarification_details?.clarification_doc ? (
                        <a
                          href={param?.clarification_details?.clarification_doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          View Document
                        </a>
                      ) : (
                        <input type="file" className="form-control" autoComplete="off" />
                      )}
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
