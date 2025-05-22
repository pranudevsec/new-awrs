import { Fragment, type FC } from "react";

interface FormInputProps {
    label?: string;
    name: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    errors?: string;
    touched?: boolean;
    disabled?: boolean;
    isBorder?: string;
    as?: "input" | "textarea";
    rows?: number;
    readOnly?: boolean
}

const FormInput: FC<FormInputProps> = ({
    label,
    name,
    type = "text",
    placeholder = "",
    value,
    onChange,
    onBlur,
    errors,
    touched,
    disabled,
    isBorder = "invalid",
    as = "input",
    rows = 4,
    readOnly = false
}) => {
    const hasError = touched && !!errors;
    const inputClass = `form-control ${hasError ? isBorder : ""}`;

    return (
        <Fragment>
            {label && (
                <label htmlFor={name} className="form-label mb-1">
                    {label}
                </label>
            )}
            {as === "textarea" ? (
                <textarea
                    id={name}
                    name={name}
                    className={inputClass}
                    placeholder={placeholder}
                    rows={rows}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    readOnly={readOnly}
                    autoComplete="off"
                />
            ) : (
                <input
                    type={type}
                    id={name}
                    name={name}
                    className={inputClass}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    autoComplete="off"
                    readOnly={readOnly}
                />
            )}
            {hasError && <p className="error-text">{errors}</p>}
        </Fragment>
    );
};

export default FormInput;