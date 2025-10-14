import React, { useState, useEffect } from 'react';
import { validateApprovedMarks, getEffectiveMaxMarks, getMaxMarksDisplayText } from '../../utils/approvedMarksValidation';

interface ApprovedMarksInputProps {
  value: string | number;
  onChange: (value: string) => void;
  originalMarks: string | number;
  maxMarks: string | number;
  parameterName: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const ApprovedMarksInput: React.FC<ApprovedMarksInputProps> = ({
  value,
  onChange,
  originalMarks,
  maxMarks,
  parameterName,
  disabled = false,
  className = "form-control",
  placeholder = "Enter approved marks"
}) => {
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);
  const [showValidation, setShowValidation] = useState<boolean>(false);


  useEffect(() => {
    if (value && value.toString().trim() !== "") {
      const validation = validateApprovedMarks(value, originalMarks, maxMarks);
      setIsValid(validation.isValid);
      setValidationMessage(validation.message || "");
      setShowValidation(true);
    } else {
      setIsValid(true);
      setValidationMessage("");
      setShowValidation(false);
    }
  }, [value, originalMarks, maxMarks]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleBlur = () => {
    setShowValidation(true);
  };

  const handleFocus = () => {
    setShowValidation(false);
  };


  const effectiveMax = getEffectiveMaxMarks(originalMarks, maxMarks);
  const maxDisplayText = getMaxMarksDisplayText(originalMarks, maxMarks);

  return (
    <div className="approved-marks-input-wrapper">
      <input
        type="number"
        className={`${className} ${!isValid && showValidation ? 'is-invalid' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={disabled}
        min="0"
        max={effectiveMax}
        step="0.01"
      />
      
      {/* Max marks info - same format as citation/appreciation */}
      <div className="mt-1">
        <small className="text-muted">
          {maxDisplayText}
        </small>
      </div>
      
      {/* Validation message */}
      {showValidation && validationMessage && (
        <div className={`mt-1 ${isValid ? 'text-success' : 'text-danger'}`}>
          <small>{validationMessage}</small>
        </div>
      )}
      
      {/* Parameter info */}
      <div className="mt-1">
        <small className="text-info">
          Parameter: {parameterName}
        </small>
      </div>
    </div>
  );
};

export default ApprovedMarksInput;
