import { useEffect, useState } from "react";
import {  useNavigate } from "react-router-dom";
import { awardTypeOptions } from "../../../data/options";
import { SVGICON } from "../../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import {
  fetchApplicationsForHQ,
  fetchApplicationUnits,
  fetchSubordinates,
  updateApplication,
} from "../../../reduxToolkit/services/application/applicationService";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Loader from "../../../components/ui/loader/Loader";
import Pagination from "../../../components/ui/pagination/Pagination";
import { IoMdCheckmark } from "react-icons/io";
import { MdClose } from "react-icons/md";
import toast from "react-hot-toast";

const AcceptedApplicationsList = () => {
  const navigate = useNavigate();
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
  const [priorities, setPriorities] = useState<{ [key: string]: string }>({});

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
  const getDiscretionaryMarksByRole = (unit: any): number => {
    const currentRole = profile?.user?.user_role?.toLowerCase();
    const graceEntry = unit?.fds?.applicationGraceMarks?.find(
      (item: any) => item?.role?.toLowerCase() === currentRole
    );
    return graceEntry?.marks ?? 0;
  };
  // Load priorities from localStorage on mount
useEffect(() => {
    const stored = localStorage.getItem("application_priorities");
    if (stored) {
      setPriorities(JSON.parse(stored));
    }
  }, []);
  
  // Helper function to update priority
  const handlePriorityChange = (id: string | number, value: string) => {
    const updated = { ...priorities, [id]: value };
    setPriorities(updated);
    localStorage.setItem("application_priorities", JSON.stringify(updated));
    toast.success("Priority updated successfully");
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
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Type</th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                Total Marks
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Discretionary Marks
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Priority
              </th>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                Action
              </th>
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
                    <p className="fw-4">#{unit.unit_id}</p>
                  </td>
                  {role === "headquarter" && (
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{unit?.fds?.command}</p>
                    </td>
                  )}
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">
                      {new Date(unit.date_init).toLocaleDateString()}
                    </p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">
                      {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
                    </p>
                  </td>
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">{getTotalMarks(unit)}</p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{getDiscretionaryMarksByRole(unit)}</p>
                  </td>
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <input
  type="text"
  className="form-control"
  placeholder="Enter priority"
  autoComplete="off"
  value={priorities[unit.id] || ""}
  onChange={(e) => handlePriorityChange(unit.id, e.target.value)}
/>
                </td>
                  <td className="d-flex align-itemss-center gap-2">
 
                  
                  <button
  className="action-btn bg-transparent d-flex align-items-center justify-content-center"
  style={{ color: "var(--green-default)" }}
  onClick={() => {
    if (!priorities[unit.id] || priorities[unit.id].trim() === "") {
      toast.error("Please fill in the priority before approving.");
      return;
    }

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
                  </td>

                </tr>
              ))
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

export default AcceptedApplicationsList;
