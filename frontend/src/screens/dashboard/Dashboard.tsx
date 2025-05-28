import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb"
import ApplicationStatus from "./components/ApplicationStatus"
import AssetsDetail from "./components/AssetsDetail"
import TopCandidates from "./components/TopCandidates"
import TopWinnersList from "./components/TopWinnersList"
import UnitScoreChart from "./components/UnitScoreChart"

const Dashboard = () => {
    return (
        <div className="dashboard-section">
            <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                <Breadcrumb title="Dashboard" />
            </div>
            <AssetsDetail />
            <div className="row mb-4 row-gap-4">
                <div className="col-lg-4">
                    <UnitScoreChart />
                </div>
                <div className="col-lg-5">
                    <ApplicationStatus />
                </div>
                <div className="col-lg-3">
                    <TopCandidates />
                </div>
            </div>
            <TopWinnersList />
        </div>
    )
}

export default Dashboard