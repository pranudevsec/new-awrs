import React, { useState, useEffect } from 'react';
import { calculateApprovedMarks,  getMaxMarksDisplayText } from '../../utils/approvedMarksValidation';

interface ApprovedCountAndMarksInputProps {
  approvedCount: string | number;
  approvedMarks: string | number;
  onCountChange: (value: string) => void;
  onMarksChange: (value: string) => void;
  perUnitMark: number;
  maxMarks: number;
  parameterName: string;
  disabled?: boolean;
  className?: string;
}

const ApprovedCountAndMarksInput: React.FC<ApprovedCountAndMarksInputProps> = ({
  approvedCount,
  approvedMarks,
  onCountChange,
  onMarksChange,
  perUnitMark,
  maxMarks,
  parameterName,
  disabled = false,
  className = "form-control"
}) => {
  const [countValidation, setCountValidation] = useState<string>("");
  const [marksValidation, setMarksValidation] = useState<string>("");


  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    

    if (!/^\d*$/.test(value)) return;
    
    onCountChange(value);
    

    const countNum = value === "" ? 0 : Number(value);
    const calculatedMarks = calculateApprovedMarks(countNum, perUnitMark, maxMarks);
    onMarksChange(calculatedMarks.toString());
  };


  const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onMarksChange(value);
  };


  useEffect(() => {
    const count = Number(approvedCount) || 0;
    if (count < 0) {
      setCountValidation("Count must be non-negative");
    } else {
      setCountValidation("");
    }
  }, [approvedCount]);


  useEffect(() => {
    const marks = Number(approvedMarks) || 0;
    const max = Number(maxMarks) || 0;
    
    if (marks > max) {
      setMarksValidation(`Marks (${marks}) exceed maximum (${max})`);
    } else {
      setMarksValidation("");
    }
  }, [approvedMarks, maxMarks]);

  const maxDisplayText = getMaxMarksDisplayText(approvedMarks, maxMarks);

  return (
    <div className="approved-count-marks-wrapper">
      {/* Approved Count Input */}
      <div className="mb-2">
        <input
          type="number"
          className={`${className} ${countValidation ? 'is-invalid' : ''}`}
          placeholder="Enter approved count"
          value={approvedCount}
          onChange={handleCountChange}
          disabled={disabled}
          min="0"
        />
        {countValidation && (
          <div className="text-danger mt-1">
            <small>{countValidation}</small>
          </div>
        )}
      </div>

      {/* Approved Marks Input (calculated automatically) */}
      <div className="mb-2">
        <input
          type="number"
          className={`${className} ${marksValidation ? 'is-invalid' : ''}`}
          placeholder="Approved marks (auto-calculated)"
          value={approvedMarks}
          onChange={handleMarksChange}
          disabled={disabled}
          min="0"
          max={maxMarks}
          step="0.01"
        />
        {marksValidation && (
          <div className="text-danger mt-1">
            <small>{marksValidation}</small>
          </div>
        )}
      </div>
      
      {/* Max marks info - same format as citation/appreciation */}
      <div className="mt-1">
        <small className="text-muted">
          {maxDisplayText}
        </small>
      </div>
      
      {/* Parameter info */}
      <div className="mt-1">
        <small className="text-info">
          Parameter: {parameterName} | 1 unit = {perUnitMark} marks
        </small>
      </div>
    </div>
  );
};

export default ApprovedCountAndMarksInput;
