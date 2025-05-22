import * as Yup from 'yup';

export const LoginSchema = Yup.object().shape({
    user_role: Yup.string().required('Role is required'),
    username: Yup.string()
        .min(3, 'Service number must be at least 3 characters')
        .required('Service number is required'),
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
