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

const roles = ['brigade', 'division', 'corps', 'command'];

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const getParamMarks = (parameters: any[], paramName: string) => {
  return parameters.find((p) =>
    p.name?.toLowerCase()?.includes(paramName.toLowerCase())
  )?.marks ?? '';
};

const getGraceMarks = (graceMarks: any[]) => {
  return roles.reduce((acc: Record<string, number | string>, role) => {
    acc[`Points by ${capitalize(role)}`] =
      graceMarks.find((g) => g.role === role)?.marks ?? '';
    return acc;
  }, {});
};

const getPriorities = (priorities: any[]) => {
  const roleBased = roles.reduce((acc: Record<string, number | string>, role) => {
    acc[`${capitalize(role)} Priority`] =
      priorities.find((p) => p.role === role)?.priority ?? '';
    return acc;
  }, {});

  return {
    ...roleBased,
    MO_priority: priorities.find((p) => p.cw2_type === 'mo')?.priority ?? '',
    OL_priority: priorities.find((p) => p.cw2_type === 'ol')?.priority ?? '',
  };
};

const prepareExcelData = (scoreboard: any[], topN: number) => {
  const sorted = [...scoreboard].sort((a, b) => b.total_marks - a.total_marks);
  const topCandidates = sorted.slice(0, topN);

  return topCandidates.map((candidate, index) => {
    const parameters = candidate.fds?.parameters ?? [];
    const graceMarks = candidate.fds?.applicationGraceMarks ?? [];
    const priorities = candidate.fds?.applicationPriority ?? [];

    return {
      'S. No.': index + 1,
      Unit: candidate.unit_name ?? '',
      Location: candidate.location ?? '',
      Brigade: candidate.bde ?? '',
      Division: candidate.div ?? '',
      Corps: candidate.corps ?? '',
      Command: candidate.comd ?? '',
      'Unit Type': candidate.unit_type ?? '',
      Tenure: getParamMarks(parameters, 'tenure'),
      Kills: getParamMarks(parameters, 'kills'),
      Surrendered: getParamMarks(parameters, 'surrendered'),
      'Radioset Recovery': getParamMarks(parameters, 'radioset'),
      'Pistol Recovery': getParamMarks(parameters, 'pistol'),
      '(-ve Marks)': candidate.totalNegativeMarks ?? 0,
      ...getGraceMarks(graceMarks),
      'Total Marks': candidate.total_marks ?? 0,
      ...getPriorities(priorities),
      'MO Remarks': '',
      'OL Remarks': '',
    };
  });
};

const TopCandidates: React.FC<TopCandidatesProps> = ({ setReportCount, reportCount }) => {
  const { scoreboard } = useAppSelector((state) => state.commandPanel);

  // States
  const [selectedTop, setSelectedTop] = useState(() => {
    return topCandidateOptions.find((opt: any) => opt.value === reportCount) ?? topCandidateOptions[1];
  });

  useEffect(() => {
    const matchedOption = topCandidateOptions.find((opt: any) => opt.value === reportCount);
    if (matchedOption) setSelectedTop(matchedOption);
  }, [reportCount]);

  const handleDownload = () => {
    const topN = selectedTop?.value ?? 5;
    try {
      const excelData = prepareExcelData(scoreboard, topN);
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Candidates');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

      saveAs(data, `Top_${topN}_Candidates_Scoreboard.xlsx`);
    } catch (error) {
      console.error('Excel generation failed:', error);
    }
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