import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { getHomeCountStats } from "../../reduxToolkit/services/command-panel/commandPanelService";
import { DisclaimerText } from "../../data/options";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import DisclaimerModal from "../../modals/DisclaimerModal";
import { fetchParameters } from "../../reduxToolkit/services/parameter/parameterService";

const Applications = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const profile = useAppSelector((state) => state.admin.profile);
  const { homeCounts } = useAppSelector((state) => state.commandPanel);
  const userRole = profile?.user?.user_role;
  const isSpecialUnit = profile?.user?.is_special_unit;
  const isUnitRole = userRole === "unit";
  const isHigherRole = ["brigade", "division", "corps", "command"].includes(userRole ?? "");
  const [citationParams, setCitationParams] = useState<any[]>([]);
  const [appreciationParams, setAppreciationParams] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {

        const citationRes = await dispatch(
          fetchParameters({
            awardType: "citation",
            search: "",
            matrix_unit: profile?.unit?.matrix_unit ?? undefined,
            comd: profile?.unit?.comd ?? undefined,
            unit_type: profile?.unit?.unit_type ?? undefined,
            page: 1,
            limit: 5000,
          })
        ).unwrap();

        if (citationRes.success && citationRes.data?.length > 0) {
          setCitationParams([...citationRes.data].reverse());
        }


        const appreciationRes = await dispatch(
          fetchParameters({
            awardType: "appreciation",
            search: "",
            matrix_unit: profile?.unit?.matrix_unit ?? undefined,
            comd: profile?.unit?.comd ?? undefined,
            unit_type: profile?.unit?.unit_type ?? undefined,
            page: 1,
            limit: 5000,
          })
        ).unwrap();

        if (appreciationRes.success && appreciationRes.data?.length > 0) {
          setAppreciationParams([...appreciationRes.data].reverse());
        }
      } catch (error) {
      }
    };

    fetchData();
  }, [profile, dispatch]);

  useEffect(() => {
    dispatch(getHomeCountStats());
  }, [dispatch]);

  const handleCardClick = (path: string) => {
    setDestination(path);
    setShowModal(true);
  };

  const handleModalConfirm = () => {
    if (destination) navigate(destination);
    setShowModal(false);
  };

  // Calculate total height based on number of cards
  const calculateTotalHeight = () => {
    let cardCount = 0;
    if (!profile?.user?.is_special_unit && citationParams.length > 0) cardCount++;
    if (appreciationParams.length > 0) cardCount++;
    if (isSpecialUnit && appreciationParams.length > 0) cardCount++;
    
    const cardHeight = 220;
    const gap = 16; // 1rem = 16px for mb-4
    return cardCount * cardHeight + (cardCount - 1) * gap;
  };

  return (
    <div className="application-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Home" />
      </div>
      <div className="row row-gap-3">
        {isUnitRole && (
          <div
            className="d-flex flex-md-row flex-column justify-content-start align-items-start gap-5"
            style={{ marginTop: "1rem" }}
          >
            {citationParams.length === 0 && appreciationParams.length === 0 && (
              <h6 className="text-muted text-center mt-3">
                No forms are available for the selected settings at this time.
              </h6>
            )}

            {/* Cards column */}
            <div
              className="d-flex flex-column align-items-stretch justify-content-start"
              style={{ minWidth: 350, paddingLeft: 16 }}
            >
              {!profile?.user?.is_special_unit && citationParams.length > 0 && (
                <div className="mb-4 w-100">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick("/applications/citation")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCardClick("/applications/citation");
                      }
                    }}
                    className="d-block w-100"
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="card border-0 d-flex align-items-center justify-content-center shadow-sm hover-shadow position-relative w-100"
                      style={{ height: 220 }}
                    >
                      <div className="card-icon mb-2">
                        <img src="/media/icons/medal.png" alt="Medal" width={80} />
                      </div>
                      <h5 className="fw-6 mt-2 mb-0">Citation</h5>
                      <span className="text-muted small mt-1">
                        Apply for citation awards
                      </span>
                      <span className="small mt-1 text-danger">
                        (Only for units in field)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Appreciation Card */}
              {appreciationParams.length > 0 && <div className="w-100 mb-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardClick("/applications/appreciation")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick("/applications/appreciation");
                    }
                  }}
                  className="d-block w-100"
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className="card border-0 d-flex align-items-center justify-content-center shadow-sm hover-shadow position-relative w-100"
                    style={{ height: 220 }}
                  >
                    <div className="card-icon mb-2">
                      <img src="/media/icons/thumb.png" alt="Thumb" width={80} />
                    </div>
                    <h5 className="fw-6 mt-2 mb-0">Appreciation</h5>
                    <span className="text-muted small mt-1">
                      Apply for appreciation awards
                    </span>
                    <span className="small mt-1 text-danger">
                      (Only for static units and units in peace)
                    </span>
                  </div>
                </div>
              </div>}

              {/* Honour Card if special unit */}
              {isSpecialUnit && appreciationParams.length > 0 && (
                <div className="w-100">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick("/applications/appreciation?is_vcoas=true")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCardClick("/applications/appreciation");
                      }
                    }}
                    className="d-block w-100"
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="card border-0 d-flex align-items-center justify-content-center shadow-sm hover-shadow position-relative w-100"
                      style={{ height: 220 }}
                    >
                      <div className="card-icon mb-2">
                        <img src="/media/icons/thumb.png" alt="Thumb" width={80} />
                      </div>
                      <h5 className="fw-6 mt-2 mb-0">VCOAS Appreciation</h5>
                      <span className="text-muted small mt-1">
                        Apply for appreciation awards
                      </span>
                      <span className="small mt-1 text-danger">
                        (Only for static units and units in peace)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Requirements column */}
            <div
              className="d-flex align-items-stretch justify-content-center"
              style={{
                minWidth: 100,
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
                borderRadius: "20px",
              }}
            >
              <div
                className="border-0 p-4 bg-light shadow-sm w-100 d-flex flex-column justify-content-center align-items-center"
                style={{ 
                  borderRadius: 15,
                  height: calculateTotalHeight()
                }}
              >
                <h6 className="fw-bold mb-3 text-primary text-center">
                  {isSpecialUnit == false
                    ? "Requirements for Citation & Appreciation"
                    : "Requirements for Appreciation"}
                </h6>

                <ul
                  className="mb-0"
                  style={{
                    fontSize: "15px",
                    color: "#333",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <li>• Fill all mandatory fields.</li>
                  <li>• Upload supporting/relevant documents.</li>
                  <li>• Provide unit remarks (max 500 chars).</li>
                  <li>• Ensure counts and marks are accurate.</li>
                  <li>• Check all details before submitting.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {userRole !== "unit" && (
          <div className="col-lg-3 col-sm-6 mb-4">
            <Link to="/applications/list" className="h-100 d-block">
              <div className="card border-0 h-100 d-flex align-items-center justify-content-center shadow-sm hover-shadow position-relative">
                {homeCounts?.applicationsToReview > 0 && (
                  <span className="count-badge bg-danger text-white position-absolute badge rounded-pill">
                    {homeCounts?.applicationsToReview}
                  </span>
                )}
                <div className="card-icon mb-2">
                  <img
                    src="/media/icons/applications.png"
                    alt="Applications"
                    width={80}
                  />
                </div>
                <h5 className="fw-6 mt-2 mb-0">
                  {userRole === "headquarter"
                    ? "Submitted by Commands"
                    : "Applications To Review"}
                </h5>
                <span className="text-muted small mt-1">
                  Review pending applications
                </span>
              </div>
            </Link>
          </div>
        )}

        {isHigherRole && (
          <>
            <div className="col-lg-3 col-sm-6 mb-4">
              <Link to="/clarifications/raised-list" className="h-100 d-block">
                <div className="card border-0 h-100 d-flex align-items-center justify-content-center shadow-sm hover-shadow position-relative">
                  {homeCounts?.clarificationsIRaised > 0 && (
                    <span className="count-badge bg-warning text-dark position-absolute  badge rounded-pill">
                      {homeCounts?.clarificationsIRaised}
                    </span>
                  )}
                  <div className="card-icon mb-2">
                    <img
                      src="/media/icons/clarifications.png"
                      alt="Clarification Raised"
                      width={80}
                    />
                  </div>
                  <h5 className="fw-6 mt-2 mb-0">Clarification Raised</h5>
                  <span className="text-muted small mt-1">
                    View clarifications you raised
                  </span>
                </div>
              </Link>
            </div>
            {userRole !== "command" && (
              <div className="col-lg-3 col-sm-6 mb-4">
                <Link to="/clarification" className="h-100 d-block">
                  <div className="card border-0 h-100 d-flex align-items-center justify-content-center shadow-sm hover-shadow position-relative">
                    {homeCounts?.clarificationsToResolve > 0 && (
                      <span className="count-badge bg-info text-white position-absolute badge rounded-pill">
                        {homeCounts?.clarificationsToResolve}
                      </span>
                    )}
                    <div className="card-icon mb-2">
                      <img
                        src="/media/icons/raised-clarification.png"
                        alt="Clarification Received"
                        width={80}
                      />
                    </div>
                    <h5 className="fw-6 mt-2 mb-0">Clarification Received</h5>
                    <span className="text-muted small mt-1">
                      Resolve received clarifications
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Disclaimer Modal */}
      <DisclaimerModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleModalConfirm}
        message={DisclaimerText["unit"]}
      />
    </div>
  );
};

export default Applications;