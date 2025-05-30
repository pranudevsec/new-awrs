import React, { useEffect, useState } from "react";
import { SVGICON } from "../../../constants/iconsList";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import UnitClarificationModal from "../../../modals/UnitClarificationModal";
import ReqClarificationModal from "../../../modals/ReqClarificationModal";
import {  useParams, useSearchParams } from "react-router-dom";
import { IoMdCheckmark } from "react-icons/io";
import { MdClose } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { fetchApplicationUnitDetail } from "../../../reduxToolkit/services/application/applicationService";
import { updateClarification } from "../../../reduxToolkit/services/clarification/clarificationService";

const ApplicationDetails = () => {
    const [clarificationShow, setClarificationShow] = useState(false);
    const [clarificationType, setClarificationType] = React.useState<"citation" | "appreciation">("appreciation");
    const [clarificationApplicationId, setClarificationApplicationId] = React.useState<number>(0);
    const [clarificationParameterName, setClarificationParameterName] = React.useState<string>("");
    const [clarificationDocForView, setClarificationDocForView] = useState<string | null>(null);
const [clarificationClarificationForView, setClarificationClarificationForView] = useState<string | null>(null);
    const [reqClarificationShow, setReqClarificationShow] = useState(false);
    const [isRefreshData, setIsRefreshData] = useState(false);
    const [unitDetail, setUnitDetail] = useState<any>(null);
    const profile = useAppSelector((state) => state.admin.profile);
const isUnitRole = profile?.user?.user_role === "unit";
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const { application_id } = useParams(); 
    const award_type = searchParams.get("award_type") || "";
    const numericAppId = Number(application_id);
    useEffect(() => {
      if (award_type && numericAppId) {
        dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }))
          .unwrap()
          .then((res) => {
            setUnitDetail(res.data);
          })
          .catch((err) => {
            console.error("Fetch failed:", err);
          });
      }
    }, [award_type, numericAppId, dispatch,isRefreshData]);

    return (
        <>
            <div className="apply-citation-section">
                <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                    <Breadcrumb
                        title={`Application ID: #${unitDetail?.id}`}
                        paths={[
                            { label: "Home", href: "/applications" },
                            { label: "Application Listing", href: "/applications/list" },
                            { label: "Details", href: "/applications/list/1" },
                        ]}
                    />
                </div>
                <div className="table-filter-area mb-4">
  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
    <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
      <label className="form-label fw-semibold">Award Type</label>
      <p className="fw-5 mb-0">{unitDetail?.type || "--"}</p>
    </div>

    <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
      <label className="form-label fw-semibold">Cycle Period</label>
      <p className="fw-5 mb-0">{unitDetail?.fds?.cycle_period || "--"}</p>
    </div>

    <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
      <label className="form-label fw-semibold">Last Date</label>
      <p className="fw-5 mb-0">{unitDetail?.fds?.last_date || "--"}</p>
    </div>

    <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
      <label className="form-label fw-semibold">Command</label>
      <p className="fw-5 mb-0">{unitDetail?.fds?.command || "--"}</p>
    </div>

    <div className="text-center flex-grow-1 flex-sm-grow-0 flex-basis-100 flex-sm-basis-auto" style={{ minWidth: '150px' }}>
      <label className="form-label fw-semibold">Unit Name</label>
      <p className="fw-5 mb-0">{unitDetail?.unit_name || "--"}</p>
    </div>
  </div>
</div>


                <div className="table-responsive">
    <table className="table-style-1 w-100">
        <thead>
            <tr>
                <th style={{ width: 150 }}>Parameter</th>
                <th style={{ width: 100 }}>Count</th>
                <th style={{ width: 100 }}>Marks</th>
                <th style={{ width: 100 }}>Document</th>
                {/* <th style={{ width: 200 }}>Approved Marks</th> */}
                {!isUnitRole && (
            <>
                <th style={{ width: 150 }}>Add Clarification</th>
                <th style={{ width: 200 }}>Requested Clarification</th>
                <th style={{ width: 150 }}>Action</th>
            </>
        )}
            </tr>
        </thead>
        <tbody>
            {unitDetail?.fds?.parameters?.map((param:any, index:any) => (
                <tr key={index}>
                    <td style={{ width: 150 }}>
                        <p className="fw-5">{param.name}</p>
                    </td>
                    <td style={{ width: 100 }}>
                        <p className="fw-5">{param.count}</p>
                    </td>
                    <td style={{ width: 100 }}>
                        <p className="fw-5">{param.marks}</p>
                    </td>
                    <td style={{ width: 100 }}>
                        <a href={param.upload} target="_blank" rel="noopener noreferrer" style={{ fontSize: 18 }}>
                            {SVGICON.app.pdf}
                        </a>
                    </td>
                    {/* <td style={{ width: 200 }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter approved marks"
                            autoComplete="off"
                            value={param.marks}
                            readOnly
                        />
                    </td> */}
                  {!isUnitRole && (
                <>
                  <td style={{ width: 120 }}>
  {param?.clarification_id ? (
    <p className="fw-5">Already Asked</p>
  ) : (
    <button
      onClick={() => {
        setClarificationType(unitDetail?.type);  // or get dynamically from your data
        setClarificationApplicationId(unitDetail?.id);  // or appropriate id
        setClarificationParameterName(param.name);
        setClarificationDocForView(param?.clarification_details?.clarification_doc);
        setClarificationClarificationForView(param?.clarification_details?.clarification);
        setClarificationShow(true);
      }}
      className="fw-5 text-decoration-underline bg-transparent border-0 "
      style={{ fontSize: 14 ,color:"#0d6efd"}}
    >
      Ask Clarification
    </button>
  )}
</td>

<td style={{ width: 200 }}>
  {param?.clarification_details?.clarification ? (
    <button
      className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
      onClick={() => {
        setReqClarificationShow(true)
        setClarificationDocForView(param?.clarification_details?.clarification_doc);
        setClarificationClarificationForView(param?.clarification_details?.clarification);
      }}
    >
      {SVGICON.app.eye}
    </button>
  ) : (
    "--"
  )}
</td>

<td style={{ width: 150 }}>
  {param?.clarification_details?.clarification &&
   param?.clarification_details?.clarification_status === "pending" &&
   param?.clarification_details?.clarification_id ? (
    <div className="d-flex gap-3">
    {/* APPROVE */}
    <button
      className="action-btn bg-transparent d-flex align-items-center justify-content-center"
      style={{ color: "var(--green-default)" }}
      onClick={() => {
        dispatch(updateClarification({
          id: param?.clarification_details?.clarification_id,
          clarification_status: "clarified",
        })).then(() => {
          setIsRefreshData(prev => !prev); // toggle to refresh data
        });
      }}
    >
      <IoMdCheckmark />
    </button>

    {/* REJECT */}
    <button
      className="action-btn bg-transparent d-flex align-items-center justify-content-center"
      style={{ color: "var(--red-default)" }}
      onClick={() => {
        dispatch(updateClarification({
          id: param?.clarification_details?.clarification_id,
          clarification_status: "rejected",
        })).then(() => {
          setIsRefreshData(prev => !prev); // toggle to refresh data
        });
      }}
    >
      <MdClose />
    </button>
  </div>
  ) : (
    "--"
  )}
</td>

                </>
            )}
                </tr>
            ))}
        </tbody>
    </table>
</div>

            </div>
       <UnitClarificationModal
  show={clarificationShow}
  handleClose={() => setClarificationShow(false)}
  type={clarificationType}
  application_id={clarificationApplicationId}
  parameter_name={clarificationParameterName}
  setIsRefreshData={setIsRefreshData}
  isRefreshData={isRefreshData}
/>
      <ReqClarificationModal
         show={reqClarificationShow}
         handleClose={() => setReqClarificationShow(false)}
  clarification_doc={clarificationDocForView}
  clarification={clarificationClarificationForView}
/>
        </>
    );
};

export default ApplicationDetails;