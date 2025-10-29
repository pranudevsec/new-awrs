import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../reduxToolkit/hooks";
import { formatCompactDateTime, getDateStatus } from "../../../utils/dateUtils";
import Loader from "../../../components/ui/loader/Loader";
import { useEffect } from "react";

const TopWinnersList = () => {
  const profile = useAppSelector((state) => state.admin.profile);
  const { units, loading } = useAppSelector((state) => state.application);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";
  const navigate = useNavigate();



  useEffect(() => {
    if (!profile?.user?.user_role) return;






















  }, []);

  return (
    <div className="table-responsive">
      <table className="table-style-2 w-100">
        <thead style={{ backgroundColor: "#007bff" }}>
          <tr>
            <th
              style={{
                width: 150,
                minWidth: 150,
                maxWidth: 150,
                color: "white",
              }}
            >
              Application Id
            </th>
            <th
              style={{
                width: 150,
                minWidth: 150,
                maxWidth: 150,
                color: "white",
              }}
            >
              Unit ID
            </th>
            {role === "headquarter" && (
              <th
                style={{
                  width: 150,
                  minWidth: 150,
                  maxWidth: 150,
                  color: "white",
                }}
              >
                Command
              </th>
            )}
            <th
              style={{
                width: 200,
                minWidth: 200,
                maxWidth: 200,
                color: "white",
              }}
            >
              Submission Date
            </th>
            <th
              style={{
                width: 200,
                minWidth: 200,
                maxWidth: 200,
                color: "white",
              }}
            >
              Dead Line
            </th>
            <th
              style={{
                width: 150,
                minWidth: 150,
                maxWidth: 150,
                color: "white",
              }}
            >
              Type
            </th>
            <th
              style={{
                width: 150,
                minWidth: 150,
                maxWidth: 150,
                color: "white",
              }}
            >
              Status
            </th>
            <th
              style={{
                width: 150,
                minWidth: 150,
                maxWidth: 150,
                color: "white",
              }}
            >
              Current Stage
            </th>
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
              let approverRole = "Unit";
              if (
                unit?.status_flag === "rejected" &&
                unit?.last_rejected_by_role
              ) {
                approverRole =
                  unit.last_rejected_by_role.charAt(0).toUpperCase() +
                  unit.last_rejected_by_role.slice(1);
              } else if (
                unit?.status_flag === "shortlisted_approved" &&
                unit?.last_shortlisted_approved_role
              ) {
                approverRole =
                  unit.last_shortlisted_approved_role.charAt(0).toUpperCase() +
                  unit.last_shortlisted_approved_role.slice(1);
              } else if (unit?.last_approved_by_role) {
                approverRole =
                  unit.last_approved_by_role.charAt(0).toUpperCase() +
                  unit.last_approved_by_role.slice(1);
              }

              return (
                <tr
                  key={unit.id}
                  onClick={() =>
                    navigate(
                      `/all-applications/${unit.id}?award_type=${unit.type}`
                    )
                  }
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
                      {formatCompactDateTime(unit.date_init)}
                    </p>
                  </td>
                  <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                    <p className="fw-4">
                      {(() => {
                        const deadlineStatus = getDateStatus(unit.fds?.last_date, true, true);
                        return (
                          <span className={deadlineStatus.className}>
                            {deadlineStatus.text}
                          </span>
                        );
                      })()}
                    </p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">
                      {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
                    </p>
                  </td>

                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p
                      className="fw-4"
                      style={{
                        color: [
                          "approved",
                          "shortlisted_approved",
                          "in_review",
                        ].includes(unit?.status_flag)
                          ? "green"
                          : "red",
                      }}
                    >
                      {unit.status_flag === "shortlisted_approved" ||
                      unit?.status_flag === "in_review"
                        ? "Approved"
                        : unit.status_flag.charAt(0).toUpperCase() +
                          unit.status_flag.slice(1)}
                    </p>
                  </td>
                  <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">{approverRole}</p>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TopWinnersList;
