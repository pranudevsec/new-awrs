import { type FC, type KeyboardEvent } from "react";

interface TagInputProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value: string[];
  onChange: (tags: string[]) => void;
  onBlur?: () => void;
  error?: string | boolean;
  name?: string;
}

const TagInput: FC<TagInputProps> = ({
  label,
  placeholder = "Type and press enter...",
  disabled = false,
  value,
  onChange,
  onBlur,
  error,
  name,
}) => {
  let input = "";

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    input = target.value;

    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()]);
      }
      target.value = "";
    }
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  };

  return (
    <div className="mb-3">
      {label && <label className="form-label mb-1" htmlFor={name}>{label}</label>}

      <div
        className={`form-control d-flex flex-wrap align-items-center gap-2 tag-input-area ${disabled ? "disabled" : ""
          } ${error ? "is-invalid" : ""}`}
      >
        {value.map((tag, index) => (
          <span className="tag-item" key={tag}>
            {tag}
            {!disabled && (
              <button type="button" className="tag-remove-btn" onClick={() => removeTag(index)}>
                &times;
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            type="text"
            name={name}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            className="tag-input-field"
          />
        )}
      </div>

      {error && typeof error === "string" && (
        <div className="invalid-feedback d-block">{error}</div>
      )}
    </div>
  );
};

export default TagInput;
