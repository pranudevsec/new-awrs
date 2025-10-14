import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { fetchApplicationUnitDetail } from "../../reduxToolkit/services/application/applicationService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";

const ClarificationDetail = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { application_id } = useParams();
  const { profile } = useAppSelector((state) => state.admin);


  const award_type = searchParams.get("award_type") ?? "";
  const numericAppId = Number(application_id);
  const [unitDetail, setUnitDetail] = useState<any>(null);
  const [approvedCount, setApprovedCount] = useState<Record<string, string>>({});
  const [approvedMarks, setApprovedMarks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (award_type && numericAppId) {
      dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }))
        .unwrap()
        .then((res: any) => {
          setUnitDetail(res.data);

          const initialCount: Record<string, string> = {};
          const initialMarks: Record<string, string> = {};
          res.data?.fds?.parameters?.forEach((param: any) => {
            initialCount[param.id] = param.approved_count?.toString() || "";
            initialMarks[param.id] = param.approved_marks?.toString() || "";
          });
          setApprovedCount(initialCount);
          setApprovedMarks(initialMarks);
        })
        .catch(() => {
        });
    }
  }, [award_type, numericAppId]);


  const handleApprovedCountChange = (paramId: string, value: string) => {

    if (!/^\d*$/.test(value)) return;
    
    setApprovedCount(prev => ({
      ...prev,
      [paramId]: value
    }));
    

    const countNum = value === "" ? 0 : Number(value);
    const param = unitDetail?.fds?.parameters?.find((p: any) => p.id === paramId);
    if (param) {
      const calculatedMarks = Math.min(
        countNum * param.per_unit_mark,
        param.max_marks
      );
      setApprovedMarks(prev => ({
        ...prev,
        [paramId]: calculatedMarks.toString()
      }));
    }
  };


  const handleApprovedMarksChange = (paramId: string, value: string) => {
    setApprovedMarks(prev => ({
      ...prev,
      [paramId]: value
    }));
  };


  const canEditApprovedMarks = profile?.user?.user_role && 
    ["brigade", "division", "corps", "command"].includes(profile.user.user_role);

  return (
    <div className="apply-citation-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title={`Application ID: #${unitDetail?.id || application_id}`}
          paths={[
            { label: "Home", href: "/applications" },
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
              <th style={{ width: 150, fontSize: "17", color: "white" }}>
                <div className="d-flex align-items-start">Approved Count</div>
              </th>
              <th style={{ width: 150, fontSize: "17", color: "white" }}>
                <div className="d-flex align-items-start">Approved Marks</div>
              </th>
              <th style={{ width: 120, fontSize: "17", color: "white" }}>
                <div className="d-flex align-items-start">Clarification</div>
              </th>
            </tr>
          </thead>
            <tbody>
            {unitDetail?.fds?.parameters?.map((param: any, index: number) => (
              <tr key={param.id || index}>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-5">{param.name || "Parameter"}</p>
                </td>
                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <p className="fw-5">{param.count || "0"}</p>
                </td>
                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <p className="fw-5">{param.marks || "0"}</p>
                </td>
                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  {param.upload ? (
                    <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  {canEditApprovedMarks ? (
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter approved count"
                      autoComplete="off"
                      value={approvedCount[param.id] || ""}
                      onChange={(e) => handleApprovedCountChange(param.id, e.target.value)}
                      min="0"
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Approved count"
                      autoComplete="off"
                      value={approvedCount[param.id] || ""}
                      readOnly
                    />
                  )}
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  {canEditApprovedMarks ? (
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Approved marks (auto-calculated)"
                      autoComplete="off"
                      value={approvedMarks[param.id] || ""}
                      onChange={(e) => handleApprovedMarksChange(param.id, e.target.value)}
                      min="0"
                      max={param.max_marks || 0}
                      step="0.01"
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Approved marks"
                      autoComplete="off"
                      value={approvedMarks[param.id] || ""}
                      readOnly
                    />
                  )}
                </td>
                <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                  <button
                    className="border-0 bg-transparent"
                    style={{ color: "var(--secondary-default)" }}
                  >
                    {SVGICON.app.clarification}
                  </button>
                </td>
              </tr>
            )) || (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <p className="text-muted mb-0">No parameters found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="submit-button-wrapper">
        <div className="d-flex gap-3 justify-content-end">
          <button className="_btn success">Accepted</button>
          <button className="_btn danger">Reject</button>
        </div>
      </div>
    </div>
  );
};

export default ClarificationDetail;