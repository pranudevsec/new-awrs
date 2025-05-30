import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SVGICON } from "../../constants/iconsList";
import { awardTypeOptions } from "../../data/options";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { getClarifications, getSubordinateClarifications } from "../../reduxToolkit/services/clarification/clarificationService";
import type { Parameter } from "../../reduxToolkit/services/parameter/parameterInterface";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import Pagination from "../../components/ui/pagination/Pagination";

const Clarification = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.admin.profile);
  const unitClarifications = useAppSelector((state) => state.clarification.unitClarifications);

  useEffect(() => {
    if (profile?.user?.user_role === "unit") {
      dispatch(getClarifications());
    } else {
      dispatch(getSubordinateClarifications());
    }
  }, [dispatch, profile?.user?.user_role]);

  return (
    <div className="clarification-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Clarification to Resolve" />
      </div>
      <div className="filter-wrapper d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="search-wrapper position-relative">
          <button className="border-0 bg-transparent position-absolute translate-middle-y top-50">
            {SVGICON.app.search}
          </button>
          <input type="text" placeholder="search..." className="form-control" />
        </div>
        <FormSelect
          name="awardType"
          options={awardTypeOptions}
          value={null}
          placeholder="Select Type"
        />
      </div>
      <div className="table-responsive">
        <table className="table-style-2 w-100">
          <thead>
            <tr>
              <th style={{ width: 150 }}>Application Id</th>
              <th style={{ width: 150 }}>Unit ID</th>
              <th style={{ width: 200 }}>Submission Date</th>
              <th style={{ width: 200 }}>Dead Line</th>
              <th style={{ width: 150 }}>Type</th>
              <th style={{ width: 200 }}>Clarifications</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {unitClarifications.map((app) => {
              // Count parameters with clarification_id
              const clarificationsCount = app.fds.parameters.filter((p: Parameter) => p.clarification_id).length;

              return (
                <tr key={app.id} onClick={() => navigate(`/clarification/unit/${app.id}?award_type=${app.type}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ width: 150 }}><p className="fw-4">#{app.id}</p></td>
                  <td style={{ width: 150 }}><p className="fw-4">#{app.unit_id}</p></td>
                  <td style={{ width: 200 }}><p className="fw-4">{new Date(app.date_init).toLocaleDateString()}</p></td>
                  <td style={{ width: 200 }}><p className="fw-4">{new Date(app.fds.last_date).toLocaleDateString()}</p></td>
                  <td style={{ width: 150 }}><p className="fw-4">{app.type}</p></td>
                  <td style={{ width: 200 }}>
                    <div
                      className={`status-content approved ${clarificationsCount > 0 ? 'reject' : 'pending'} d-flex align-items-center gap-3`}
                    >
                      <span></span>
                      <p className={`text-capitalize fw-5 ${clarificationsCount > 0 ? 'text-danger' : ''}`}>
                        {clarificationsCount > 0 ? `${clarificationsCount} Clarifications` : 'No Clarifications'}
                      </p>
                    </div>
                  </td>
                  <td style={{ width: 100 }}>
                    <div>
                      <Link
                        to={`/clarification/unit/${app.id}?award_type=${app.type}`}
                        className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                        onClick={e => e.stopPropagation()} // Prevent row click
                      >
                        {SVGICON.app.eye}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination />
    </div >
  );
};

export default Clarification;
