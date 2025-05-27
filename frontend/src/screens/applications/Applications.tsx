import { Link } from "react-router-dom";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";

const Applications = () => {
  return (
    <div className="application-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Home" />
      </div>
      <div className="row row-gap-3">
        <div className="col-lg-3 col-sm-6">
          <Link to="/applications/citation">
            <div className="card border-0 d-flex align-items-center justify-content-center">
              <div className="card-icon">
                <img src="/media/icons/medal.png" alt="Medal" width={100} />
              </div>
              <h5 className="fw-6 mt-4">Citation</h5>
            </div>
          </Link>
        </div>
        <div className="col-lg-3 col-sm-6">
          <Link to="/applications/appreciation">
            <div className="card border-0 d-flex align-items-center justify-content-center">
              <div className="card-icon">
                <img src="/media/icons/thumb.png" alt="Thumb" width={100} />
              </div>
              <h5 className="fw-6 mt-4">Appreciation</h5>
            </div>
          </Link>
        </div>
        <div className="col-lg-3 col-sm-6">
          <Link to="/applications/list">
            <div className="card border-0 d-flex align-items-center justify-content-center position-relative">
              <span className="count-badge">5</span>
              <div className="card-icon">
                <img src="/media/icons/applications.png" alt="Applications" width={100} />
              </div>
              <h5 className="fw-6 mt-4">Applications</h5>
            </div>
          </Link>
        </div>
        <div className="col-lg-3 col-sm-6">
          <Link to="/applications/clarification/list">
            <div className="card border-0 d-flex align-items-center justify-content-center">
              <span className="count-badge">9</span>
              <div className="card-icon">
                <img src="/media/icons/clarifications.png" alt="Clarifications" width={100} />
              </div>
              <h5 className="fw-6 mt-4">Clarifications</h5>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Applications;
