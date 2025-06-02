import { useEffect, useState } from "react";
import { SVGICON } from "../../constants/iconsList";
import {  useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { fetchApplicationUnitDetail } from "../../reduxToolkit/services/application/applicationService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import UnitClarificationModal from "../../modals/UnitClarificationModal";
import ReqClarificationModal from "../../modals/ReqClarificationModal";
import Loader from "../../components/ui/loader/Loader";

const CommandPanelDetail = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { application_id } = useParams();

  const profile = useAppSelector((state) => state.admin.profile);
  const { loading, unitDetail } = useAppSelector((state) => state.application);

  // States
  const [clarificationShow, setClarificationShow] = useState(false);
  const [clarificationType, _] = useState<string>("appreciation");
  const [clarificationApplicationId, _1] = useState<number>(0);
  const [clarificationParameterName, _2] = useState<string>("");
  const [clarificationDocForView, _3] = useState<string | null>(null);
  const [clarificationClarificationForView, _4] = useState<string | null>(null);
  const [reqClarificationShow, setReqClarificationShow] = useState(false);
  const [isRefreshData, setIsRefreshData] = useState(false);

  const isUnitRole = profile?.user?.user_role === "unit";
  const award_type = searchParams.get("award_type") || "";
  const numericAppId = Number(application_id);
console.log(award_type)
console.log(numericAppId)
  useEffect(() => {
    if (award_type && numericAppId) dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }))
  }, [award_type, numericAppId, isRefreshData]);

  const parameters = unitDetail?.fds?.parameters || [];
  const totalParams = parameters.length;
  const filledParams = parameters.filter((param: any) => (param.count ?? 0) > 0 || (param.marks ?? 0) > 0).length;
  const negativeMarks = parameters.reduce((acc: any, param: any) => {
    return (param.marks ?? 0) < 0 ? acc + (param.marks ?? 0) : acc;
  }, 0);
  const totalMarks = parameters.reduce((acc: any, param: any) => acc + (param.marks ?? 0), 0);

  useEffect(() => {
    console.log(unitDetail?.fds?.parameters)
    if (unitDetail?.fds?.parameters) {
      const initialMarks: Record<string, string> = {};
      unitDetail?.fds?.parameters.forEach((param: any) => {
        initialMarks[param.name] = param.approved_marks ?? "";
      });
    }
  }, [unitDetail]);

   // Show loader
   if (loading) return <Loader />;
  return (
    <>
      <div className="apply-citation-section">
        <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
          <Breadcrumb
            title={`Application ID: #${unitDetail?.id}`}
            paths={[
              { label: "Home", href: "/applications" },
              { label: "Scoreboard", href: "/command-panel" },
              { label: "Details", href: "/command-panel/1" },
            ]}
          />
        </div>
        <div className="table-filter-area mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <label className="form-label fw-semibold">Award Type</label>
              <p className="fw-5 mb-0">
                {unitDetail?.type
                  ? unitDetail.type.charAt(0).toUpperCase() + unitDetail.type.slice(1)
                  : "--"}
              </p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <label className="form-label fw-semibold">Cycle Period</label>
              <p className="fw-5 mb-0">{unitDetail?.fds?.cycle_period || "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <label className="form-label fw-semibold">Last Date</label>
              <p className="fw-5 mb-0">{unitDetail?.fds?.last_date || "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <label className="form-label fw-semibold">Command</label>
              <p className="fw-5 mb-0">{unitDetail?.fds?.command || "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <label className="form-label fw-semibold">Unit Name</label>
              <p className="fw-5 mb-0">{unitDetail?.unit_name || "--"}</p>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table-style-1 w-100">
            <thead>
              <tr>
                <th style={{ width: 150 }}>Parameter</th>
                <th style={{ width: 100 }}>Count</th>
                <th style={{ width: 100 }}>Marks</th>
                <th style={{ width: 100 }}>Document</th>
          
                {/* {!isUnitRole && (
                  <>
                        <th style={{ width: 200 }}>Approved Marks</th>
                    <th style={{ width: 150 }}>Add Clarification</th>
                    <th style={{ width: 200 }}>Requested Clarification</th>
                    <th style={{ width: 150 }}>Action</th>
                  </>
                )} */}
              </tr>
            </thead>
            <tbody>
              {unitDetail?.fds?.parameters?.map((param: any, index: any) => (
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
                  <td style={{ width: 100 }}>
                    <a href={param.upload} target="_blank" rel="noopener noreferrer" style={{ fontSize: 18 }}>
                      {SVGICON.app.pdf}
                    </a>
                  </td>
           
                
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isUnitRole && (
          <div className="submit-button-wrapper">
            <div className="row text-center text-sm-start mb-3">
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Total Params:</span>
                <div className="fw-bold">
                  {totalParams}
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Filled Params:</span>
                <div className="fw-bold">
                  {filledParams}
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Negative Marks:</span>
                <div className="fw-bold text-danger">
                  {negativeMarks}
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Total Marks:</span>
                <div className="fw-bold text-success">
                  {totalMarks}
                </div>
              </div>
            </div>
     
          </div>
        )}

      </div>
      <UnitClarificationModal
        show={clarificationShow}
        handleClose={() => setClarificationShow(false)}
        type={clarificationType}
        application_id={clarificationApplicationId}
        parameter_name={clarificationParameterName}
        setIsRefreshData={setIsRefreshData}
        isRefreshData={isRefreshData}
      />
      <ReqClarificationModal
        show={reqClarificationShow}
        handleClose={() => setReqClarificationShow(false)}
        clarification_doc={clarificationDocForView}
        clarification={clarificationClarificationForView}
      />
    </>
  );
};

export default CommandPanelDetail;