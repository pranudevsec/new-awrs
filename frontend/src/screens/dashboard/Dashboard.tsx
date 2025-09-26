import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import {
  getDashboardStats,
  getDashboardUnitScores,
  getScoreBoards,
} from "../../reduxToolkit/services/command-panel/commandPanelService";
import {
  fetchAllApplications,
  fetchApplicationsForHQ,
  fetchDashboardStats,
} from "../../reduxToolkit/services/application/applicationService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import ApplicationStatus from "./components/ApplicationStatus";
import AssetsDetail from "./components/AssetsDetail";
import UnitScoreChart from "./components/UnitScoreChart";
import FormSelect from "../../components/form/FormSelect";
import { awardTypeOptions } from "../../data/options";
import TopWinnersList from "./components/TopWinnersList";

const Dashboard = () => {
  const dispatch = useAppDispatch();

  const [awardTypeFilter, setAwardTypeFilter] = useState<string>("All");

  const { dashboardStats } = useAppSelector(
    (state) => state.application
  );

  // const { units: hqApplications } = useAppSelector(
  //   (state) => state.application
  // );

  useEffect(() => {
    dispatch(getDashboardStats());
    dispatch(getDashboardUnitScores());
    dispatch(
      fetchApplicationsForHQ({
        award_type: awardTypeFilter !== "All" ? awardTypeFilter : undefined,
        page: 1,
        limit: 100,
      })
    );
  }, []);

  useEffect(() => {
    const params = {
      award_type: awardTypeFilter !== "All" ? awardTypeFilter : "",
      search: "",
      limit: 5,
      page: 1,
    };
    const dashboardParams = {
      page: 1,
      limit: 10,
      ...(awardTypeFilter !== "All" ? { award_type: awardTypeFilter } : {}),
    };
    dispatch(fetchAllApplications(params)).unwrap();
    dispatch(fetchDashboardStats(dashboardParams));
    dispatch(getScoreBoards(params));
    dispatch(
      fetchApplicationsForHQ({
        award_type: awardTypeFilter !== "All" ? awardTypeFilter : undefined,
        page: 1,
        limit: 100,
      })
    );
  }, [awardTypeFilter]);

  // Helper to calculate total marks for an application (copied from UnitDashboard)
  // const getTotalMarks = (unit: any): number => {
  //   const parameters = unit?.fds?.parameters ?? [];
  //   const graceMarks =
  //     unit?.fds?.applicationGraceMarks?.reduce(
  //       (acc: number, item: any) => acc + (item?.marks ?? 0),
  //       0
  //     ) ?? 0;
  //   let totalNegativeMarks = 0;
  //   const totalParameterMarks = parameters.reduce((acc: number, param: any) => {
  //     const isRejected =
  //       param?.clarification_details?.clarification_status === "rejected";
  //     if (isRejected) return acc;
  //     const hasValidApproved =
  //       param?.approved_marks !== undefined &&
  //       param?.approved_marks !== null &&
  //       param?.approved_marks !== "" &&
  //       !isNaN(Number(param?.approved_marks));
  //     const approved = hasValidApproved ? Number(param.approved_marks) : null;
  //     let original = 0;
  //     if (param?.negative) {
  //       totalNegativeMarks += Number(param?.marks ?? 0);
  //     } else {
  //       original = Number(param?.marks ?? 0);
  //     }
  //     return acc + (approved ?? original);
  //   }, 0);
  //   return totalParameterMarks + graceMarks - totalNegativeMarks;
  // };

  // Prepare data for HQ bar graph
  // const hqChartData = (hqApplications || [])
  //   .filter(
  //     (app: any) =>
  //       app && (typeof app.id === "number" || typeof app.id === "string")
  //   )
  //   .map((app: any) => {
  //     let nameValue = `unit${app.unit_id}`;
  //     if (typeof nameValue === "object" && nameValue !== null) {
  //       // Defensive: if name is an object, convert to JSON string
  //       nameValue = JSON.stringify(nameValue);
  //     } else if (typeof nameValue !== "string") {
  //       nameValue = "" + nameValue;
  //     }
  //     return {
  //       name:
  //         nameValue && nameValue.trim().length > 0
  //           ? nameValue
  //           : `App#${app.id}`,
  //       totalMarks: getTotalMarks(app),
  //     };
  //   });

  // const getDynamicDomain = (arr: number[]): [number, number] => {
  //   if (!arr || arr.length === 0) return [0, 10];
  //   const max = Math.max(...arr, 0);
  //   // Round up to the next multiple of 10 for a cleaner axis
  //   const roundedMax = isNaN(max) || max <= 10 ? 10 : Math.ceil(max / 10) * 10;
  //   return [0, roundedMax];
  // };

  // Show loader
  // if (loading || appLoading) return <Loader />;

  return (
    <div className="dashboard-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Dashboard" />
      </div>

      <AssetsDetail dashboardStats={dashboardStats} unitType="cw2" />
      <div className="row mb-4 row-gap-4">
        <div className="col-lg-8">
          <UnitScoreChart
            title="Application Received"
            showFilter={true}
          />
        </div>
        <div className="col-lg-4">
          <ApplicationStatus dashboardStats={dashboardStats} />
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6 col-12 mb-1">
          <FormSelect
            label="Award Type Filter"
            name="awardTypeFilter"
            options={awardTypeOptions}
            value={
              awardTypeOptions.find((opt) => opt.value === awardTypeFilter) ??
              null
            }
            onChange={(selectedOption) =>
              setAwardTypeFilter(selectedOption?.value ?? "All")
            }
            placeholder="Select Award Type"
          />
        </div>
      </div>
      <div className="mb-2">
        <TopWinnersList />
      </div>
    </div>
  );
};

export default Dashboard;
