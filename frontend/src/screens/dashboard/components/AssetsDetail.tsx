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

// export default AssetsDetail
import type { DashboardStats } from "../../../reduxToolkit/services/command-panel/commandPanelInterface";
import { useNavigate } from "react-router-dom";

interface ProductDetailProps {
  dashboardStats: DashboardStats | null;
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
      bgColor: "#b4b4e2ff",
      textColor: "#495057",
      borderColor: "#dee2e6",
      route: "/all-applications", // unitType === "cw2" ? "/applications/all-applications" : 
    },
    {
      title: "Pending Applications",
      value: dashboardStats?.totalPendingApplications ?? 0,
      bgColor: "#f5e1a2ff",
      textColor: "#856404",
      borderColor: "#ffeaa7",
      route:  unitType === "cw2" ? "/applications/pending" : "/applications/list",
    },
    {
      title: "Rejected Applications",
      value: dashboardStats?.rejected ?? 0,
      bgColor: "#f8aeb4ff",
      textColor: "#721c24",
      borderColor: "#f5c6cb",
      route: "/applications/rejected",
    },
    {
      title:  "Recommended Applications",
      value: dashboardStats?.acceptedApplications ?? 0,
      bgColor: "#9bf0ffff",
      textColor: "#0c5460",
      borderColor: "#bee5eb",
      route: unitType === "cw2" ? "/applications/approved" : "/application/accepted",
    },
  ];

  // Add "Finalized Applications" only if unitType is "cw2"
  const cards = unitType === "cw2" 
    ? [
        ...baseCards,
        {
          title: "Finalized Applications",
          value: dashboardStats?.approved ?? 0,
          bgColor: "#a6fdbaff",
          textColor: "#155724",
          borderColor: "#c3e6cb",
          route: "/applications/finalized",
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
                    fontSize: "14px",
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
