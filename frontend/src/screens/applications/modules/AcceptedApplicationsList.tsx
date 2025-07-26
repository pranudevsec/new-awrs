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
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import {
  approveApplications,
  approveMarks,
  fetchApplicationsForHQ,
  fetchApplicationUnits,
  fetchSubordinates,
  updateApplication,
  TokenValidation,
  getSignedData,
} from "../../../reduxToolkit/services/application/applicationService";

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
  const role = profile?.user?.user_role?.toLowerCase() ?? "";

  // States
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
    let totalNegativeMarks = 0;
    const totalParameterMarks = parameters.reduce((acc: number, param: any) => {
      const isRejected =
        param?.clarification_details?.clarification_status === "rejected";

      if (isRejected) return acc;

      const hasValidApproved =
        param?.approved_marks !== undefined &&
        param?.approved_marks !== null &&
        param?.approved_marks !== "" &&
        !isNaN(Number(param?.approved_marks));
      const approved = hasValidApproved ? Number(param.approved_marks) : null;
      let original = 0;
      if (param?.negative) {
        totalNegativeMarks += Number(param?.marks ?? 0);
      } else {
        original = Number(param?.marks ?? 0);
      }
      return acc + (approved ?? original);
    }, 0);
    return totalParameterMarks + graceMarks - totalNegativeMarks;
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
      console.error("approveMarks error:", error);
      toast.error("Failed to update priority");
    }
  };

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
      console.error("error:", err)
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

  const handleAddsignature = async (decision: string, unit: any) => {
    const result = await dispatch(
      TokenValidation({ inputPersID: profile?.user?.pers_no ?? "" })
    );

    if (TokenValidation.fulfilled.match(result)) {
      const isValid = result.payload.vaildId;
      if (!isValid) {
        return;
      }

      const SignPayload = {
        data: {
          id: unit?.id,
          user: profile?.user,
          type: profile?.user?.user_role,
        },
      };
      const response = await dispatch(getSignedData(SignPayload));

      const updatePayload = {
        id: unit?.id,
        type: unit?.type,
        member: {
          name: profile?.user?.name,
          ic_number: profile?.user?.pers_no,
          member_type: profile?.user?.user_role,
          iscdr: true,
          member_id: profile?.user?.user_id,
          is_signature_added: true,
          sign_digest: response.payload,
        },
        level: profile?.user?.user_role,
      };
      if (decision === "approved") {
        await dispatch(
          updateApplication({
            ...updatePayload,
            status: "approved",
          })
        ).then(() => {
          navigate("/applications/list");
        });
      } else if (decision === "rejected") {
        dispatch(
          updateApplication({
            ...updatePayload,
            status: "rejected",
          })
        ).then(() => {
          navigate("/applications/list");
        });
      }
    }
  };

  const handleExportPDF = () => {
  const doc = new jsPDF();

  // 1. Presiding Officer & Members
  const memberHeaders = ["Type", "IC Number", "Rank", "Name", "Appointment"];
  const memberRows = [];

  const presiding = profile?.unit?.members?.find((m: any) => m.member_type === "presiding_officer");
  const members = profile?.unit?.members?.filter((m: any) => m.member_type !== "presiding_officer");

  if (presiding) {
    memberRows.push(["Presiding Officer", presiding.rank, presiding.name, presiding.appointment]);
  }
  if (members && members.length > 0) {
    members.forEach((m: any) => {
      memberRows.push(["Member Officer", m.rank, m.name, m.appointment]);
    });
  }

  autoTable(doc, {
    head: [memberHeaders],
    body: memberRows,
    startY: 10,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  // 2. Text paragraphs
  let currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 30;

const paragraphs = [
  "1. The Bd of Offr for evaluating COAS Unit Citation and COAS Cert of Appre assembled pursuant to Convening Order referred above on 20 Nov 2024 and subsequent days.",
  "2. A total of 127 (One Hundred Twenty Seven) citations as per details given at Appx A were recd from Comd theatres for COAS / GOC-in-C Unit Citation.",
  "3. Based on merit as per policy on COAS Unit Citation and Cert of Appre promulgated vide CW Dte (CW-2), AG’s Branch, IHQ of MoD (Army) letter No B/43057/UC/AG/CW-2 dt 29 Apr 22 and HQ Northern Comd SOP No 01/2022 issued vide this HQ letters No 23104/5/IR/2A(Cer) dt 31 Aug 22 and even No dt 16 Sep 22, a total of 36 (Thirty Six) units have been recommended for COAS Unit Citation and total of 07 (Seven) units have been recommended for COAS Cert of Appre. The bd for GOC-in-C Unit Citation will be considered separately on declaration of COAS Unit Citation and Cert of Appre.",
  "4. Based on the overall performance of the Units, the Bd recommends the fwg units for COAS Unit Citation:"
];

paragraphs.forEach((para) => {
  const lines = doc.splitTextToSize(para, 180); // wrap text at 180 width
  doc.text(lines, 14, currentY);
  currentY += lines.length * 8 + 5; // Adjust spacing between paragraphs
});

  // 3. Applications Table
  const appHeaders = [
    ["S. No", "Type", "Unit ID", "Unit Name", "Location", "Brigade", "Division", "Corps", "Command", "-ve Marks",
    ...allowedRoles.map(r => `Points By ${r}`),
    "Discretionary", ...(role === "headquarter" ? ["Command"] : []),
    "Total", ...(role !== "brigade" ? ["Lower Priority"] : []),
    ...(role === "command" ? ["Status"] : []),
    `${role.charAt(0).toUpperCase() + role.slice(1)} Priority`]
  ];

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
    graceMarksValues[String(unit.id)]?.[unit.type] ?? "",
    ...(role === "headquarter" ? [unit?.fds?.command ?? "-"] : []),
    getTotalMarks(unit),
    ...(role !== "brigade" ? [getLowerRolePriority(unit)] : []),
    ...(role === "command" ? [unit?.status_flag === "approved" ? "Approved" : "Pending"] : []),
    priorityValues[String(unit.id)]?.[unit.type] ?? "",
  ]);

  autoTable(doc, {
    head: appHeaders,
    body: appRows,
    startY: currentY + 10,
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
          title="Accepted Applications"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Accepted Applications", href: "/application/accepted" },
          ]}
        />
        <button className="btn btn-primary" onClick={handleExportPDF}>
          Recommendation Report
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
          <thead>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                S. No
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Type</th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Unit ID
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Unit Name
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Location
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Brigade
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Division
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Corps
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Command
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Tenure
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Kills
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Apprehended/Surrendered
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Other Para Marks
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                -ve Marks
              </th>
              {allowedRoles.map((role) => (
                <th
                  key={role}
                  style={{ width: 150, minWidth: 150, maxWidth: 150 }}
                >
                  Points By {role.charAt(0).toUpperCase() + role.slice(1)}
                </th>
              ))}
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Discretionary Points
              </th>
              {role === "headquarter" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  Command
                </th>
              )}

              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Total Marks
              </th>
              {role.toLowerCase() !== "brigade" && (
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  {lowerRole
                    ? lowerRole.charAt(0).toUpperCase() + lowerRole.slice(1)
                    : "-"}{" "}
                  Priority
                </th>
              )}
              {role === "command" && (
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  Status
                </th>
              )}
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : "-"}{" "}
                Priority
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
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
                    <p className="fw-4">{unit.unit_details?.bde ?? "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.unit_details?.div ?? "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.unit_details?.corps ?? "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.unit_details?.comd ?? "-"}</p>
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
                      className="form-control"
                      placeholder="Enter discretionary points"
                      autoComplete="off"
                      value={
                        (graceMarksValues[String(unit.id)]?.[unit.type]) ?? ""
                      }
                      onChange={(e) =>
                        handleGraceMarksChange(String(unit.id), e.target.value, unit.type)
                      }
                    />
                  </td>

                  {role === "headquarter" && (
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{unit?.fds?.command}</p>
                    </td>
                  )}

                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">{getTotalMarks(unit)}</p>
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
                      type="text"
                      className="form-control"
                      placeholder="Enter priority"
                      autoComplete="off"
                      value={priorityValues[String(unit.id)]?.[unit.type] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPriorityValues((prev) => ({
                          ...prev,
                          [String(unit.id)]: {
                            ...(prev[String(unit.id)] ?? {}),
                            [unit.type]: value,
                          },
                        }));
                        handlePriorityChange(unit, value);
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
                      // with token
                      // <div className="d-flex align-items-center gap-2">
                      //   <button
                      //     className="_btn success"
                      //     onClick={async () => {
                      //       const priorityExists = unit?.fds?.applicationPriority?.some(
                      //         (p: any) => p.role === role && p.priority != null
                      //       );

                      //       if (!priorityExists) {
                      //         toast.error(`Please add priority for the ${role} role before approving.`);
                      //         return;
                      //       }

                      //       try {
                      //         const graceMarksExist = unit?.fds?.applicationGraceMarks?.some(
                      //           (m: any) => m.role === role && m.marks != null
                      //         );

                      //         if (!graceMarksExist) {
                      //           toast.error(
                      //             `Please add Discretionary Points for the ${role} role before approving.`
                      //           );
                      //           return;
                      //         }
                      //         await handleAddsignature("approved", unit);
                      //       } catch (error) {
                      //         console.log("error ->", error)
                      //         toast.error("Error while approving the application.");
                      //       }
                      //     }}
                      //   >
                      //     Approve
                      //   </button>

                      //   <button
                      //     className="_btn danger"
                      //     onClick={async () => {
                      //       await handleAddsignature("rejected", unit);
                      //     }}
                      //   >
                      //     Reject
                      //   </button>
                      // </div>

                      // without token 
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
                              // If all checks pass, navigate
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
        handleApprove={(signatureFile) => {
          console.log("Approving with signature:", signatureFile);
          handleBulkApprove();
          setShowSignatureModal(false);
        }}
      />
    </div>
  );
};

export default AcceptedApplicationsList;
