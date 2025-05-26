import { useState } from "react";
// import { SVGICON } from "../../constants/iconsList";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import Pagination from "../../components/ui/pagination/Pagination";
import WinnersCanvas from "./offcanvas/WinnersCanvas";
import FormSelect from "../../components/form/FormSelect";
import FormInput from "../../components/form/FormInput";

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

const Winners = () => {
    // States
    const [filterVisible, setFilterVisible] = useState(false);

    return (
        <>
            <div className="clarification-section">
                <div className="d-flex flex-sm-row flex-column justify-content-between mb-4">
                    <Breadcrumb title="Last Year Winners" />
                    {/* <button className="filter-btn d-inline-flex align-items-center justify-content-center gap-1 border-0 mt-sm-0 mt-3" onClick={() => setFilterVisible(true)}>
                        <span className="rotate-90">{SVGICON.app.filters}</span>Filters
                    </button> */}
                </div>
                <div className="table-filter-area mb-4">
                    <div className="row">
                        <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
                            <FormSelect
                                label="Award Type"
                                name="awardType"
                                options={awardTypeOptions}
                                value={awardTypeOptions.find((opt) => opt.value === "citation") || null}
                                placeholder="Select award type"
                                isDisabled={true}
                            />
                        </div>
                        <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
                            <FormSelect
                                label="Cycle Period"
                                name="cyclePeriod"
                                options={cyclePeriodOptions}
                                value={cyclePeriodOptions.find((opt) => opt.value === "citation") || null}
                                placeholder="Select award type"
                            />
                        </div>
                        <div className="col-lg-3 col-sm-4">
                            <FormInput
                                label="Unit"
                                name="lastDate"
                                placeholder="Enter unit"
                                value=""
                                readOnly={true}
                            />
                        </div>
                    </div>
                </div>
                {/* <div className="filters-fields-area">
                    <div className="row align-items-center justify-content-between row-gap-2">
                        <div className="col-md-4">
                            <FormInput
                                label="Units"
                                name="units"
                                placeholder="Enter units"
                                value=""
                                readOnly={true}
                            />
                        </div>
                        <div className="col-md-4">
                            <FormSelect
                                label="Award Type"
                                name="awardType"
                                options={awardTypeOptions}
                                value={awardTypeOptions.find((opt) => opt.value === "citation") || null}
                                placeholder="Select award type"
                                isDisabled={true}
                            />
                        </div>
                        <div className="col-md-4">
                            <FormInput
                                label="Cycle Period"
                                name="cyclePeriod"
                                placeholder="Enter cycle period"
                                type="text"
                                value="2024 - H1"
                            />
                        </div>
                    </div>
                </div> */}
                {/* <div className="filter-wrapper d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="search-wrapper position-relative">
                    <button className="border-0 bg-transparent position-absolute translate-middle-y top-50">{SVGICON.app.search}</button>
                    <input type="text" placeholder="search..." className="form-control" />
                </div>
            </div> */}
                <div className="table-responsive">
                    <table className="main-table w-100">
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
                            </tr>
                        </tbody>
                    </table>
                </div>
                <Pagination />
            </div>
            <WinnersCanvas show={filterVisible} handleClose={() => setFilterVisible(false)} />
        </>
    )
}

export default Winners