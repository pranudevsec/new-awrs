import * as Yup from 'yup';

export const LoginSchema = Yup.object().shape({
  user_role: Yup.string().required('Role is required'),
  username: Yup.string()
    .min(3, 'User name must be at least 3 characters')
    .required('User name number is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 4 characters')
    .required('Password is required'),
});

export const SignUpSchema = Yup.object().shape({
  rank: Yup.string().required('Rank is required'),
  name: Yup.string().required('Name is required'),
  user_role: Yup.string().required('Role is required'),
  username: Yup.string()
    .matches(/^[a-z0-9]+$/, 'Username must contain only lowercase letters and numbers, no spaces or special characters')
    .min(3, 'User name must be at least 3 characters')
    .required('User name is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 4 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  // captchaToken: Yup.string().required("Captcha is required"),
});

export const ParametersSchema = Yup.object().shape({
  award_type: Yup.string().required('Award type is required'),
  applicability: Yup.string().required('Applicability is required'),
  name: Yup.string().required('Name is required'),
  category: Yup.string().required('Category is required'),
  subcategory: Yup.string().required('Sub Category is required'),
  subsubcategory: Yup.string().required('Sub Sub Category is required'),
  arms_service: Yup.string().required('Arm Service is required'),
  location: Yup.string().required('Location is required'),
  description: Yup.string().required('Description is required'),
  negative: Yup.boolean().nullable().required('Negative selection is required'),
  per_unit_mark: Yup.number()
    .typeError('Per unit mark must be a number')
    .required('Per unit mark is required'),
  max_marks: Yup.number()
    .typeError('Max marks must be a number')
    .required('Max marks is required'),
  proof_reqd: Yup.boolean().nullable().required('Proof requirement is required'),
  weightage: Yup.number()
    .typeError('Weightage must be a number')
    .required('Weightage is required'),
  param_sequence: Yup.number()
    .typeError('Parameter sequence must be a number')
    .required('Parameter sequence is required'),
  param_mark: Yup.number()
    .typeError('Parameter mark must be a number')
    .required('Parameter mark is required'),
});

export const AdminSettingSchema = Yup.object().shape({
  lastDate: Yup.string().required("Deadline date is required"),
  cycle_period: Yup.array()
    .min(1, "At least one cycle period is required")
    .of(Yup.string().required("Cycle period cannot be empty")),
});

export const CreateCitationSchema = Yup.object().shape({
  date_init: Yup.string()
    .required('Initial date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  citation_fds: Yup.object().shape({
    award_type: Yup.string()
      .required('Award type is required')
      .oneOf(['citation'], 'Only "citation" is allowed'),
    cycle_period: Yup.string()
      .required('Cycle period is required'),
    last_date: Yup.string()
      .required('Last date is required')
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  }),
});

export const ApplyCitationSchema = Yup.object().shape({
  unitRemarks: Yup.string()
    .max(500, "Maximum 500 characters allowed"),
});