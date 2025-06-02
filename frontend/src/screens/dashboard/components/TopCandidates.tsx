import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import FormSelect from '../../../components/form/FormSelect';
import { useAppDispatch } from '../../../reduxToolkit/hooks';
import { getScoreBoards } from '../../../reduxToolkit/services/command-panel/commandPanelService';

const topCandidateOptions: any = [
  { value: 3, label: 'Top 3' },
  { value: 5, label: 'Top 5' },
  { value: 10, label: 'Top 10' },
  { value: 20, label: 'Top 20' },
];

const TopCandidates = () => {
  const [selectedTop, setSelectedTop] = useState(topCandidateOptions[1]);
  const dispatch = useAppDispatch();

  const handleDownload = async () => {
    const topN = selectedTop?.value || 5;
  
    try {
      const topCandidates = await fetchTopScoreboards(topN);
  
      // Prepare Excel-ready data
      const excelData = topCandidates.map((item: any) => {
        const paramData = item.fds.parameters.reduce((acc: any, param: any) => {
          acc[param.name] = param.marks || 0;
          return acc;
        }, {});
  
        return {
          Unit: item.unit_name || "",
          Brigade: item.brigade || "",
          Division: item.div || "",
          Corps: item.corps || "",
          ApplicationID: item.application_id || "",
          TotalMarks: item.total_marks || 0,
          ...paramData, // spread dynamic parameter columns
        };
      });
  
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Candidates');
  
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
  
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `Top_${topN}_Candidates_Report.xlsx`);
    } catch (error) {
      console.error("Failed to fetch top candidates:", error);
      // Optionally show toast or alert
    }
  };
  

  const fetchTopScoreboards = async (topN: number) => {
    const response = await dispatch(
      getScoreBoards({ awardType:  "", search: "", page: 1, limit: topN })
    ).unwrap();
    return response?.data || [];
  };
  return (
    <div className="unit-score-chart h-100">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h2 className="fw-6">Export Top Candidates</h2>
        <div className="mt-5 d-flex flex-column gap-3">
          <FormSelect
            name="topCandidates"
            options={topCandidateOptions}
            value={selectedTop}
            placeholder="Select"
            onChange={(option: any) => setSelectedTop(option)}
          />
          <button
            type="button"
            className="_btn _btn-lg primary w-100"
            onClick={handleDownload}
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopCandidates;

