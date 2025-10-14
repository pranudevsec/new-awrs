import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Pagination from "../../../components/ui/pagination/Pagination";
import ReqSignatureApproveModal from "../../../modals/ReqSignatureApproveModal";
import { awardTypeOptions } from "../../../data/options";
import { SVGICON } from "../../../constants/iconsList";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaDownload } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import {
  approveApplications,
  approveMarks,
  fetchApplicationsForHQ,
  fetchApplicationUnits,
  fetchSubordinates,
  updateApplication
} from "../../../reduxToolkit/services/application/applicationService";
import { useDebounce } from "../../../hooks/useDebounce";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

const hierarchy = ["unit", "brigade", "division", "corps", "command"];
const allRoles = ["brigade", "division", "corps", "command"];

const AcceptedApplicationsList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading, meta } = useAppSelector((state) => state.application);
  const cit_count = units.filter((unit) => unit.fds.award_type === "citation").length;
  const appr_count = units.filter((unit) => unit.fds.award_type === "appreciation").length;
  const role = profile?.user?.user_role?.toLowerCase() ?? "";


  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [awardType, setAwardType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [priorityValues, setPriorityValues] = useState<{ [key: string]: { [type: string]: string } }>({});
  const [graceMarksValues, setGraceMarksValues] = useState<{ [key: string]: { [type: string]: string } }>({});

  const lowerRole = hierarchy[hierarchy.indexOf(role) - 1] ?? null;
  const currentRole = profile?.user?.user_role?.toLowerCase() ?? "";
  const allowedRoles = allRoles.slice(0, allRoles.indexOf(currentRole));

  const getLowerRolePriority = (unit: any) => {
    if (!lowerRole || !unit?.fds?.applicationPriority) return "-";
    const priorityEntry = unit?.fds.applicationPriority.find(
      (p: any) => p.role?.toLowerCase() === lowerRole
    );
    return priorityEntry?.priority ?? "-";
  };

  useEffect(() => {
    const initialValues: { [key: string]: { [type: string]: string } } = {};

    units.forEach((unit: any) => {
      const found = unit?.fds?.applicationPriority?.find(
        (p: any) => p.role?.toLowerCase() === role
      );

      const unitId = String(unit.id);
      const unitType = unit.type;

      if (!initialValues[unitId]) {
        initialValues[unitId] = {};
      }

      initialValues[unitId][unitType] = found?.priority?.toString() ?? "";
    });

    setPriorityValues(initialValues);
  }, [units, role]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => { clearTimeout(handler) };
  }, [searchTerm]);

  const fetchData = () => {
    const params = {
      ...(awardType && awardType !== "All" ? { award_type: awardType } : {}),
      search: debouncedSearch,
      page,
      limit,
      isShortlisted: true,
    };
    if (!profile?.user?.user_role) return;
    const role = profile.user.user_role;

    if (role === "cw2" || role === "headquarter") {
      dispatch(fetchApplicationsForHQ(params));
    } else if (role !== "unit") {
      dispatch(fetchSubordinates(params));
    } else {
      dispatch(fetchApplicationUnits(params));
    }
  };

  useEffect(() => {
    fetchData();
  }, [awardType, debouncedSearch, profile, page, limit]);

  const getTotalMarks = (unit: any): number => {
    const parameters = unit?.fds?.parameters ?? [];
    const graceMarks =
      unit?.fds?.applicationGraceMarks?.reduce(
        (acc: number, item: any) => acc + (item?.marks ?? 0),
        0
      ) ?? 0;
    
    let totalPositiveMarks = 0;
    let totalNegativeMarks = 0;
    
    parameters.forEach((param: any) => {
      const isRejected =
        param?.clarification_details?.clarification_status === "rejected";

      if (isRejected) return;


      const hasApprovedMarks = param?.approved_marks !== undefined &&
        param?.approved_marks !== null &&
        param?.approved_marks !== "" &&
        !isNaN(Number(param?.approved_marks)) &&
        param?.approved_by_user !== null;

      const marksToUse = hasApprovedMarks ? Number(param.approved_marks) : Number(param?.marks ?? 0);
      
      if (param?.negative) {
        totalNegativeMarks += marksToUse;
      } else {
        totalPositiveMarks += marksToUse;
      }
    });
    
    return totalPositiveMarks + graceMarks - totalNegativeMarks;
  };

  const getDiscretionaryMarksByRole = (unit: any, role: string): number => {
    const graceEntry = unit?.fds?.applicationGraceMarks?.find(
      (item: any) => item?.role?.toLowerCase() === role.toLowerCase()
    );
    return graceEntry?.marks ?? 0;
  };

  const handlePriorityChange = async (unitDetail: any, value: string) => {
    const priorityPoints = parseInt(value);

    if (isNaN(priorityPoints)) {
      toast.error("Please enter a valid number");
      return;
    }


    if (priorityPoints < 1 || priorityPoints > 1000) {
      toast.error("Priority must be between 1 and 1000");
      return;
    }

    const body = {
      type: unitDetail?.type ?? "citation",
      application_id: unitDetail?.id ?? 0,
      applicationPriorityPoints: priorityPoints,
      parameters: [],
    };

    try {
      await dispatch(approveMarks(body)).unwrap();
      fetchData();
      toast.success("Priority updated successfully");
    } catch (error) {
      toast.error("Failed to update priority");
    }
  };


  const debouncedHandlePriorityChange = useDebounce(handlePriorityChange, 1000);

  const handleBulkApprove = async () => {
    const incompleteUnits = units.filter((unit) => {
      const value = priorityValues[unit.id];
      return !value || isNaN(Number(value));
    });

    if (incompleteUnits.length > 0) {
      toast.error(
        "Please enter priority for all applications before approving."
      );
      return;
    }

    const groupedByType = units.reduce(
      (acc: Record<string, number[]>, unit) => {
        if (!acc[unit?.type]) {
          acc[unit.type] = [];
        }
        acc[unit.type].push(unit.id);
        return acc;
      },
      {}
    );

    try {
      await Promise.all(
        Object.entries(groupedByType).map(([type, ids]) =>
          dispatch(
            approveApplications({
              type,
              ids,
            })
          ).unwrap()
        )
      );
      const params = {
        award_type: awardType ?? "",
        search: debouncedSearch,
        page,
        limit,
        isShortlisted: true,
      };

      dispatch(fetchSubordinates(params));
    } catch (err) {
      toast.error("One or more approvals failed");
    }
  };

  useEffect(() => {
    const initialGraceValues: { [key: string]: { [type: string]: string } } = {};

    units.forEach((unit) => {
      const found = unit?.fds?.applicationGraceMarks?.find(
        (g: any) => g.role?.toLowerCase() === role
      );

      const unitId = String(unit.id);
      const unitType = unit.type;

      if (!initialGraceValues[unitId]) {
        initialGraceValues[unitId] = {};
      }

      initialGraceValues[unitId][unitType] = found?.marks?.toString() ?? "";
    });

    setGraceMarksValues(initialGraceValues);
  }, [units, role]);

  const handleGraceMarksChange = (
    unitId: string,
    value: string,
    unitType: string
  ) => {
    setGraceMarksValues((prev) => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] ?? {}),
        [unitType]: value,
      },
    }));

    if (value === undefined || value === "") return;

    const body: any = {
      type: unitType ?? "citation",
      application_id: unitId,
      applicationGraceMarks: Number(value),
      role,
    };

    dispatch(approveMarks(body)).unwrap().then(() => { fetchData() });
  };

























































  const handleExportPDF = () => {
  const doc = new jsPDF();

  const docHeader = `COAS Unit Citation and COAS Certificate of Appreciation Board of Officers Report`;
  const level = profile?.user?.user_role?.toUpperCase() ?? "";
  const memberHeaders = ["Role", "IC Number", "Rank", "Name", "Appointment"];
  const memberRows = [];

  const presiding = profile?.unit?.members?.find((m: any) => m.member_type === "presiding_officer");
  const members = profile?.unit?.members?.filter((m: any) => m.member_type !== "presiding_officer");

  if (presiding) {
    memberRows.push(["Presiding Officer", presiding.ic_number ?? "-", presiding.rank, presiding.name, presiding.appointment]);
  }
  if (members && members.length > 0) {
    members.forEach((m: any) => {
      memberRows.push(["Member Officer", m.ic_number ?? "-", m.rank, m.name, m.appointment]);
    });
  }


  doc.setFontSize(14);
  doc.text(docHeader, 14, 10);

  doc.setFontSize(10);
  doc.text(`Level: ${level}`, 14, 18);

  autoTable(doc, {
    head: [memberHeaders],
    body: memberRows,
    startY: 28,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  let currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 30;

  const paragraphs = [
    "1. The Bd of Offr for evaluating COAS Unit Citation and COAS Cert of Appre assembled pursuant to Convening Order referred above on 20 Nov 2024 and subsequent days.",
    "2. A total of 127 (One Hundred Twenty Seven) citations as per details given at Appx A were recd from Comd theatres for COAS / GOC-in-C Unit Citation.",
    `3. Based on merit as per policy on COAS Unit Citation and Cert of Appre promulgated vide CW Dte (CW-2), AG’s Branch, IHQ of MoD (Army) and HQ ${profile?.unit.comd} issued vide this HQ letters, a total of ${cit_count} units have been recommended for COAS Unit Citation and total of ${appr_count} units have been recommended for COAS Cert of Appre. The bd for GOC-in-C Unit Citation will be considered separately on declaration of COAS Unit Citation and Cert of Appre.`,
    "4. Based on the overall performance of the Units, the Bd recommends the fwg units for COAS Unit Citation:"
  ];

  paragraphs.forEach((para) => {
    const lines = doc.splitTextToSize(para, 180);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 6 + 3;
  });

  const appHeaders = [[
    "S. No", "Type", "Unit ID", "Unit Name", "Location", "Brigade", "Division", "Corps", "Command", "-ve Marks",
    ...allowedRoles.map(r => `Points By ${r}`),
    "Total", ...(role !== "brigade" ? ["Lower Priority"] : []),
    ...(role === "command" ? ["Status"] : []),
  ]];

  const appRows = units.map((unit: any) => [
    `#${unit.id}`,
    unit.type,
    `#${unit.unit_id}`,
    unit.unit_details?.name ?? "-",
    unit.unit_details?.location ?? "-",
    unit.unit_details?.bde ?? "-",
    unit.unit_details?.div ?? "-",
    unit.unit_details?.corps ?? "-",
    unit.unit_details?.comd ?? "-",
    unit?.totalNegativeMarks ?? "-",
    ...allowedRoles.map((r) => getDiscretionaryMarksByRole(unit, r)),
    getTotalMarks(unit),
    ...(role !== "brigade" ? [getLowerRolePriority(unit)] : []),
    ...(role === "command" ? [unit?.status_flag === "approved" ? "Approved" : "Pending"] : []),
  ]);

  autoTable(doc, {
    head: appHeaders,
    body: appRows,
    startY: currentY + 4,
    theme: 'grid',
    headStyles: { fillColor: [52, 73, 94] },
    styles: { fontSize: 6 }
  });

  doc.save("accepted-applications.pdf");
};


  return (
    <div className="clarification-section" style={{ maxWidth: "80vw" }}>
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Recommended Applications"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Accepted Applications", href: "/application/accepted" },
          ]}
        />
        <button className="_btn primary mb-3 d-flex align-items-center gap-2" onClick={handleExportPDF}>
          <FaDownload />
          <span>Recommendation Report</span>
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

      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead style={{ backgroundColor: "#007bff" }}>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                S. No
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>Type</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Unit ID
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Unit Name
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Location
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Brigade
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Division
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Corps
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Command
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Tenure
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Kills
              </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Apprehended/Surrendered
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Other Para Marks
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                -ve Marks
              </th>
              {allowedRoles.map((role) => (
                <th
                  key={role}
                  style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}
                >
                  Points By {role.charAt(0).toUpperCase() + role.slice(1)}
                </th>
              ))}
              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Discretionary Points
              </th>
              {role === "headquarter" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                  Command
                </th>
              )}

              <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                Total Marks
              </th>
              {role.toLowerCase() !== "brigade" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                  {lowerRole
                    ? lowerRole.charAt(0).toUpperCase() + lowerRole.slice(1)
                    : "-"}{" "}
                  Priority
                </th>
              )}
              {role === "command" && (
                <th style={{ width: 200, minWidth: 200, maxWidth: 200, color: "white" }}>
                  Status
                </th>
              )}
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : "-"}{" "}
                Priority
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150, color: "white" }}>
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {units.length > 0 &&
              units.map((unit: any) => (
                <tr
                  key={unit.id}
                  className="cursor-auto"
                >
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">#{unit.id}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">
                      {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
                    </p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">#{unit.unit_id}</p>
                  </td>

                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">{unit.unit_details?.name ?? "-"}</p>
                  </td>
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">{unit.unit_details?.location ?? "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.fds?.brigade ?? "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.fds?.division ?? "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.fds?.corps ?? "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.fds?.command ?? "-"}</p>
                  </td>
                  {/* Tenure */}
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">
                      {unit?.fds?.parameters?.find(
                        (p: any) => p.name.toLowerCase() === "tenure"
                      )?.marks ?? "-"}
                    </p>
                  </td>

                  {/* Kills */}
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">
                      {unit?.fds?.parameters?.find(
                        (p: any) => p.name.toLowerCase() === "kills"
                      )?.marks ?? "-"}
                    </p>
                  </td>

                  {/* Apprehended / Surrendered */}
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">
                      {unit?.fds?.parameters
                        ?.filter((p: { name: string; marks: number }) =>
                          ["surrendered", "apprehended"].includes(
                            p.name.toLowerCase()
                          )
                        )
                        ?.reduce(
                          (sum: number, p: { marks: number }) =>
                            sum + (p.marks ?? 0),
                          0
                        ) ?? "-"}
                    </p>
                  </td>

                  {/* Other Para Marks */}
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">
                      {unit?.fds?.parameters
                        ?.filter(
                          (p: { name: string; marks: number }) =>
                            ![
                              "tenure",
                              "kills",
                              "surrendered",
                              "apprehended",
                            ].includes(p.name.toLowerCase())
                        )
                        ?.reduce(
                          (sum: number, p: { marks: number }) =>
                            sum + (p.marks ?? 0),
                          0
                        ) ?? "-"}
                    </p>
                  </td>
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">{unit?.totalNegativeMarks ?? "-"}</p>
                  </td>
                  {allowedRoles.map((role) => (
                    <td
                      key={role}
                      style={{ width: 150, minWidth: 150, maxWidth: 150 }}
                    >
                      <p className="fw-4">
                        {getDiscretionaryMarksByRole(unit, role)}
                      </p>
                    </td>
                  ))}
        <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
  <input
    type="number"
    inputMode="numeric"
    className="form-control"
    placeholder="Enter discretionary points (1-10)"
    autoComplete="off"
    min={1}
    max={10}
    step={1}
    value={graceMarksValues[String(unit.id)]?.[unit.type] ?? ""}
    onChange={(e) => {
      const value = e.target.value;

      if (value === "") {
        handleGraceMarksChange(String(unit.id), value, unit.type);
        return;
      }

      if (!/^\d+$/.test(value)) {
        return;
      }
      const numValue = Number(value);
      if (numValue < 1 || numValue > 10) {
        toast.error("Value must be an integer between 1 and 10", { id: "grace-int-range" });
        return;
      }
      handleGraceMarksChange(String(unit.id), value, unit.type);
    }}
  />
</td>



                  {role === "headquarter" && (
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{unit?.fds?.command}</p>
                    </td>
                  )}

                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">{getTotalMarks(unit).toFixed(2)}</p>
                  </td>
                  {role.toLowerCase() !== "brigade" && (
                    <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                      <p className="fw-4">{getLowerRolePriority(unit)}</p>
                    </td>
                  )}
                  {role === "command" && (
                    <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                      <p
                        className="fw-4"
                        style={{
                          color:
                            unit?.status_flag === "approved" ? "green" : "red",
                        }}
                      >
                        {unit?.status_flag === "approved"
                          ? "Approved"
                          : "Pending"}
                      </p>
                    </td>
                  )}

<td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
  <input
    type="number"
    inputMode="numeric"
    className="form-control"
    placeholder="Enter priority (1-1000)"
    autoComplete="off"
    min="1"
    max="1000"
    value={priorityValues[String(unit.id)]?.[unit.type] ?? ""}
    onChange={(e) => {
      const value = e.target.value;


      if (value && !/^\d+$/.test(value)) return;


      setPriorityValues((prev) => ({
        ...prev,
        [String(unit.id)]: {
          ...(prev[String(unit.id)] ?? {}),
          [unit.type]: value,
        },
      }));


      if (value && !isNaN(Number(value))) {
        const numValue = Number(value);
        if (numValue >= 1 && numValue <= 1000) {
          debouncedHandlePriorityChange(unit, value);
        } else {
          toast.error("Priority must be an integer between 1 and 1000", { id: "priority-int-range" });
        }
      }
    }}
  />
</td>


                  <td style={{ maxWidth: "100%" }}>
                    {unit.status_flag === "approved" || unit.status_flag === "rejected" ? (
                      <div>
                        <p
                          className="fw-4"
                          style={{
                            color: unit?.status_flag === "approved" ? "green" : "red",
                            margin: 0,
                          }}
                        >
                          {unit?.status_flag === "approved" ? "Approved" : "Rejected"}
                        </p>
                      </div>
                    ) : (













































                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="_btn success"
                          onClick={async () => {
                            const priorityExists = unit?.fds?.applicationPriority?.some(
                              (p: any) => p.role === role && p.priority != null
                            );

                            if (!priorityExists) {
                              toast.error(`Please add priority for the ${role} role before approving.`);
                              return;
                            }

                            try {
                              const graceMarksExist = unit?.fds?.applicationGraceMarks?.some(
                                (m: any) => m.role === role && m.marks != null
                              );

                              if (!graceMarksExist) {
                                toast.error(
                                  `Please add Discretionary Points for the ${role} role before approving.`
                                );
                                return;
                              }
                              await dispatch(
                                updateApplication({
                                  id: unit?.id,
                                  type: unit?.type,
                                  status: "approved",
                                })
                              ).unwrap();

                              navigate("/applications/list");
                            } catch (error) {
                              toast.error("Error while approving the application.");
                            }
                          }}
                        >
                          Approve
                        </button>

                        <button
                          className="_btn danger"
                          onClick={() => {
                            dispatch(
                              updateApplication({
                                id: unit?.id,
                                type: unit?.type,
                                status: "rejected",
                              })
                            ).then(() => {
                              navigate("/applications/list");
                            });
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              ))
            }
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

      <ReqSignatureApproveModal
        show={showSignatureModal}
        handleClose={() => setShowSignatureModal(false)}
        handleApprove={() => {
          handleBulkApprove();
          setShowSignatureModal(false);
        }}
      />
    </div>
  );
};

export default AcceptedApplicationsList;
