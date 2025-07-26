import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
  const [reqClarificationShow, setReqClarificationShow] = useState(false);
  const [isRefreshData, setIsRefreshData] = useState(false);

  const isUnitRole = profile?.user?.user_role === "unit";
  const award_type = searchParams.get("award_type") ?? "";
  const numericAppId = Number(application_id);

  useEffect(() => {
    if (award_type && numericAppId) dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }))
  }, [award_type, numericAppId, isRefreshData]);

  const parameters = unitDetail?.fds?.parameters ?? [];
  const totalParams = parameters.length;

  const filledParams = parameters.filter((param: any) =>
    (param.count ?? 0) > 0 || (param.marks ?? 0) > 0
  ).length;

  const negativeMarks = parameters.reduce((acc: any, param: any) => {
    if (param.negative === true) {
      return acc + (param.marks ?? 0);
    }
    return acc;
  }, 0);

  const totalMarks = parameters.reduce((acc: any, param: any) => {
    if (param.negative === true) {
      return acc;
    }
    return acc + (param.marks ?? 0);
  }, 0);

  useEffect(() => {
    if (unitDetail?.fds?.parameters) {
      const initialMarks: Record<string, string> = {};
      unitDetail?.fds?.parameters.forEach((param: any) => {
        initialMarks[param.name] = param.approved_marks ?? "";
      });
    }
  }, [unitDetail]);

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
              { label: "Application Details", href: "/command-panel/1" },
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
              <p className="fw-5 mb-0">{unitDetail?.fds?.cycle_period ?? "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <div className="form-label fw-semibold">Last Date</div>
              <p className="fw-5 mb-0">{unitDetail?.fds?.last_date ?? "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <div className="form-label fw-semibold">Command</div>
              <p className="fw-5 mb-0">{unitDetail?.fds?.command ?? "--"}</p>
            </div>

            <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
              <div className="form-label fw-semibold">Unit Name</div>
              <p className="fw-5 mb-0">{unitDetail?.unit_name ?? "--"}</p>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table-style-1 w-100">
            <thead>
              <tr style={{ backgroundColor: "#007bff" }}>
                <th style={{ width: 150, fontSize: "17", color: "white" }}>Parameter</th>
                <th style={{ width: 100, fontSize: "17", color: "white" }}>Count</th>
                <th style={{ width: 100, fontSize: "17", color: "white" }}>Marks</th>
                <th style={{ width: 200, fontSize: "17", color: "white" }}>Document</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let prevHeader: string | null = null;
                let prevSubheader: string | null = null;
                let prevSubsubheader: string | null = null;
                const rows: any[] = [];

                unitDetail?.fds?.parameters?.forEach((param: any, index: number) => {
                  const display = getParamDisplay(param);

                  const showHeader = display.header && display.header !== prevHeader;
                  const showSubheader = display.subheader && display.subheader !== prevSubheader;
                  const showSubsubheader = display.subsubheader && display.subsubheader !== prevSubsubheader;

                  if (showHeader) {
                    rows.push(
                      <tr key={`header-${display.header}-${index}`}>
                        <td
                          colSpan={4}
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
                          colSpan={4}
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
                        <td colSpan={4} style={{ color: "#666", fontSize: 12, background: "#fafbfc", fontStyle: "italic" }}>
                          {display.subsubheader}
                        </td>
                      </tr>
                    );
                  }

                  prevHeader = display.header;
                  prevSubheader = display.subheader;
                  prevSubsubheader = display.subsubheader;

                  rows.push(
                    <tr key={display.main}>
                      <td style={{ width: 150 }}>
                        <p className="fw-5">{display.main}</p>
                      </td>
                      <td style={{ width: 100 }}>
                        <p className="fw-5">{param.count}</p>
                      </td>
                      <td style={{ width: 100 }}>
                        <p className="fw-5">{param.marks}</p>
                      </td>
                    </tr>
                  );
                });

                return rows;
              })()}
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
        type="appreciation"
        application_id={0}
        parameter_name={""}
        parameter_id={""}
        setIsRefreshData={setIsRefreshData}
        isRefreshData={isRefreshData}
      />
      <ReqClarificationModal
        show={reqClarificationShow}
        handleClose={() => setReqClarificationShow(false)}
        clarification_doc={null}
        clarification={null}
      />
    </>
  );
};

export default CommandPanelDetail;