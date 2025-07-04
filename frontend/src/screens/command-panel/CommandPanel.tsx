import { useEffect, useState } from "react";
import { Link, useNavigate, } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { SVGICON } from "../../constants/iconsList";
import { awardTypeOptions } from "../../data/options";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { getScoreBoards } from "../../reduxToolkit/services/command-panel/commandPanelService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../components/form/FormSelect";
import Pagination from "../../components/ui/pagination/Pagination";
import EmptyTable from "../../components/ui/empty-table/EmptyTable";
import Loader from "../../components/ui/loader/Loader";
import { updateCitation } from "../../reduxToolkit/services/citation/citationService";
import { updateAppreciation } from "../../reduxToolkit/services/appreciation/appreciationService";

const CommandPanel = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { loading, scoreboard, meta } = useAppSelector((state) => state.commandPanel);

  // States
  const [awardType, setAwardType] = useState<string | null>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const handleDownload = () => {
    const topN = 5;
  
    const topCandidates = [...scoreboard]
      .sort((a, b) => b.total_marks - a.total_marks)
      .slice(0, topN);
  
    const excelData = topCandidates.map((candidate: any, index) => {
      const parameters = candidate.fds?.parameters || [];
      const graceMarks = candidate.fds?.applicationGraceMarks || [];
      const priorities = candidate.fds?.applicationPriority || [];
  
      const getParamMarks = (paramName: string) => {
        return (
          parameters.find((p: any) =>
            p.name.toLowerCase().includes(paramName.toLowerCase())
          )?.marks ?? ""
        );
      };
  
      // Roles to extract
      const roles = ["brigade", "division", "corps", "command"];
  
      const graceMarksByRole = roles.reduce((acc: any, role) => {
        acc[`Points by ${capitalize(role)}`] =
          graceMarks.find((g: any) => g.role === role)?.marks ?? "";
        return acc;
      }, {});
  
      const prioritiesByRole = roles.reduce((acc: any, role) => {
        acc[`${capitalize(role)} Priority`] =
          priorities.find((p: any) => p.role === role)?.priority ?? "";
        return acc;
      }, {});
  
      return {
        "S. No.": index + 1,
        "Unit": candidate.unit_name || "",
        "Location": candidate.location || "",
        "Brigade": candidate.bde || "",
        "Division": candidate.div || "",
        "Corps": candidate.corps || "",
        "Command": candidate.comd || "",
        "Unit Type": candidate.unit_type || "",
        "Tenure": getParamMarks("tenure"),
        "Kills": getParamMarks("kills"),
        "Surrendered": getParamMarks("surrendered"),
        "Radioset Recovery": getParamMarks("radioset"),
        "Pistol Recovery": getParamMarks("pistol"),
        "(-ve Marks)": candidate.totalNegativeMarks ?? 0,
        ...graceMarksByRole,
        "Total Marks": candidate.total_marks ?? 0,
        ...prioritiesByRole,
      };
    });
  
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Top Candidates");
  
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
  
    const data = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(data, `Top_5_Candidates_Scoreboard.xlsx`);
  };
  
  // Capitalize helper
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Get Scoreboard list function
  const fetchScoreboardList = async () => {
    await dispatch(getScoreBoards({ award_type: awardType || "", search: debouncedSearch, page, limit }));
  };

  useEffect(() => {
    fetchScoreboardList();
  }, [awardType, debouncedSearch, page, limit])


const handleShortlistToggle = (item: any) => {
  const updatedPayload = {
    id: item.id,
    isShortlisted: !item.isShortlisted,
  };

  if (item.type === "citation") {
    dispatch(updateCitation(updatedPayload));
  } else if (item.type === "appreciation") {
    dispatch(updateAppreciation(updatedPayload));
  }
  fetchScoreboardList();
};

  return (
    <>
      <div className="clarification-section">
        <div className="d-flex flex-sm-row flex-column justify-content-between mb-4">
          <Breadcrumb title="Scoreboard Listing" />
          <div className="d-flex align-items-center justify-content-end gap-3 mt-sm-0 mt-3">
            <button
              className="_btn outline d-flex align-items-center justify-content-center gap-2"
              onClick={handleDownload}
            >
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
            <input
              type="text"
              placeholder="search..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
              value={awardTypeOptions.find((opt) => opt.value === awardType) || null}
              onChange={(option) => setAwardType(option?.value || null)}
              placeholder="Award Type"
            />
            {/* <FormSelect
              name="cyclePeriod"
              options={cyclePeriodOptions}
              value={
                cyclePeriodOptions.find((opt) => opt.value === "citation") ||
                null
              }
              placeholder="Cycle period"
            /> */}
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
              {loading ?
                <tr>
                  <td colSpan={7}>
                    <div className="d-flex justify-content-center py-5">
                      <Loader inline size={40} />
                    </div>
                  </td>
                </tr> :
                scoreboard.map((item, idx) => (
                  <tr onClick={() => navigate(`/command-panel/${item.id}?award_type=${item.type}`)} key={idx}>
                    <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                      <p className="fw-4">#{item.id || "-"}</p>
                    </td>
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">#{item.unit_id || "-"}</p>
                    </td>
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                      <p className="fw-4">{item.total_marks || 0}</p>
                    </td>
                    <td style={{ width: 150, minWidth: 150, maxWidth: 150 }}>
                    <p className="fw-4">
    {
      item.fds?.applicationPriority?.find((p:any) => p.role?.toLowerCase() === 'command')?.priority ?? '-'
    }
  </p>
                    </td>
                    <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                      <p className="fw-4">{item.type || "-"}</p>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
  <div className="d-flex align-items-center flex-grow-1 gap-2">
    <input
      type="checkbox"
      id={`switch-${item.id}`}
      className="custom-switch"
      hidden
      checked={item.isshortlisted}
      onChange={() => handleShortlistToggle(item)}
    />
    <label
      htmlFor={`switch-${item.id}`}
      className="switch-label"
    ></label>
  </div>
</td>
                    <td style={{ width: 100, minWidth: 100, maxWidth: 100 }} >
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
                ))
              }
            </tbody>
          </table>
        </div>
        {/* Empty Data */}
        {!loading && scoreboard.length === 0 && <EmptyTable />}

        {/* Pagination */}
        {scoreboard.length > 0 && (
          <Pagination
            meta={meta}
            page={page}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
          />
        )}
      </div>
    </>
  );
};

export default CommandPanel;
