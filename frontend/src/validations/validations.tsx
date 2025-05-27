import * as Yup from 'yup';

export const LoginSchema = Yup.object().shape({
    user_role: Yup.string().required('Role is required'),
    username: Yup.string()
        .min(3, 'User name must be at least 3 characters')
        .required('User name number is required'),
    password: Yup.string()
        .min(4, 'Password must be at least 4 characters')
        .required('Password is required'),
});

export const SignUpSchema = Yup.object().shape({
    rank: Yup.string().required('Rank is required'),
    name: Yup.string().required('Name is required'),
    user_role: Yup.string().required('Role is required'),
    username: Yup.string()
        .min(3, 'User name must be at least 3 characters')
        .required('User name is required'),
    password: Yup.string()
        .min(4, 'Password must be at least 4 characters')
        .required('Password is required'),
});

export const ProfileSettingSchema = Yup.object().shape({
    unit: Yup.string().required("Unit is required"),
    brigade: Yup.string().required("Brigade is required"),
    divison: Yup.string().required("Divison is required"),
    corps: Yup.string().required("Corps is required"),
    command: Yup.string().required("Command is required"),
});

export const ParametersSchema = Yup.object().shape({
    award_type: Yup.string().required('Award type is required'),
    applicability: Yup.string().required('Applicability is required'),
    name: Yup.string().required('Name is required'),
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