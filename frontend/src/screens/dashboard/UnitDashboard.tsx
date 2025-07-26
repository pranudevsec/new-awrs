import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import ApplicationStatus from "./components/ApplicationStatus";
import AssetsDetail from "./components/AssetsDetail";
import UnitScoreChart from "./components/UnitScoreChart";
import Loader from "../../components/ui/loader/Loader";
import FormSelect from "../../components/form/FormSelect";
import { getHomeCountStats } from "../../reduxToolkit/services/command-panel/commandPanelService";
import { fetchApplicationHistory, fetchSubordinates } from "../../reduxToolkit/services/application/applicationService";
import { awardTypeOptions } from "../../data/options";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const UnitDashboard = ({ level }: { level: "brigade" | "division" | "corps" | "command"}) => {
  const dispatch = useAppDispatch();
  const [pendingUnits, setPendingUnits] = useState<any[]>([]);
  const [historyUnits, setHistoryUnits] = useState<any[]>([]);
  const [acceptedApplicationsCount, setAcceptedApplicationsCount] = useState<number>(0);
  const [awardTypeFilter, setAwardTypeFilter] = useState<string>("All");

  // Get data from redux
  const loading = useAppSelector(state => state.application.loading);
  const profile = useAppSelector(state => state.admin.profile);

  // Fetch data on mount
  useEffect(() => {
    dispatch(getHomeCountStats());
    const params = {
      isGetNotClarifications: true,
      ...(awardTypeFilter !== "All" ? { award_type: awardTypeFilter } : {})
    };
    dispatch(fetchSubordinates(params)).then((action: any) => {
      action.payload?.data && setPendingUnits(action.payload.data);
    });

    const historyParams = {
      ...(awardTypeFilter !== "All" ? { award_type: awardTypeFilter } : {})
    };
    dispatch(fetchApplicationHistory(historyParams)).then((action: any) => {
      action.payload?.data && setHistoryUnits(action.payload.data);
    });
    // Fetch accepted applications count
    const acceptedParams = {
      isShortlisted: true,
      limit: 1000,
      ...(awardTypeFilter !== "All" ? { award_type: awardTypeFilter } : {})
    };
    dispatch(fetchSubordinates(acceptedParams)).then((action: any) => {
      action.payload?.data && setAcceptedApplicationsCount(action.payload.data.length);
    });
  }, [dispatch, level, awardTypeFilter]);

  // Calculate stats from history
  // Calculate pending from filtered data instead of unfiltered Redux state
  const pending = pendingUnits.length;
  const approved = historyUnits.filter((u: any) =>
    (u.status_flag ?? '').toLowerCase() === "approved"
  ).length;
  const rejected = historyUnits.filter((u: any) => {
    const status = (u.status_flag ?? '').toLowerCase();
    const rejectedBy = u.last_rejected_by_role ?? '';
    const userRole = profile?.user?.user_role ?? '';
    return status === "rejected" && rejectedBy.toLowerCase() === userRole.toLowerCase();
  }).length;

  // Compose dashboardStats object for components
  const dashboardStats = {
    totalPendingApplications: pending,
    approved,
    rejected,
    acceptedApplications: acceptedApplicationsCount,
    clarificationRaised: 0 // Add missing property to fix linter error
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
      return acc + (approved ?? original);
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
      name: `Unit#${unit.unit_id}`,
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
    const roundedMax = isNaN(max) ?? max <= 10 ? 10 : Math.ceil(max / 10) * 10;
    return [0, roundedMax];
  };

  const totalMarksDomain = getDynamicDomain(unitMetrics.map(u => u.totalMarks));
  const totalNegativeMarksDomain = getDynamicDomain(unitMetrics.map(u => u.totalNegativeMarks));

  // Export to Excel handler
  const handleExportExcel = () => {
    const excelData = pendingUnits.map((unit: any) => {
      const parameters = unit?.fds?.parameters ?? [];
      const totalNegativeMarks = parameters
        .filter((param: any) => param?.negative)
        .reduce((acc: number, param: any) => acc + Number(param?.marks ?? 0), 0);
      return {
        'Application Id': unit.id,
        'Unit ID': unit.unit_id,
        'Arm/Service': unit.fds.unit_type ?? '',
        'Total Marks': getTotalMarks(unit),
        'Total Negative Marks': totalNegativeMarks,
        'Application Type': unit.type ? unit.type.charAt(0).toUpperCase() + unit.type.slice(1) : '-',
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'Pending_Applications.xlsx');
  };

  if (loading) return <Loader />;

  return (
    <div className="dashboard-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title={"Dashboard"} />
      </div>
      <div className="row mb-4">
        <div className="col-lg-6 col-md-6 col-12 mb-3">
          <FormSelect
            label="Award Type Filter"
            name="awardTypeFilter"
            options={awardTypeOptions}
            value={awardTypeOptions.find((opt) => opt.value === awardTypeFilter) ?? null}
            onChange={(selectedOption) => setAwardTypeFilter(selectedOption?.value ?? "All")}
            placeholder="Select Award Type"
          />
        </div>
        {pendingUnits.length > 0 && (
          <div className="col-lg-6 col-md-6 col-12 mb-3 d-flex align-items-end justify-content-end">
            <button className="_btn _btn-lg primary" onClick={handleExportExcel}>
              Export to Excel
            </button>
          </div>
        )}
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