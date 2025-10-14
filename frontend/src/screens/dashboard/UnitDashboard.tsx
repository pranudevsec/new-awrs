import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import ApplicationStatus from "./components/ApplicationStatus";
import AssetsDetail from "./components/AssetsDetail";
import UnitScoreChart from "./components/UnitScoreChart";
import Loader from "../../components/ui/loader/Loader";
import { getHomeCountStats } from "../../reduxToolkit/services/command-panel/commandPanelService";
import { fetchApplicationHistory, fetchSubordinates, fetchDashboardStats } from "../../reduxToolkit/services/application/applicationService";

const UnitDashboard = ({ level }: { level: "brigade" | "division" | "corps" | "command"}) => {
  const dispatch = useAppDispatch();
  const [pendingUnits, setPendingUnits] = useState<any[]>([]);
  const [historyUnits, setHistoryUnits] = useState<any[]>([]);
  const [awardTypeFilter, setAwardTypeFilter] = useState<string>("All");

  const loading = useAppSelector(state => state.application.loading);
  const dashboardStats = useAppSelector(state => state.application.dashboardStats);

  useEffect(() => {
    dispatch(getHomeCountStats());
    setAwardTypeFilter("")

    const dashboardParams = {
      page: 1,
      limit: 10,
      ...(awardTypeFilter !== "All" ? { award_type: awardTypeFilter } : {})
    };
    dispatch(fetchDashboardStats(dashboardParams));
    
    const params = {
      isGetNotClarifications: true,
      ...(awardTypeFilter !== "All" ? { award_type: awardTypeFilter } : {})
    };
    dispatch(fetchSubordinates(params)).then((action: any) => {
      if (action.payload?.data) {
        setPendingUnits(action.payload.data);
      }
    });

    const historyParams = {
      ...(awardTypeFilter !== "All" ? { award_type: awardTypeFilter } : {})
    };
    dispatch(fetchApplicationHistory(historyParams)).then((action: any) => {
      if (action.payload?.data) {
        setHistoryUnits(action.payload.data);
      }
    });
  }, [dispatch, level, awardTypeFilter]);


  const stats = dashboardStats || {
    totalPendingApplications: pendingUnits.length,
    approved: historyUnits.filter((u: any) =>
      (u.status_flag ?? '').toLowerCase() === "approved"
    ).length,
    rejected: historyUnits.filter((u: any) => {
      const status = (u.status_flag ?? '').toLowerCase();
      return status === "rejected";
    }).length,
    acceptedApplications: 0,
    clarificationRaised: 0
  };


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
      return acc + (approved ?? original);
    }, 0);
    return totalParameterMarks + graceMarks - totalNegativeMarks;
  };


  const graphUnits = pendingUnits;

  const unitMetrics = graphUnits.map((unit) => {
    const parameters = unit?.fds?.parameters ?? [];
    const totalNegativeMarks = parameters
      .filter((param: any) => param?.negative)
      .reduce((acc: number, param: any) => acc + Number(param?.marks ?? 0), 0);
    const numParametersFilled = parameters.filter((param: any) =>
      param?.approved_marks !== undefined && param?.approved_marks !== null && param?.approved_marks !== ""
    ).length;
    return {
      name: `Unit#${unit.unit_id}`,
      totalMarks: getTotalMarks(unit),
      totalNegativeMarks,
      numParametersFilled,
    };
  });


  // const handleExportPDF = () => {
  //   const pdfData = pendingUnits.map((unit: any) => {
  //     const parameters = unit?.fds?.parameters ?? [];
  //     const totalNegativeMarks = parameters
  //       .filter((param: any) => param?.negative)
  //       .reduce((acc: number, param: any) => acc + Number(param?.marks ?? 0), 0);
  //     return [
  //       unit.id,
  //       unit.unit_id,
  //       unit.fds.unit_type ?? '',
  //       getTotalMarks(unit),
  //       totalNegativeMarks,
  //       unit.type ? unit.type.charAt(0).toUpperCase() + unit.type.slice(1) : '-',
  //     ];
  //   });

  //   const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    

  //   doc.setFontSize(16);
  //   doc.text("Pending Applications Report", 14, 22);


  //   autoTable(doc, {
  //     head: [['Application Id', 'Unit ID', 'Arm/Service', 'Total Marks', 'Total Negative Marks', 'Application Type']],
  //     body: pdfData,
  //     startY: 30,
  //     theme: "grid",
  //     headStyles: { fillColor: [41, 128, 185] },
  //     styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
  //     columnStyles: {
  //       3: { cellWidth: 60, halign: "right" }, // Total Marks column
  //       4: { cellWidth: 60, halign: "right" }, // Total Negative Marks column
  //     },
  //   });

  //   doc.save('Pending_Applications.pdf');
  // };

  if (loading) return <Loader />;

  return (
    <div className="dashboard-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title={"Dashboard"} />
      </div>
      {/* Filters and export removed for brigade/division/corps dashboards as requested */}
      <AssetsDetail dashboardStats={stats} />
      <div className="row mb-4 row-gap-4">
        {unitMetrics.length === 0 ? (
          <div className="text-center text-muted" style={{height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}>No pending units to display.</div>
        ) : (
          <>
            <div className="col-lg-4 col-md-6 col-12 mb-3">
              <UnitScoreChart  dataKey="totalMarks" title="Total Marks"  height={180} />
            </div>
            <div className="col-lg-4 col-md-6 col-12 mb-3">
              <UnitScoreChart  dataKey="totalNegativeMarks" title="Total Negative Marks" barColor="#e57373"  height={180} />
            </div>
            <div className="col-lg-4 col-md-6 col-12 mb-3">
              <ApplicationStatus dashboardStats={stats} />
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
                    const parameters = unit?.fds?.parameters ?? [];
                    const totalNegativeMarks = parameters
                      .filter((param: any) => param?.negative)
                      .reduce((acc: number, param: any) => acc + Number(param?.marks ?? 0), 0);
                    return (
                      <tr key={unit.id}>
                        <td>{unit.id}</td>
                        <td>{unit.unit_id}</td>
                        <td>{unit.fds.unit_type ?? ''}</td>
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