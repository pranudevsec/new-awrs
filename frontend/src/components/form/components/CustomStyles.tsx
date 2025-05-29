const CustomStyles = (isInvalid: boolean) => ({
  control: (provided: any, state: { isFocused: boolean, isDisabled: boolean }) => ({
    ...provided,
    borderRadius: '6px',
    border: isInvalid ? '2px solid var(--red-default)' : '2px solid var(--muted)',
    boxShadow: 'none',
    minHeight: '47px',
    padding: "0 8px",
    fontSize: "14px",
    fontWeight: "400",
    opacity: state.isDisabled ? 0.5 : 1,
    cursor: state.isDisabled ? 'default' : 'pointer',
    backgroundColor: state.isDisabled ? 'transparent' : 'transparent',
    color: "var(--gray-900)",
    '&:hover': {
      borderColor: state.isFocused ? 'var(--muted)' : isInvalid ? 'red' : 'var(--muted)',
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: '6px',
    padding: '2px 6px',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  }),
  option: (provided: any, state: { isFocused: boolean; isSelected: boolean }) => ({
    ...provided,
    backgroundColor: state.isSelected ? 'transparent' : state.isFocused ? 'var(--gray-100)' : 'transparent',
    fontSize: "14px",
    fontWeight: "400",
    color: "var(--gray-900)",
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: 'transparent',
    },
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "var(--gray-900)",
    fontSize: "14px",
    fontWeight: "400",
  }),
});

export default CustomStyles;
