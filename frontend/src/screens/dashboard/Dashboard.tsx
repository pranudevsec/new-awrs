import ApplicationStatus from "./components/ApplicationStatus"
import AssetsDetail from "./components/AssetsDetail"
import TopWinnersList from "./components/TopWinnersList"
import UnitScoreChart from "./components/UnitScoreChart"

const Dashboard = () => {
    return (
        <div className="dashboard-section">
            <AssetsDetail />
            <div className="row mb-4">
                <div className="col-md-4">
                    <UnitScoreChart />
                </div>
                <div className="col-md-8">
                    <ApplicationStatus />
                </div>
            </div>
            <TopWinnersList />
        </div>
    )
}

export default Dashboard