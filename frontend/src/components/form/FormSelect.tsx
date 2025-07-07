import { Fragment, type FC } from 'react';
import Select, { type MenuPlacement } from 'react-select';
import CustomStyles from './components/CustomStyles';

interface FormSelectProps {
    label?: string;
    name: string;
    options: OptionType[];
    value: any;
    onChange?: (option: OptionType | null) => void;
    errors?: string;
    touched?: boolean;
    placeholder?: string;
    isDisabled?: boolean
    menuPlacement?: MenuPlacement;
    isMulti?: boolean;
}

const FormSelect: FC<FormSelectProps> = ({
    label,
    name,
    options,
    value,
    onChange,
    placeholder = 'Select',
    errors,
    touched,
    isDisabled = false,
    menuPlacement = "bottom",
    isMulti = false
}) => {
    const isInvalid = !!(touched && errors);

    return (
        <Fragment>
            {label && (
                <label htmlFor={name} className="form-label mb-1">
                    {label}
                </label>
            )}
            <Select
                options={options}
                value={value}
                onChange={onChange}
                styles={CustomStyles(isInvalid)}
                placeholder={placeholder}
                isDisabled={isDisabled}
                menuPlacement={menuPlacement}
                isMulti={isMulti}
            />
            {isInvalid && <p className="error-text">{errors}</p>}
        </Fragment>
    );
};

export default FormSelect;
