import { useEffect} from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch } from "../../reduxToolkit/hooks";
import { awardTypeOptions, cyclePeriodOptions } from "../../data/options";
import { fetchApplicationUnitDetail } from "../../reduxToolkit/services/application/applicationService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";

const ClarificationDetail = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { application_id } = useParams();

  // States
  const award_type = searchParams.get("award_type") ?? "";
  const numericAppId = Number(application_id);

  useEffect(() => {
    if (award_type && numericAppId) {
      dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }))
        .unwrap()
        .then(() => {
        })
        .catch((err) => {
          console.error("Fetch failed:", err);
        });
    }
  }, [award_type, numericAppId]);

  return (
    <div className="apply-citation-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Application ID: #12345"
          paths={[
            { label: "Clarification", href: "/clarification" },
            { label: "Application Details", href: "/clarification/1" },
          ]}
        />
      </div>
      <div className="table-filter-area mb-4">
        <div className="row">
          <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
            <FormSelect
              label="Award Type"
              name="awardType"
              options={awardTypeOptions}
              value={
                awardTypeOptions.find((opt) => opt.value === "citation") ??
                null
              }
              placeholder="Select"
              isDisabled={true}
            />
          </div>
          <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
            <FormSelect
              label="Cycle Period"
              name="cyclePeriod"
              options={cyclePeriodOptions}
              value={
                cyclePeriodOptions.find((opt) => opt.value === "citation") ??
                null
              }
              placeholder="Select"
            />
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table-style-1 w-100">
          <thead>
            <tr>
              <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                <div className="d-flex align-items-start">Parameter</div>
              </th>
              <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div className="d-flex align-items-start">Count</div>
              </th>
              <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div className="d-flex align-items-start">Marks</div>
              </th>
              <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div className="d-flex align-items-start">Document</div>
              </th>
              <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                <div className="d-flex align-items-start">Approved Marks</div>
              </th>
              <th style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                <div className="d-flex align-items-start">Clarification</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                <p className="fw-5">Parameter 1</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">2</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">8</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
              </td>
              <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter approved marks"
                  autoComplete="off"
                  value="0"
                  readOnly
                />
              </td>
              <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                <button
                  className="border-0 bg-transparent"
                  style={{ color: "var(--secondary-default)" }}
                >
                  {SVGICON.app.clarification}
                </button>
              </td>
            </tr>
            <tr>
              <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                <p className="fw-5">Parameter 1</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">2</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">8</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
              </td>
              <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter approved marks"
                  autoComplete="off"
                  value="0"
                  readOnly
                />
              </td>
              <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                <button
                  className="border-0 bg-transparent"
                  style={{ color: "var(--secondary-default)" }}
                >
                  {SVGICON.app.clarification}
                </button>
              </td>
            </tr>
            <tr>
              <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                <p className="fw-5">Parameter 1</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">2</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">8</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
              </td>
              <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter approved marks"
                  autoComplete="off"
                  value="0"
                  readOnly
                />
              </td>
              <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                <button
                  className="border-0 bg-transparent"
                  style={{ color: "var(--secondary-default)" }}
                >
                  {SVGICON.app.clarification}
                </button>
              </td>
            </tr>
            <tr>
              <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                <p className="fw-5">Parameter 1</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">2</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">8</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
              </td>
              <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter approved marks"
                  autoComplete="off"
                  value="0"
                  readOnly
                />
              </td>
              <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                <button
                  className="border-0 bg-transparent"
                  style={{ color: "var(--secondary-default)" }}
                >
                  {SVGICON.app.clarification}
                </button>
              </td>
            </tr>
            <tr>
              <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                <p className="fw-5">Parameter 1</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">2</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">8</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
              </td>
              <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter approved marks"
                  autoComplete="off"
                  value="0"
                  readOnly
                />
              </td>
              <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                <button
                  className="border-0 bg-transparent"
                  style={{ color: "var(--secondary-default)" }}
                >
                  {SVGICON.app.clarification}
                </button>
              </td>
            </tr>
            <tr>
              <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                <p className="fw-5">Parameter 1</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">2</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">8</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
              </td>
              <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter approved marks"
                  autoComplete="off"
                  value="0"
                  readOnly
                />
              </td>
              <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                <button
                  className="border-0 bg-transparent"
                  style={{ color: "var(--secondary-default)" }}
                >
                  {SVGICON.app.clarification}
                </button>
              </td>
            </tr>
            <tr>
              <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                <p className="fw-5">Parameter 1</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">2</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">8</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
              </td>
              <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter approved marks"
                  autoComplete="off"
                  value="0"
                  readOnly
                />
              </td>
              <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                <button
                  className="border-0 bg-transparent"
                  style={{ color: "var(--secondary-default)" }}
                >
                  {SVGICON.app.clarification}
                </button>
              </td>
            </tr>
            <tr>
              <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                <p className="fw-5">Parameter 1</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">2</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <p className="fw-5">8</p>
              </td>
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                <div style={{ fontSize: 18 }}>{SVGICON.app.pdf}</div>
              </td>
              <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter approved marks"
                  autoComplete="off"
                  value="0"
                  readOnly
                />
              </td>
              <td style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                <button
                  className="border-0 bg-transparent"
                  style={{ color: "var(--secondary-default)" }}
                >
                  {SVGICON.app.clarification}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="submit-button-wrapper">
        <div className="d-flex gap-3 justify-content-end">
          <button className="_btn success">Accepted</button>
          <button className="_btn danger">Reject</button>
        </div>
      </div>
    </div>
  );
};

export default ClarificationDetail;
