import { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiCalendar, FiChevronDown } from 'react-icons/fi';

const CustomDateInput = forwardRef(({ value, onClick }: any, ref: any) => (
    <button
        onClick={onClick}
        ref={ref}
        className="d-flex align-items-center gap-2 border-0 bg-transparent"
        style={{ fontSize: '14px', color: '#333' }}
    >
        <FiCalendar />
        <span>{value}</span>
        <FiChevronDown />
    </button>
));

const MonthYearSelector = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date as Date)}
            dateFormat="MMM, yyyy"
            showMonthYearPicker
            customInput={<CustomDateInput />}
        />
    );
};

export default MonthYearSelector;
