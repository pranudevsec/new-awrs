import React, { useState, useEffect } from 'react';

interface ICNumberInputProps {
  label?: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  errors?: string;
  touched?: boolean;
  disabled?: boolean;
  className?: string;
}

const ICNumberInput: React.FC<ICNumberInputProps> = ({
  label,
  name,
  placeholder = "Enter 5 digits and alphabet (e.g., 87878K)",
  value,
  onChange,
  onBlur,
  errors,
  touched,
  disabled = false,
  className = "form-control"
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const [userInput, setUserInput] = useState("");


  useEffect(() => {
    if (value && value.startsWith("IC-")) {
      const userPart = value.substring(3); // Remove "IC-" prefix
      setDisplayValue(userPart);
      setUserInput(userPart);
    } else if (value && !value.startsWith("IC-")) {
      setDisplayValue(value);
      setUserInput(value);
    } else {
      setDisplayValue("");
      setUserInput("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    

    const cleanValue = inputValue.replace(/^IC-/, '');
    

    const regex = /^[0-9]{0,5}[A-Z]?$/;
        
    if (regex.test(cleanValue) || cleanValue === "") {
      setUserInput(cleanValue);

      setDisplayValue(cleanValue);
      const fullValue = `IC-${cleanValue}`;
      onChange(fullValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {

    if (e.key === 'Backspace' && userInput.length === 0) {
      e.preventDefault();
    }
  };

  const handleFocus = () => {

    const input = document.getElementById(name) as HTMLInputElement;
    if (input) {
      input.setSelectionRange(3, input.value.length);
    }
  };

  const hasError = touched && !!errors;
  const inputClass = `${className} ${hasError ? 'is-invalid' : ''}`;

  return (
    <div>
      {label && (
        <label htmlFor={name} className="form-label mb-1">
          {label}
        </label>
      )}
      <div className="position-relative">
        <input
          type="text"
          id={name}
          name={name}
          className={inputClass}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete="off"
          style={{ paddingLeft: '2.5rem' }}
        />
        <span 
          className="position-absolute" 
          style={{ 
            left: '0.75rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#6c757d',
            fontWeight: 'bold'
          }}
        >
          IC-
        </span>
      </div>
      {hasError && <p className="error-text mt-1">{errors}</p>}
      <small className="text-muted">
        Format: IC-XXXXX[A-Z] (e.g., IC-87878K) - Enter exactly 5 digits followed by one alphabet
      </small>
    </div>
  );
};

export default ICNumberInput;
