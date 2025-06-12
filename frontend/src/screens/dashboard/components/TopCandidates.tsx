import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import FormSelect from '../../../components/form/FormSelect';
import { useAppSelector } from '../../../reduxToolkit/hooks';

const topCandidateOptions: any = [
  { value: 3, label: 'Top 3' },
  { value: 5, label: 'Top 5' },
  { value: 10, label: 'Top 10' },
  { value: 20, label: 'Top 20' },
];

interface TopCandidatesProps {
  reportCount: number;
  setReportCount: React.Dispatch<React.SetStateAction<number>>;
}

const TopCandidates: React.FC<TopCandidatesProps> = ({ setReportCount, reportCount }) => {
  const { scoreboard } = useAppSelector((state) => state.commandPanel);

  // States
  const [selectedTop, setSelectedTop] = useState(() => {
    return topCandidateOptions.find((opt: any) => opt.value === reportCount) || topCandidateOptions[1];
  });

  useEffect(() => {
    const matchedOption = topCandidateOptions.find((opt: any) => opt.value === reportCount);
    if (matchedOption) setSelectedTop(matchedOption);
  }, [reportCount]);

  // const handleDownload = () => {
  //   const topN = selectedTop?.value || 5;

  //   try {
  //     const topCandidates = [...scoreboard]
  //       .sort((a: any, b: any) => b.total_marks - a.total_marks)
  //       .slice(0, topN);

  //     const excelData = topCandidates.map((candidate: any, index: number) => {
  //       const parameters = candidate.fds?.parameters || [];

  //       const paramColumns: Record<string, number | string> = {};
  //       parameters.forEach((param: any) => {
  //         paramColumns[param.name] = param.marks ?? '';
  //       });

  //       return {
  //         "Serial No": index + 1,
  //         "Uni": candidate.unit_name || "",
  //         "LoC": candidate.location || "",
  //         "Brigade": candidate.bde || "",
  //         "Div": candidate.div || "",
  //         "Corp": candidate.corps || "",
  //         "Command": candidate.comd || "",
  //         ...paramColumns,
  //         "Brigade Ranking": "",
  //         "Div Ranking": "",
  //         "Corp Ranking": "",
  //         "Command Priority": "",
  //         "MO Ranking": "",
  //         "MO Remarks": "",
  //         "OL Remarks": "",
  //       };
  //     });

  //     const worksheet = XLSX.utils.json_to_sheet(excelData);
  //     const workbook = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Candidates');

  //     const excelBuffer = XLSX.write(workbook, {
  //       bookType: 'xlsx',
  //       type: 'array',
  //     });

  //     const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  //     saveAs(data, `Top_${topN}_Candidates_Report.xlsx`);
  //   } catch (error) {
  //     console.error("Failed to generate Excel from scoreboard:", error);
  //   }
  // };

  const handleDownload = () => {
    const topN = selectedTop?.value || 5;

    let excelData: any[] = [];

    if (scoreboard.length > 0) {
      const topCandidates = [...scoreboard]
        .sort((a: any, b: any) => b.total_marks - a.total_marks)
        .slice(0, topN);

      excelData = topCandidates.map((candidate: any, index: number) => {
        const parameters = candidate.fds?.parameters || [];

        const paramColumns: Record<string, number | string> = {};
        parameters.forEach((param: any) => {
          paramColumns[param.name] = param.marks ?? '';
        });

        return {
          "Serial No": index + 1,
          "Uni": candidate.unit_name || "",
          "LoC": candidate.location || "",
          "Brigade": candidate.bde || "",
          "Div": candidate.div || "",
          "Corp": candidate.corps || "",
          "Command": candidate.comd || "",
          ...paramColumns,
          "Brigade Ranking": "",
          "Div Ranking": "",
          "Corp Ranking": "",
          "Command Priority": "",
          "MO Ranking": "",
          "MO Remarks": "",
          "OL Remarks": "",
        };
      });
    } else {
      excelData = [
        {
          "Serial No": "",
          "Uni": "",
          "LoC": "",
          "Brigade": "",
          "Div": "",
          "Corp": "",
          "Command": "",
          "Brigade Ranking": "",
          "Div Ranking": "",
          "Corp Ranking": "",
          "Command Priority": "",
          "MO Ranking": "",
          "MO Remarks": "",
          "OL Remarks": "",
        }
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Candidates');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `Top_${topN}_Candidates_Report.xlsx`);
  };

  const handleCandidateChange = (option: any) => {
    setSelectedTop(option);
    setReportCount(option.value);
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
            onChange={(option) => handleCandidateChange(option)}
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

