import { Link, } from "react-router-dom";
import { SVGICON } from "../../constants/iconsList";
import Pagination from "../../components/ui/pagination/Pagination";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";

const awardTypeOptions: OptionType[] = [
  { value: "citation", label: "Citation" },
  { value: "clarification", label: "Clarification" },
];

const cyclePeriodOptions: OptionType[] = [
  { value: "2024 - H1", label: "2024 - H1" },
  { value: "2024 - H2", label: "2024 - H2" },
  { value: "2025 - H1", label: "2025 - H1" },
  { value: "2025 - H2", label: "2025 - H2" },
];


const CommandPanel = () => {

  return (
    <>
      <div className="clarification-section">
        <div className="d-flex flex-sm-row flex-column justify-content-between mb-4">
          <Breadcrumb title="Scoreboard Listing" />
          <div className="d-flex align-items-center justify-content-end gap-3 mt-sm-0 mt-3">
            <button className="_btn outline d-flex align-items-center justify-content-center gap-2">
              <span>{SVGICON.app.export}</span>Export
            </button>
            <button className="_btn primary">Publish Winner</button>
          </div>
        </div>
        {/* <div className="filter-wrapper d-flex align-items-center justify-content-between gap-2 mb-3">
          <div className="search-wrapper position-relative">
            <button className="border-0 bg-transparent position-absolute translate-middle-y top-50">
              {SVGICON.app.search}
            </button>
            <input
              type="text"
              placeholder="search..."
              className="form-control"
            />
          </div>
        </div> */}
        <div className="filter-wrapper d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div className="search-wrapper position-relative">
            <button className="border-0 bg-transparent position-absolute translate-middle-y top-50">
              {SVGICON.app.search}
            </button>
            <input type="text" placeholder="search..." className="form-control" />
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* <FormInput
              name="unit"
              placeholder="Search by unit"
              value=""
              readOnly={true}
            /> */}
            <FormSelect
              name="awardType"
              options={awardTypeOptions}
              value={null}
              placeholder="award type"
            />
            <FormSelect
              name="cyclePeriod"
              options={cyclePeriodOptions}
              value={
                cyclePeriodOptions.find((opt) => opt.value === "citation") ||
                null
              }
              placeholder="cycle period"
            />
          </div>

        </div>
        <div className="table-responsive">
          <table className="table-style-2 w-100">
            <thead>
              <tr>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Application Id</div>
                </th>
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <div className="d-flex align-items-start">Unit ID</div>
                </th>
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <div className="d-flex align-items-start">Final Score</div>
                </th>
                <th style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <div className="d-flex align-items-start">Rank</div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Award Type</div>
                </th>
                <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <div className="d-flex align-items-start">Shortlist</div>
                </th>
                <th style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div className="d-flex align-items-start"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">97</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">1</p>
                </td>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">Citation</p>
                </td>
                <td>
                  <div className="d-flex align-items-center flex-grow-1 gap-2">
                    <input
                      type="checkbox"
                      id={`switch-1`}
                      className="custom-switch"
                      hidden
                    />
                    <label
                      htmlFor={`switch-1`}
                      className="switch-label"
                    ></label>
                  </div>
                </td>
                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div>
                    <Link
                      to="/command-panel/1"
                      className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                    >
                      {SVGICON.app.eye}
                    </Link>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">97</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">1</p>
                </td>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">Citation</p>
                </td>
                <td>
                  <div className="d-flex align-items-center flex-grow-1 gap-2">
                    <input
                      type="checkbox"
                      id={`switch-2`}
                      className="custom-switch"
                      hidden
                    />
                    <label
                      htmlFor={`switch-2`}
                      className="switch-label"
                    ></label>
                  </div>
                </td>
                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div>
                    <Link
                      to="/command-panel/1"
                      className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                    >
                      {SVGICON.app.eye}
                    </Link>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">97</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">1</p>
                </td>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">Citation</p>
                </td>
                <td>
                  <div className="d-flex align-items-center flex-grow-1 gap-2">
                    <input
                      type="checkbox"
                      id={`switch-3`}
                      className="custom-switch"
                      hidden
                    />
                    <label
                      htmlFor={`switch-3`}
                      className="switch-label"
                    ></label>
                  </div>
                </td>
                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div>
                    <Link
                      to="/command-panel/1"
                      className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                    >
                      {SVGICON.app.eye}
                    </Link>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">97</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">1</p>
                </td>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">Citation</p>
                </td>
                <td>
                  <div className="d-flex align-items-center flex-grow-1 gap-2">
                    <input
                      type="checkbox"
                      id={`switch-4`}
                      className="custom-switch"
                      hidden
                    />
                    <label
                      htmlFor={`switch-4`}
                      className="switch-label"
                    ></label>
                  </div>
                </td>
                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div>
                    <Link
                      to="/command-panel/1"
                      className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                    >
                      {SVGICON.app.eye}
                    </Link>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">97</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">1</p>
                </td>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">Citation</p>
                </td>
                <td>
                  <div className="d-flex align-items-center flex-grow-1 gap-2">
                    <input
                      type="checkbox"
                      id={`switch-5`}
                      className="custom-switch"
                      hidden
                    />
                    <label
                      htmlFor={`switch-5`}
                      className="switch-label"
                    ></label>
                  </div>
                </td>
                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div>
                    <Link
                      to="/command-panel/1"
                      className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                    >
                      {SVGICON.app.eye}
                    </Link>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">#123456</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">97</p>
                </td>
                <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                  <p className="fw-4">1</p>
                </td>
                <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                  <p className="fw-4">Citation</p>
                </td>
                <td>
                  <div className="d-flex align-items-center flex-grow-1 gap-2">
                    <input
                      type="checkbox"
                      id={`switch-6`}
                      className="custom-switch"
                      hidden
                    />
                    <label
                      htmlFor={`switch-6`}
                      className="switch-label"
                    ></label>
                  </div>
                </td>
                <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>
                  <div>
                    <Link
                      to="/command-panel/1"
                      className="action-btn bg-transparent d-inline-flex align-items-center justify-content-center"
                    >
                      {SVGICON.app.eye}
                    </Link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>
    </>
  );
};

export default CommandPanel;
