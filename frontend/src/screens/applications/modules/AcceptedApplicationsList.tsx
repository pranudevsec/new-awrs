import { useEffect, useState } from "react";
import { awardTypeOptions } from "../../../data/options";
import { SVGICON } from "../../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import {
  approveApplications,
  approveMarks,
  fetchApplicationsForHQ,
  fetchApplicationUnits,
  fetchSubordinates,
} from "../../../reduxToolkit/services/application/applicationService";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Loader from "../../../components/ui/loader/Loader";
import Pagination from "../../../components/ui/pagination/Pagination";
import toast from "react-hot-toast";

const AcceptedApplicationsList = () => {
  const dispatch = useAppDispatch();

  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading, meta } = useAppSelector((state) => state.application);

  // States
  const [awardType, setAwardType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";
  const [priorityValues, setPriorityValues] = useState<{
    [key: string]: string;
  }>({});
  const hierarchy = ["unit", "brigade", "division", "corps", "command"];
  const allRoles = ["brigade", "division", "corps", "command"];
  const lowerRole = hierarchy[hierarchy.indexOf(role) - 1] || null;
  const currentRole = profile?.user?.user_role?.toLowerCase() ?? "";
  const allowedRoles = allRoles.slice(0, allRoles.indexOf(currentRole) + 1);
  const getLowerRolePriority = (unit: any) => {
    if (!lowerRole || !unit?.fds?.applicationPriority) return "-";
    const priorityEntry = unit?.fds.applicationPriority.find(
      (p: any) => p.role?.toLowerCase() === lowerRole
    );
    return priorityEntry?.priority ?? "-";
  };

  useEffect(() => {
    const initialValues: { [key: string]: string } = {};
    units.forEach((unit) => {
      const found = unit?.fds?.applicationPriority?.find(
        (p: any) => p.role?.toLowerCase() === role
      );
      initialValues[unit.id] = found?.priority?.toString() || "";
    });
    setPriorityValues(initialValues);
  }, [units, role]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!profile?.user?.user_role) return;

    const fetchData = () => {
      const params = {
        award_type: awardType || "",
        search: debouncedSearch,
        page,
        limit,
        isShortlisted: true,
      };

      const role = profile.user.user_role;

      if (role === "cw2" || role === "headquarter") {
        dispatch(fetchApplicationsForHQ(params));
      } else if (role !== "unit") {
        dispatch(fetchSubordinates(params));
      } else {
        dispatch(fetchApplicationUnits(params));
      }
    };

    fetchData();
  }, [awardType, debouncedSearch, profile, page, limit]);

  const getTotalMarks = (unit: any): number => {
    const parameters = unit?.fds?.parameters ?? [];
    const graceMarks =
      unit?.fds?.applicationGraceMarks?.reduce(
        (acc: number, item: any) => acc + (item?.marks ?? 0),
        0
      ) ?? 0;

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
      const original = Number(param?.marks ?? 0);

      return acc + (approved !== null ? approved : original);
    }, 0);

    return totalParameterMarks + graceMarks;
  };
  const getDiscretionaryMarksByRole = (unit: any, role: string): number => {
    const graceEntry = unit?.fds?.applicationGraceMarks?.find(
      (item: any) => item?.role?.toLowerCase() === role.toLowerCase()
    );
    return graceEntry?.marks ?? 0;
  };

  // Helper function to update priority
  const handlePriorityChange = async (
    unitDetail: any,
    value: string,
    allUnits: any[]
  ) => {
    const priorityPoints = parseInt(value);
    const role = profile?.user?.user_role?.toLowerCase() ?? "";

    if (isNaN(priorityPoints)) {
      toast.error("Please enter a valid number");
      return;
    }

    const duplicate = allUnits.find((unit) => {
      if (unit?.id === unitDetail?.id) return false;

      return unit?.fds?.applicationPriority?.some(
        (item: any) =>
          item?.role?.toLowerCase() === role &&
          item?.priority === priorityPoints
      );
    });

    if (duplicate) {
      toast.error(
        `Priority ${priorityPoints} already exists for role "${role}"`
      );
      return;
    }

    const body = {
      type: unitDetail?.type || "citation",
      application_id: unitDetail?.id || 0,
      applicationPriorityPoints: priorityPoints,
      parameters: [],
    };

    try {
      await dispatch(approveMarks(body)).unwrap();
      toast.success("Priority updated successfully");
    } catch (error) {
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

    // Group by type
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
        award_type: awardType || "",
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

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Accepted Applications"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Accepted Applications", href: "/application/accepted" },
          ]}
        />
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
          value={awardType}
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

              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : "-"}{" "}
                Priority
              </th>
              {/* <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Action
              </th> */}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="d-flex justify-content-center py-5">
                    <Loader inline size={40} />
                  </div>
                </td>
              </tr>
            ) : (
              units.length > 0 &&
              units.map((unit: any, idx) => (
                <tr
                  key={idx}
                  onClick={() => {
                    // if (unit.status_flag === "draft") {
                    //   navigate(`/applications/${unit.type}?id=${unit.id}`);
                    // } else {
                    //   navigate(
                    //     `/applications/list/${unit.id}?award_type=${unit.type}`
                    //   );
                    // }
                  }}
                  //   style={{ cursor: "pointer" }}
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
                    <p className="fw-4">{unit.unit_details?.name || "-"}</p>
                  </td>
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">{unit.unit_details?.location || "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.unit_details?.bde || "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.unit_details?.div || "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.unit_details?.corps || "-"}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{unit.unit_details?.comd || "-"}</p>
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
                            sum + (p.marks || 0),
                          0
                        ) || "-"}
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
                            sum + (p.marks || 0),
                          0
                        ) || "-"}
                    </p>
                  </td>
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">{unit?.totalNegativeMarks || "-"}</p>
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
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter priority"
                      autoComplete="off"
                      value={priorityValues[unit.id] || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPriorityValues((prev) => ({
                          ...prev,
                          [unit.id]: value,
                        }));
                        handlePriorityChange(unit, value, units); // Optional: only if you want to call API on every change
                      }}
                    />
                  </td>
                  {/* <td >
 <div className="d-flex align-itemss-center gap-2">
 <button
  className="action-btn bg-transparent d-flex align-items-center justify-content-center"
  style={{ color: "var(--green-default)" }}
  onClick={() => {
    dispatch(
      updateApplication({
        id: unit?.id,
        type: unit?.type,
        status: "approved",
      })
    ).then(() => {
      toast.success("Application approved successfully");
      navigate("/applications/list");
    });
  }}
>
  <IoMdCheckmark />
</button>

                  <button
                    className="action-btn bg-transparent d-flex align-items-center justify-content-center"
                    style={{ color: "var(--red-default)" }}
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
                    <MdClose />
                  </button>
 </div>
                  

                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Empty Data */}
      {!loading && units.length === 0 && <EmptyTable />}
      {units && units.length > 0 && (
        <div className="button-groups d-flex flex-wrap gap-2 align-items-center justify-content-end mt-4">
          <button className="_btn outline">Upload signature</button>
          <button className="_btn outline">Upload signature</button>
          <button
            className="_btn success"
            onClick={() => {
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
              handleBulkApprove();
            }}
          >
            Approved
          </button>
        </div>
      )}

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

export default AcceptedApplicationsList;
