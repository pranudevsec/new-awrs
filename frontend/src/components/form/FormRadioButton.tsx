interface FormRadioButtonProps {
    id: string;
    name: string;
    value: string | boolean;
    checked: boolean;
    onChange?: (value: string | boolean) => void;
    label: string;
}

const FormRadioButton: React.FC<FormRadioButtonProps> = ({ id, name, value, checked, onChange, label }) => {
    return (
        <div>
            <input
                type="radio"
                id={id}
                value={String(value)}
                name={name}
                className="custom-radio-btn"
                checked={checked}
                onChange={() => onChange?.(value)}
            />
            <label htmlFor={id} className="form-label">
                {label}
            </label>
        </div>
    );
};

export default FormRadioButton;
