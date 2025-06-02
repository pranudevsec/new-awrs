import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import FormSelect from '../../../components/form/FormSelect';

const topCandidateOptions: any = [
  { value: 3, label: 'Top 3' },
  { value: 5, label: 'Top 5' },
  { value: 10, label: 'Top 10' },
  { value: 20, label: 'Top 20' },
];

const mockCandidateData = [
  {
    unit_name: 'Unit 1',
    brigade: 'Brigade A',
    div: 'Div 1',
    corps: 'Corps X',
    application_id: 'APP1001',
    total_score: 89,
    parameter_1: 30,
    parameter_2: 29,
    parameter_3: 30,
  },
  {
    unit_name: 'Unit 2',
    brigade: 'Brigade B',
    div: 'Div 1',
    corps: 'Corps Y',
    application_id: 'APP1002',
    total_score: 85,
    parameter_1: 28,
    parameter_2: 27,
    parameter_3: 30,
  },
];

const TopCandidates = () => {
  const [selectedTop, setSelectedTop] = useState(topCandidateOptions[1]);

  const handleDownload = () => {
    const topN = selectedTop?.value || 5;

    // Sort and get top N candidates
    const topCandidates = mockCandidateData
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, topN);

    const worksheet = XLSX.utils.json_to_sheet(topCandidates);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Candidates');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `Top_${topN}_Candidates_Report.xlsx`);
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
