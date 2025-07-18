import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks"
import { getDashboardStats, getDashboardUnitScores, getScoreBoards } from "../../reduxToolkit/services/command-panel/commandPanelService"
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb"
import ApplicationStatus from "./components/ApplicationStatus"
import AssetsDetail from "./components/AssetsDetail"
import TopCandidates from "./components/TopCandidates"
import TopWinnersList from "./components/TopWinnersList"
import UnitScoreChart from "./components/UnitScoreChart"
import Loader from "../../components/ui/loader/Loader"

const Dashboard = () => {
    const dispatch = useAppDispatch();

    const [reportCount, setReportCount] = useState(5);

    const { loading, dashboardStats, unitScores } = useAppSelector((state) => state.commandPanel);

    useEffect(() => {
        dispatch(getDashboardStats());
        dispatch(getDashboardUnitScores());
    }, []);

    useEffect(() => {
        dispatch(getScoreBoards({ award_type: "", search: "", limit: reportCount, page: 1 }));
    }, [reportCount])

    // Show loader
    if (loading) return <Loader />

    return (
        <div className="dashboard-section">
            <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                <Breadcrumb title="Dashboard" />
            </div>
            <AssetsDetail dashboardStats={dashboardStats} />
            <div className="row mb-4 row-gap-4">
                <div className="col-lg-4">
                <UnitScoreChart
                    data={unitScores}
                    dataKey="score"
                    title="Unit Scores"
                />
                </div>
                <div className="col-lg-5">
                    <ApplicationStatus dashboardStats={dashboardStats} />
                </div>
                <div className="col-lg-3">
                    <TopCandidates setReportCount={setReportCount} reportCount={reportCount} />
                </div>
            </div>
            <TopWinnersList />
        </div>
    )
}

export default Dashboard