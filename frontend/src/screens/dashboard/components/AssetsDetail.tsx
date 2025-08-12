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

interface ProductDetailProps {
    dashboardStats: DashboardStats | null;
}

const AssetsDetail: React.FC<ProductDetailProps> = ({ dashboardStats }) => {
    return (
        <div className="assets-details-cards mb-4">
        <div className="row g-3 five-col-row">
          {[
            { title: "Total Application Received", value: 8, className: "bg-total total-application" },
            { title: "Pending Applications", value: dashboardStats?.totalPendingApplications ?? 0, className: "bg-pending color-pending" },
            { title: "Rejected Applications", value: dashboardStats?.rejected ?? 0, className: "bg-rejected color-rejected" },
            { title: "Recommended Applications", value: dashboardStats?.acceptedApplications ?? 0, className: "bg-request color-request" },
            { title: "Finalized Applications", value: 4, className: "bg-finalized finalized-application" },
          ].map((card, idx) => (
            <div className="col custom-col" key={idx}>
              <div className={`card ${card.className} d-flex flex-row align-items-center justify-content-between h-100`}>
                <div className="left-content d-flex flex-column align-items-start gap-2">
                  <div className="text">
                    <h6 className="fw-4 mb-2">{card.title}</h6>
                    <h4 className="fw-6 font-lexend">{card.value}</h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    )
}

export default AssetsDetail;
