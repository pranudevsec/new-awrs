// import type { DashboardStats } from "../../../reduxToolkit/services/command-panel/commandPanelInterface";

// interface ProductDetailProps {
//     dashboardStats: DashboardStats | null;
// }

// const AssetsDetail: React.FC<ProductDetailProps> = ({ dashboardStats }) => {
//     return (
//         <div className="assets-details-cards mb-4">
//             <div className="row">
//                 <div className="col-xl-3 col-sm-6 mb-xl-0 mb-sm-4 mb-3">
//                     <div className="card bg-pending d-flex flex-row align-items-center justify-content-between h-100">
//                         <div className="left-content d-flex flex-wrap flex-xxl-row flex-xl-column flex-md-row flex-sm-column align-items-center gap-2">
//                             <div className="text ">
//                                 <h6 className="fw-4 mb-2">Pending Applications</h6>
//                                 <h4 className="fw-6 font-lexend color-pending">{dashboardStats?.totalPendingApplications ?? 0}</h4>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//                 <div className="col-xl-3 col-sm-6 mb-xl-0 mb-sm-4 mb-3">
//                     <div className="card bg-request d-flex flex-row align-items-center justify-content-between h-100">
//                         <div className="left-content d-flex flex-wrap flex-xxl-row flex-xl-column flex-md-row flex-sm-column align-items-center gap-2">
//                             <div className="text">
//                                 <h6 className="fw-4 mb-2">Recommended Applications</h6>
//                                 <h4 className="fw-6 font-lexend color-request">{dashboardStats?.acceptedApplications ?? 0}</h4>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//                 <div className="col-xl-3 col-sm-6 mb-sm-0 mb-3">
//                     <div className="card bg-raised d-flex flex-row align-items-center justify-content-between h-100">
//                         <div className="left-content d-flex flex-wrap flex-xxl-row flex-xl-column flex-md-row flex-sm-column align-items-center gap-2">
//                             <div className="text">
//                                 <h6 className="fw-4 mb-2">Approved</h6>
//                                 <h4 className="fw-6 font-lexend color-raised">{dashboardStats?.approved ?? 0}</h4>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//                 <div className="col-xl-3 col-sm-6">
//                     <div className="card bg-rejected d-flex flex-row align-items-center justify-content-between h-100">
//                         <div className="left-content d-flex flex-wrap flex-xxl-row flex-xl-column flex-md-row flex-sm-column align-items-center gap-2">
//                             <div className="text">
//                                 <h6 className="fw-4 mb-2">Rejected</h6>
//                                 <h4 className="fw-6 font-lexend color-rejected">{dashboardStats?.rejected ?? 0}</h4>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>

//     )
// }
import type { DashboardStats } from "../../../reduxToolkit/services/command-panel/commandPanelInterface";
import { useNavigate } from "react-router-dom";

interface ProductDetailProps {
  dashboardStats: DashboardStats | null | any;
  unitType?: string;
}

const AssetsDetail: React.FC<ProductDetailProps> = ({
  dashboardStats,
  unitType = "unit",
}) => {
  const navigate = useNavigate();

  // Create base cards array
  const baseCards = [
    {
      title: "Total Applications",
      value: dashboardStats?.clarificationRaised ?? 0,
      bgColor: "#d34431ff",
      textColor: "#01060eff",
      borderColor: "#f2f3f5ff",
      route: "/all-applications",
    },
    {
      title: "Pending Applications",
      value: dashboardStats?.totalPendingApplications ?? 0,
      bgColor: "#23aed1ff",
      textColor: "#1b1502ff",
      borderColor: "#ffeaa7",
      route: unitType === "cw2" ? "/applications/pending" : "/applications/list",
    },
    {
      title: "Rejected Applications",
      value: dashboardStats?.rejected ?? 0,
      bgColor: "#ee0000ff",
      textColor: "#110203ff",
      borderColor: "#f5c6cb",
      route: "/applications/rejected",
    },
    // Recommended Applications will be conditionally added later
  ];

  // Add "Recommended Applications" only if NOT cw2
  if (unitType !== "cw2") {
    baseCards.push({
      title: "Recommended Applications",
      value: dashboardStats?.acceptedApplications ?? 0,
      bgColor: "#b6c4c7ff",
      textColor: "#0c5460",
      borderColor: "#bee5eb",
      route: "/application/accepted",
    });
  }

  // Add extra cards for cw2
  const cards =
    unitType === "cw2"
      ? [
          ...baseCards,
          {
            title: "Shortlisted Applications",
            value: dashboardStats?.shortlistedApplications ?? 0,
            bgColor: "#0a6e21ff",
            textColor: "#000501ff",
            borderColor: "#c3e6cb",
            route: "/applications/finalized",
          },
          {
            title: "Finalized Approved Applications",
            value: dashboardStats?.finalizedApproved ?? 0,
            bgColor: "#ddcf11ff",
            textColor: "#000501ff",
            borderColor: "#c3e6cb",
            route: "/applications/finalized-approved",
          },
        ]
      : baseCards;

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="assets-details-cards mb-4">
      <div className="row g-3" style={{ display: "flex", flexWrap: "wrap" }}>
        {cards.map((card, idx) => (
          <div
            className="col"
            key={idx}
            style={{
              flex: "1 1 0",
              minWidth: "200px",
              marginBottom: "12px",
            }}
          >
            <div
              className="stats-card"
              style={{
                background: card.bgColor,
                border: `1px solid ${card.borderColor}`,
                borderRadius: "8px",
                padding: "20px",
                height: "120px",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onClick={() => handleCardClick(card.route)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="d-flex flex-column h-100 justify-content-between">
                <h6
                  style={{
                    fontSize: "20px",
                    fontWeight: "500",
                    color: card.textColor,
                    margin: "0",
                    opacity: "0.8",
                  }}
                >
                  {card.title}
                </h6>

                <h3
                  style={{
                    fontSize: "28px",
                    fontWeight: "600",
                    color: card.textColor,
                    margin: "0",
                    fontFamily: "var(--font-lexend-deca), sans-serif",
                  }}
                >
                  {card.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetsDetail;
