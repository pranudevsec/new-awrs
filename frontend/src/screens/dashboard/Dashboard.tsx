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
            placeholder="Select Type"
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
