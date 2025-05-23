import { Link } from "react-router-dom"
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb"

const Applications = () => {
    return (
        <div className="application-section">
            <Breadcrumb title="Applications" />
            <div className="row row-gap-3">
                <div className="col-lg-3 col-sm-6">
                    <Link to="/applications/citation">
                        <div className="card border-0 d-flex align-items-center justify-content-center">
                            <div className="card-icon" >
                                <img src="/media/icons/medal.png" alt="Medal" width={100} />
                            </div>
                            <h5 className="fw-6 mt-4">Citation</h5>
                        </div>
                    </Link>
                </div>
                <div className="col-lg-3 col-sm-6">
                    <Link to="/applications/appreciation">
                        <div className="card border-0 d-flex align-items-center justify-content-center">
                            <div className="card-icon" >
                                <img src="/media/icons/thumb.png" alt="Thumb" width={100} />
                            </div>
                            <h5 className="fw-6 mt-4">Appreciation</h5>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Applications