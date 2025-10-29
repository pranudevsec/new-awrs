import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import EmptyTable from "../../components/ui/empty-table/EmptyTable";
import Loader from "../../components/ui/loader/Loader";
import Pagination from "../../components/ui/pagination/Pagination";
import { awardTypeOptions } from "../../data/options";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { fetchApplicationHistory, updateApplication, } from "../../reduxToolkit/services/application/applicationService";
import { formatCompactDateTime, getDateStatus } from "../../utils/dateUtils";
// Removed XLSX import - using PDF instead

const getStatusColor = (status: string) => {
  if (["pending", "in_review", "shortlisted_approved"].includes(status)) return "orange";
  if (status === "approved") return "green";
  return "red";
};

const getStatusLabel = (status: string) => {
  if (["pending", "in_review", "shortlisted_approved"].includes(status)) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const History = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading, meta } = useAppSelector((state) => state.application);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";

  // States
  const [awardType, setAwardType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => { clearTimeout(handler) };
  }, [searchTerm]);

  useEffect(() => {
    if (!profile?.user?.user_role) return;

    const fetchData = async () => {
      const params = {
        ...(awardType && awardType !== "All" ? { award_type: awardType } : {}),
        search: debouncedSearch,
        page,
        limit,
      };

      try {
        await dispatch(fetchApplicationHistory(params)).unwrap();
      } catch (error: any) {
        const rawErrors = error?.errors ?? "";
        const errorMessage = error?.message ?? rawErrors ?? "An error occurred.";
        const needsProfile =
          rawErrors === "Please complete your unit profile before proceeding." ||
          (typeof rawErrors === "string" && rawErrors.includes("Cannot read properties of null"));

        if (needsProfile) {
          navigate("/profile-settings");
          toast.error("Please complete your unit profile before proceeding.");
        } else {
          toast.error(errorMessage);
        }
      }
    };

    fetchData();
  }, [awardType, debouncedSearch, profile, page, limit]);

  // Excel function removed - using PDF instead
//   from units i want to generate a excel units data are like 
//   [
//         {
//             "id": 1,
//             "type": "citation",
//             "unit_id": 9,
//             "date_init": "2025-08-07T18:30:00.000Z",
//             "fds": {
//                 "corps": "corps1",
//                 "awards": [],
//                 "brigade": "brigade1",
//                 "command": "Northern Command",
//                 "division": "divison1",
//                 "last_date": "2025-12-30",
//                 "unit_type": "ENGRS",
//                 "award_type": "citation",
//                 "parameters": [
//                     {
//                         "id": "121",
//                         "info": "1 no = 10 marks (Max 10 marks)",
//                         "name": "no",
//                         "count": 1,
//                         "marks": 10,
//                         "upload": [
//                             "/uploads/DELL PC NO.2(Mac-10-98-19-20-F4-B3).pdf"
//                         ],
//                         "category": "Area of Ops -Deg of Difficulty",
//                         "negative": false,
//                         "subcategory": "OP MEGHDOOT /8 Mtn Div",
//                         "approved_count": 1,
//                         "subsubcategory": null,
//                         "last_clarification_handled_by": "brigade",
//                         "last_clarification_status": "clarified",
//                         "last_clarification_id": 1
//                     }
//                 ],
//                 "unitRemarks": "Unit citation submitted///",
//                 "cycle_period": "2024 - H1",
//                 "accepted_members": [
//                     {
//                         "name": "AB Jha",
//                         "ic_number": "12334",
//                         "member_type": "presiding_officer",
//                         "member_id": "6f260f85-f1ff-48df-b7d1-10fe205aa6ab",
//                         "is_signature_added": true,
//                         "sign_digest": "something while developing"
//                     },
//                     {
//                         "name": "Rahul",
//                         "ic_number": "53543647",
//                         "member_type": "member_officer",
//                         "member_id": "ba69d13f-179a-49b7-8dca-3a941376e2ff",
//                         "is_signature_added": true,
//                         "sign_digest": "something while developing"
//                     },
//                     {
//                         "name": "A D Kumar",
//                         "ic_number": "132432",
//                         "member_type": "presiding_officer",
//                         "member_id": "1eb53ea2-473d-42dc-9a6d-4b3c5d5bfb22",
//                         "is_signature_added": true,
//                         "sign_digest": "something while developing"
//                     },
//                     {
//                         "name": "AK Gupta",
//                         "ic_number": "13333",
//                         "member_type": "member_officer",
//                         "member_id": "89d412f6-ca09-43c1-9892-acc678680c0b",
//                         "is_signature_added": true,
//                         "sign_digest": "something while developing"
//                     },
//                     {
//                         "name": "AK Tiwary",
//                         "ic_number": "123334",
//                         "member_type": "presiding_officer",
//                         "member_id": "656cd465-d5b9-4261-9eb4-ed11a4d25d81",
//                         "is_signature_added": true,
//                         "sign_digest": "something while developing"
//                     }
//                 ],
//                 "applicationGraceMarks": [
//                     {
//                         "role": "brigade",
//                         "marksBy": 31,
//                         "marksAddedAt": "2025-08-08T06:06:15.838Z",
//                         "marks": 1
//                     },
//                     {
//                         "role": "division",
//                         "marksBy": 39,
//                         "marksAddedAt": "2025-08-08T06:16:00.674Z",
//                         "marks": 2
//                     },
//                     {
//                         "role": "corps",
//                         "marksBy": 45,
//                         "marksAddedAt": "2025-08-08T06:16:51.817Z",
//                         "marks": 1
//                     }
//                 ],
//                 "applicationPriority": [
//                     {
//                         "role": "brigade",
//                         "priority": 2,
//                         "priorityAddedAt": "2025-08-08T06:06:35.002Z"
//                     },
//                     {
//                         "role": "division",
//                         "priority": 3,
//                         "priorityAddedAt": "2025-08-08T06:16:01.828Z"
//                     },
//                     {
//                         "role": "corps",
//                         "priority": 2,
//                         "priorityAddedAt": "2025-08-08T06:16:50.792Z"
//                     }
//                 ]
//             },
//             "status_flag": "withdrawed",
//             "is_withdraw_requested": true,
//             "withdraw_requested_by": "brigade",
//             "withdraw_requested_at": "2025-08-08T06:17:47.694Z",
//             "withdraw_status": "approved",
//             "withdraw_requested_by_user_id": 31,
//             "withdraw_approved_by_role": "command",
//             "withdraw_approved_by_user_id": 49,
//             "withdraw_approved_at": "2025-08-08T06:30:51.264Z"
//         },
// using this data 

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="History"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "History", href: "/history" },
          ]}
        />
              {/* <button className="_btn primary mb-3 d-flex align-items-center gap-2" onClick={handleExportPDF}>
 
                  <span>Download PDF Report</span>
                </button> */}
      </div>

      <div className="filter-wrapper d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="search-wrapper position-relative">
          <button className="border-0 bg-transparent position-absolute translate-middle-y top-50">
            {SVGICON.app.search}
          </button>
          <input
            type="text"
            placeholder="Search by Application Id"
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="d-flex gap-2">
          <FormSelect
            name="awardType"
            options={awardTypeOptions}
            value={awardTypeOptions.find((opt) => opt.value === awardType) ?? null}
            placeholder="Select Type"
            onChange={(option: OptionType | null) =>
              setAwardType(option ? option.value : null)
            }
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead style={{ backgroundColor: "#007bff" }}>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Application Id
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Unit ID
              </th>
              {role === "headquarter" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                  Command
                </th>
              )}
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Submission Date
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Dead Line
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Type</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Status
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Approved By Stage
              </th>
              {role !== 'cw2' && <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Action
              </th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="d-flex justify-content-center py-5">
                    <Loader inline size={40} />
                  </div>
                </td>
              </tr>
            ) : (
              units.length > 0 &&
              units.map((unit: any) => {
                const submissionDate = formatCompactDateTime(unit.date_init);
                const deadlineStatus = getDateStatus(unit.fds?.last_date, true);
                const typeLabel = unit?.type
                  ? unit.type.charAt(0).toUpperCase() + unit.type.slice(1)
                  : "-";
                let statusLabel = unit?.status_flag
                  ? getStatusLabel(unit.status_flag)
                  : "-";
                let statusColor = getStatusColor(unit?.status_flag);

                // Reflect withdraw workflow in Status column
                if (unit?.is_withdraw_requested) {
                  if (["pending", "in_review", "shortlisted_approved"].includes(unit.withdraw_status)) {
                    statusLabel = "Withdraw Pending";
                    statusColor = "orange";
                  } else if (unit.withdraw_status === "approved") {
                    statusLabel = "Withdrawn";
                    statusColor = "red";
                  }
                }

                let roleDisplay = "-";
                if (unit?.status_flag === "rejected") {
                  if (unit?.last_rejected_by_role) {
                    roleDisplay =
                      unit.last_rejected_by_role.charAt(0).toUpperCase() +
                      unit.last_rejected_by_role.slice(1);
                  }
                } else if (unit?.last_approved_by_role) {
                  roleDisplay =
                    unit.last_approved_by_role.charAt(0).toUpperCase() +
                    unit.last_approved_by_role.slice(1);
                }

                let withdrawAction = null;
                if (unit?.status_flag !== "rejected") {
                  withdrawAction = (
                    <button
                      type="button"
                      className="_btn success text-nowrap w-sm-auto"
                      onClick={() => {
                        dispatch(
                          updateApplication({
                            id: unit?.id,
                            type: unit?.type,
                            withdrawRequested: true,
                          })
                        ).then(() => {
                          const params = {
                            award_type: awardType ?? "",
                            search: debouncedSearch,
                            page,
                            limit,
                          };
                          dispatch(fetchApplicationHistory(params));
                        });
                      }}
                    >
                      Withdraw
                    </button>
                  );
                } else {
                  withdrawAction = (
                    <p className="fw-4" style={{ color: "red" }}>
                      Rejected
                    </p>
                  );
                }

                return (
                  <tr key={unit.id} style={{ height: 75 }} className="cursor-auto">
                    <td><p className="fw-4">#{unit.id}</p></td>
                    <td><p className="fw-4">#{unit.unit_id}</p></td>
                    {role === "headquarter" && (
                      <td><p className="fw-4">{unit?.fds?.command}</p></td>
                    )}
                    <td><p className="fw-4">{submissionDate}</p></td>
                    <td>
                      <p className="fw-4">
                        <span className={deadlineStatus.className}>
                          {deadlineStatus.text}
                        </span>
                      </p>
                    </td>
                    <td><p className="fw-4">{typeLabel}</p></td>
                    <td>
                      <p className="fw-4" style={{ color: statusColor }}>
                        {statusLabel}
                      </p>
                    </td>
                    <td><p className="fw-4">{roleDisplay}</p></td>
                    {role !== "cw2" && (
                     <td>
  {(() => {
    return unit?.is_withdraw_requested ? (
      <>
        {unit.withdraw_status === "approved" && (
          <span className="badge bg-success text-nowrap">Withdraw Approved</span>
        )}
        {unit.withdraw_status === "rejected" && (
          <span className="badge bg-danger text-nowrap">Withdraw Rejected</span>
        )}
        {["pending", "in_review", "shortlisted_approved"].includes(unit.withdraw_status) && (
          <span className="badge bg-warning text-white text-nowrap">Withdraw Pending</span>
        )}
      </>
    ) : (
      withdrawAction
    );
  })()}
</td>

                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Empty Data */}
      {!loading && units.length === 0 && <EmptyTable />}

      {/* Pagination */}
      {units.length > 0 && (
        <Pagination
          meta={meta}
          page={page}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
        />
      )}
    </div>
  );
};

export default History;
