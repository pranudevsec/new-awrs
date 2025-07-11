import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { getHomeCountStats } from "../../reduxToolkit/services/command-panel/commandPanelService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";

const Applications = () => {
  const dispatch = useAppDispatch();

  const profile = useAppSelector((state) => state.admin.profile);
  const { homeCounts } = useAppSelector((state) => state.commandPanel);
  const userRole = profile?.user?.user_role;

  const isUnitRole = userRole === "unit";
  const isHigherRole = ["brigade", "division", "corps", "command"].includes(
    userRole ?? ""
  );

  useEffect(() => {
    dispatch(getHomeCountStats());
  }, [dispatch]);

  return (
    <div className="application-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Home" />
      </div>
      <div className="row row-gap-3">
        {isUnitRole && (
          <>
            <div className="col-lg-3 col-sm-6">
              <Link to="/applications/citation" className="h-100 d-block">
                <div className="card border-0 h-100 d-flex align-items-center justify-content-center">
                  <div className="card-icon">
                    <img src="/media/icons/medal.png" alt="Medal" width={100} />
                  </div>
                  <h5 className="fw-6 mt-4">Citation</h5>
                </div>
              </Link>
            </div>
            <div className="col-lg-3 col-sm-6">
              <Link to="/applications/appreciation" className="h-100 d-block">
                <div className="card border-0 h-100 d-flex align-items-center justify-content-center">
                  <div className="card-icon">
                    <img src="/media/icons/thumb.png" alt="Thumb" width={100} />
                  </div>
                  <h5 className="fw-6 mt-4">Appreciation</h5>
                </div>
              </Link>
            </div>
          </>
        )}
        {userRole !== "unit" && (
          <div className="col-lg-3 col-sm-6">
            <Link to="/applications/list" className="h-100 d-block">
              <div className="card border-0 h-100 d-flex align-items-center justify-content-center position-relative">
                {homeCounts?.applicationsToReview > 0 && (
                  <span className="count-badge">
                    {homeCounts?.applicationsToReview}
                  </span>
                )}
                <div className="card-icon">
                  <img
                    src="/media/icons/applications.png"
                    alt="Applications"
                    width={100}
                  />
                </div>
                <h5 className="fw-6 mt-4">
                  {userRole === "headquarter" ? "Submitted by Commands" : "Applications To Review"}
                </h5>

              </div>
            </Link>
          </div>
        )}
        {isHigherRole && (
          <>
            <div className="col-lg-3 col-sm-6">
              <Link to="/clarifications/raised-list" className="h-100 d-block">
                <div className="card border-0 h-100 d-flex align-items-center justify-content-center position-relative">
                  {homeCounts?.clarificationsIRaised > 0 && (
                    <span className="count-badge">
                      {homeCounts?.clarificationsIRaised}
                    </span>
                  )}
                  <div className="card-icon">
                    <img
                      src="/media/icons/clarifications.png"
                      alt="Clarification Raised"
                      width={100}
                    />
                  </div>
                  <h5 className="fw-6 mt-4">Clarification Raised</h5>
                </div>
              </Link>
            </div>
            {userRole !== "command" && (
              <div className="col-lg-3 col-sm-6">
                <Link to="/clarification" className="h-100 d-block">
                  <div className="card border-0 h-100 d-flex align-items-center justify-content-center position-relative">
                    {homeCounts?.clarificationsToResolve > 0 && (
                      <span className="count-badge">
                        {homeCounts?.clarificationsToResolve}
                      </span>
                    )}
                    <div className="card-icon">
                      <img
                        src="/media/icons/raised-clarification.png"
                        alt="Clarification Received"
                        width={100}
                      />
                    </div>
                    <h5 className="fw-6 mt-4">Clarification Received</h5>
                  </div>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Applications;
