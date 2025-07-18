import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import ApplicationStatus from "./components/ApplicationStatus";
import AssetsDetail from "./components/AssetsDetail";
import UnitScoreChart from "./components/UnitScoreChart";
import Loader from "../../components/ui/loader/Loader";
import { getHomeCountStats } from "../../reduxToolkit/services/command-panel/commandPanelService";
import { fetchApplicationHistory, fetchSubordinates } from "../../reduxToolkit/services/application/applicationService";

const LEVEL_TITLES: Record<string, string> = {
  brigade: "Brigade Dashboard",
  division: "Division Dashboard",
  corps: "Corps Dashboard",
};

const UnitDashboard = ({ level }: { level: "brigade" | "division" | "corps" }) => {
  const dispatch = useAppDispatch();
  const [pendingUnits, setPendingUnits] = useState<any[]>([]);
  const [historyUnits, setHistoryUnits] = useState<any[]>([]);

  // Get data from redux
  const homeCounts = useAppSelector(state => state.commandPanel.homeCounts);
  const loading = useAppSelector(state => state.application.loading);

  // Fetch data on mount
  useEffect(() => {
    dispatch(getHomeCountStats());
    dispatch(fetchSubordinates({ isGetNotClarifications: true })).then((action: any) => {
      if (action.payload && action.payload.data) {
        setPendingUnits(action.payload.data);
      }
    });
    dispatch(fetchApplicationHistory()).then((action: any) => {
      if (action.payload && action.payload.data) {
        setHistoryUnits(action.payload.data);
      }
    });
  }, [dispatch, level]);

  // Calculate stats from history
  const pending = homeCounts?.applicationsToReview || 0;
  const approved = historyUnits.filter((u: any) =>
    (u.status_flag || '').toLowerCase() === "approved"
  ).length;
  const rejected = historyUnits.filter((u: any) =>
    (u.status_flag || '').toLowerCase() === "rejected"
  ).length;

  // Compose dashboardStats object for components
  const dashboardStats = {
    totalPendingApplications: pending,
    approved,
    rejected,
    clarificationRaised: 0 // Set this if you have a source for it
  };

  // Helper to calculate total marks for a unit (from AcceptedApplicationsList)
  const getTotalMarks = (unit: any): number => {
    const parameters = unit?.fds?.parameters ?? [];
    const graceMarks =
      unit?.fds?.applicationGraceMarks?.reduce(
        (acc: number, item: any) => acc + (item?.marks ?? 0),
        0
      ) ?? 0;
    let totalNegativeMarks = 0;
    const totalParameterMarks = parameters.reduce((acc: number, param: any) => {
      const isRejected =
        param?.clarification_details?.clarification_status === "rejected";
      if (isRejected) return acc;
      const hasValidApproved =
        param?.approved_marks !== undefined &&
        param?.approved_marks !== null &&
        param?.approved_marks !== "" &&
        !isNaN(Number(param?.approved_marks));
      const approved = hasValidApproved ? Number(param.approved_marks) : null;
      let original = 0;
      if (param?.negative) {
        totalNegativeMarks += Number(param?.marks ?? 0);
      } else {
        original = Number(param?.marks ?? 0);
      }
      return acc + (approved !== null ? approved : original);
    }, 0);
    return totalParameterMarks + graceMarks - totalNegativeMarks;
  };

  // Prepare data for bar graph: use all pendingUnits
  const graphUnits = pendingUnits;
  // Prepare metrics for each unit
  const unitMetrics = graphUnits.map((unit) => {
    const parameters = unit?.fds?.parameters ?? [];
    const totalNegativeMarks = parameters
      .filter((param: any) => param?.negative)
      .reduce((acc: number, param: any) => acc + Number(param?.marks ?? 0), 0);
    const numParametersFilled = parameters.filter((param: any) =>
      param?.approved_marks !== undefined && param?.approved_marks !== null && param?.approved_marks !== ""
    ).length;
    return {
      name: unit.name || unit.unit_name || `Application#${unit.id}`,
      totalMarks: getTotalMarks(unit),
      totalNegativeMarks,
      numParametersFilled,
    };
  });

  // Calculate dynamic y-axis domains for each metric
  const getDynamicDomain = (arr: number[]): [number, number] => {
    if (!arr || arr.length === 0) return [0, 10];
    const max = Math.max(...arr, 0);
    // Round up to the next multiple of 10 for a cleaner axis
    const roundedMax = isNaN(max) || max <= 10 ? 10 : Math.ceil(max / 10) * 10;
    return [0, roundedMax];
  };

  const totalMarksDomain = getDynamicDomain(unitMetrics.map(u => u.totalMarks));
  const totalNegativeMarksDomain = getDynamicDomain(unitMetrics.map(u => u.totalNegativeMarks));

  if (loading) return <Loader />;

  return (
    <div className="dashboard-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title={LEVEL_TITLES[level] || "Dashboard"} />
      </div>
      <AssetsDetail dashboardStats={dashboardStats} />
      <div className="row mb-4 row-gap-4">
        {unitMetrics.length === 0 ? (
          <div className="text-center text-muted" style={{height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}>No pending units to display.</div>
        ) : (
          <>
            <div className="col-lg-4 col-md-6 col-12 mb-3">
              <UnitScoreChart data={unitMetrics} dataKey="totalMarks" title="Total Marks" yAxisDomain={totalMarksDomain} height={180} />
            </div>
            <div className="col-lg-4 col-md-6 col-12 mb-3">
              <UnitScoreChart data={unitMetrics} dataKey="totalNegativeMarks" title="Total Negative Marks" barColor="#e57373" yAxisDomain={totalNegativeMarksDomain} height={180} />
            </div>
            <div className="col-lg-4 col-md-6 col-12 mb-3">
              <ApplicationStatus dashboardStats={dashboardStats} />
            </div>
          </>
        )}
      </div>
      {/* Table of pending applications with marks */}
      {pendingUnits.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="table-responsive">
              <table className="table-style-1 w-100">
                <thead>
                  <tr style={{ backgroundColor: "#007bff"}}>
                    <th style={{ color: "#fff" }}>Application Id</th>
                    <th style={{ color: "#fff" }}>Unit ID</th>
                    <th style={{ color: "#fff" }}>Arm/Service</th>
                    <th style={{ color: "#fff" }}>Total Marks</th>
                    <th style={{ color: "#fff" }}>Total Negative Marks</th>
                    <th style={{ color: "#fff" }}>Application Type</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUnits.map((unit: any) => {
                    {console.log(unit)}
                    const parameters = unit?.fds?.parameters ?? [];
                    const totalNegativeMarks = parameters
                      .filter((param: any) => param?.negative)
                      .reduce((acc: number, param: any) => acc + Number(param?.marks ?? 0), 0);
                    return (
                      <tr key={unit.id}>
                        <td>{unit.id}</td>
                        <td>{unit.unit_id}</td>
                        <td>{unit.fds.unit_type || ''}</td>
                        <td>{getTotalMarks(unit)}</td>
                        <td>{totalNegativeMarks}</td>
                        <td>{unit.type ? unit.type.charAt(0).toUpperCase() + unit.type.slice(1) : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <div className="row mb-4 row-gap-4">
        {/* Additional widgets or components can go here */}
      </div>
    </div>
  );
};

export default UnitDashboard; 