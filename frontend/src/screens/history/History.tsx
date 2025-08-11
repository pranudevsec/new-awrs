import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import EmptyTable from "../../components/ui/empty-table/EmptyTable";
import Loader from "../../components/ui/loader/Loader";
import Pagination from "../../components/ui/pagination/Pagination";
import { awardTypeOptions, matrixUnitOptions } from "../../data/options";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { fetchApplicationHistory, updateApplication, } from "../../reduxToolkit/services/application/applicationService";
import * as XLSX from "xlsx";

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

    const fetchData = () => {
      const params = {
        ...(awardType && awardType !== "All" ? { award_type: awardType } : {}),
        search: debouncedSearch,
        page,
        limit,
      };

      try {
        dispatch(fetchApplicationHistory(params)).unwrap();
      } catch (error: any) {
        const errorMessage = error?.errors ?? error?.message ?? "An error occurred.";

        if (error?.errors === "Please complete your unit profile before proceeding.") {
          navigate("/profile-settings");
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    };

    fetchData();
  }, [awardType, debouncedSearch, profile, page, limit]);

  const handleExportExcel = () => {
    const allParameterKeys: string[] = [];
    const paramNameMap: Record<string, string> = {};
    const matricUnits = [
      "CI/CT", "LC", "AIOS", "LAC", "HAA", "AGPL", "Internal Security (IS)"
    ];
    
    const nonMatricUnits = [
      "Non Metrics (NM)", "Peace/Mod Fd"
    ];
    const allGraceRoles: string[] = [];
  
    const allPriorityRoles: string[] = [];
  
    units.forEach((unit: any) => {
      const params = unit.fds?.parameters ?? [];
      params.forEach((p: any) => {
        const key = `${p.name} (${p.id})`;
        if (!allParameterKeys.includes(key)) {
          allParameterKeys.push(key);
          paramNameMap[key] = p.name;
        }
      });
  
      (unit.fds?.applicationGraceMarks ?? []).forEach((g: any) => {
        if (!allGraceRoles.includes(g.role)) {
          allGraceRoles.push(g.role);
        }
      });
  
      (unit.fds?.applicationPriority ?? []).forEach((pr: any) => {
        if (!allPriorityRoles.includes(pr.role)) {
          allPriorityRoles.push(pr.role);
        }
      });
    });
  
    const appDetailCols = 8;
    const paramCols = allParameterKeys.length;
    const graceCols = allGraceRoles.length;
    const priorityCols = allPriorityRoles.length;
    const safeArray = (n: number) => (n > 0 ? Array(n).fill("") : []);

    const headerRow1 = [
      "Application Details",
      ...safeArray(appDetailCols - 1),
      "Matric Units",
      ...safeArray(matricUnits.length - 1),
      "Non-Matric Units",
      ...safeArray(nonMatricUnits.length - 1),
      "Parameters",
      ...safeArray(paramCols - 1),
      "Discretionary Points",
      ...safeArray(graceCols - 1),
      "Priority",
      ...safeArray(priorityCols - 1),
      "Total Marks"
    ];
    const headerRow2 = [
      "S. No",
      "Award Type",
      "Unit Name",
      "Location",
      "Brigade",
      "Division",
      "Corps",
      "Command",
      ...matricUnits,
      ...nonMatricUnits,
      ...allParameterKeys.map((key) => paramNameMap[key]),
      ...allGraceRoles.map((role) => role),
      ...allPriorityRoles.map((role) => role),
      ""
    ];
    
  
    const rows = units.map((unit: any, index: number) => {
      const paramMap: Record<string, number | string> = {};
      const graceMap: Record<string, number | string> = {};
      const priorityMap: Record<string, number | string> = {};
      let totalMarks = 0;
    
      const matricCounts: Record<string, number> = {};
      const nonMatricCounts: Record<string, number> = {};
      
      matricUnits.forEach((label) => (matricCounts[label] = 0));
      nonMatricUnits.forEach((label) => (nonMatricCounts[label] = 0));
    
      (unit.fds?.parameters ?? []).forEach((p: any) => {
        const key = `${p.name} (${p.id})`;
        const marksVal = p.approved_marks ?? p.marks ?? 0;
        const numVal = Number(marksVal) || 0;
        if (p.negative) {
          totalMarks -= numVal;
          paramMap[key] = `-${numVal}`;
        } else {
          totalMarks += numVal;
          paramMap[key] = numVal;
        }
    
        const armsServiceValue = p.arms_service ?? "";
    
        const matchedMatric = matrixUnitOptions.find(
          (opt) => opt.value === armsServiceValue && matricUnits.includes(opt.label)
        );
        if (matchedMatric) {
          matricCounts[matchedMatric.label] += 1;
        } else {
          const matchedNonMatric = matrixUnitOptions.find(
            (opt) => opt.value === armsServiceValue && nonMatricUnits.includes(opt.label)
          );
          if (matchedNonMatric) {
            nonMatricCounts[matchedNonMatric.label] += 1;
          }
        }
      });
    
      (unit.fds?.applicationGraceMarks ?? []).forEach((g: any) => {
        graceMap[g.role] = g.marks ?? "-";
      });
    
      const roleOrder = ["brigade", "division", "corps", "command"];
      for (let i = roleOrder.length - 1; i >= 0; i--) {
        const role = roleOrder[i];
        if (graceMap[role] !== undefined && graceMap[role] !== "-") {
          totalMarks += Number(graceMap[role]) || 0;
          break;
        }
      }
    
      (unit.fds?.applicationPriority ?? []).forEach((pr: any) => {
        priorityMap[pr.role] = pr.priority ?? "-";
      });
    
      const matricValues = matricUnits.map((label) => matricCounts[label] || "-");
      const nonMatricValues = nonMatricUnits.map((label) => nonMatricCounts[label] || "-");
    
      return [
        index + 1,
        unit.type ?? "-",
        unit.unit_details?.name ?? "-",
        unit.unit_details?.location ?? "-",
        unit.unit_details?.bde ?? "-",
        unit.unit_details?.div ?? "-",
        unit.unit_details?.corps ?? "-",
        unit.unit_details?.comd ?? "-",
        ...matricValues,
        ...nonMatricValues,
        ...allParameterKeys.map((key) => paramMap[key] ?? "-"),
        ...allGraceRoles.map((role) => graceMap[role] ?? "-"),
        ...allPriorityRoles.map((role) => priorityMap[role] ?? "-"),
        totalMarks,
      ];
    });
    
  
    const worksheetData = [headerRow1, headerRow2, ...rows];
  
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: appDetailCols - 1 } },
      { s: { r: 0, c: appDetailCols }, e: { r: 0, c: appDetailCols + matricUnits.length - 1 } }, // Matric Units
      { s: { r: 0, c: appDetailCols + matricUnits.length }, e: { r: 0, c: appDetailCols + matricUnits.length + nonMatricUnits.length - 1 } }, // Non-Matric Units
      { s: { r: 0, c: appDetailCols + matricUnits.length + nonMatricUnits.length }, e: { r: 0, c: appDetailCols + matricUnits.length + nonMatricUnits.length + paramCols - 1 } }, // Parameters
      { s: { r: 0, c: appDetailCols + matricUnits.length + nonMatricUnits.length + paramCols }, e: { r: 0, c: appDetailCols + matricUnits.length + nonMatricUnits.length + paramCols + graceCols - 1 } }, // Discretionary Points
      { s: { r: 0, c: appDetailCols + matricUnits.length + nonMatricUnits.length + paramCols + graceCols }, e: { r: 0, c: appDetailCols + matricUnits.length + nonMatricUnits.length + paramCols + graceCols + priorityCols - 1 } }, // Priority
    
      {
        s: { r: 0, c: appDetailCols + matricUnits.length + nonMatricUnits.length + paramCols + graceCols + priorityCols },
        e: { r: 1, c: appDetailCols + matricUnits.length + nonMatricUnits.length + paramCols + graceCols + priorityCols }
      }
    ];
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Units Report");
    XLSX.writeFile(workbook, "applications.xlsx");
  };
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
              <button className="_btn primary mb-3 d-flex align-items-center gap-2" onClick={handleExportExcel}>
                  {/* <FaDownload /> */}
                  <span>Generate Report</span>
                </button>
      </div>

      <div className="filter-wrapper d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="search-wrapper position-relative">
          <button className="border-0 bg-transparent position-absolute translate-middle-y top-50">
            {SVGICON.app.search}
          </button>
          <input
            type="text"
            placeholder="search..."
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
          <thead>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Application Id
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Unit ID
              </th>
              {role === "headquarter" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  Command
                </th>
              )}
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Submission Date
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Dead Line
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Type</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Status
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Approved By Stage
              </th>
              {role !== 'cw2' && <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
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
                const submissionDate = new Date(unit.date_init).toLocaleDateString();
                const deadline = unit.fds?.last_date
                  ? new Date(unit.fds.last_date).toLocaleDateString()
                  : "-";
                const typeLabel = unit?.type
                  ? unit.type.charAt(0).toUpperCase() + unit.type.slice(1)
                  : "-";
                const statusLabel = unit?.status_flag
                  ? getStatusLabel(unit.status_flag)
                  : "-";
                const statusColor = getStatusColor(unit?.status_flag);

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
                    <td><p className="fw-4">{deadline}</p></td>
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
