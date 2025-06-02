import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import { roleOptions } from "../../data/options";
import { LoginSchema } from "../../validations/validations";
import { useAppDispatch } from "../../reduxToolkit/hooks";
import { reqToLogin } from "../../reduxToolkit/services/auth/authService";
import FormInput from "../../components/form/FormInput";
import FormSelect from "../../components/form/FormSelect";

const roleCredentials: Record<string, { username: string; password: string }> = {
    unit: { username: "testuser1", password: "12345678" },
    brigade: { username: "testbrigade", password: "12345678" },
    division: { username: "testdivision", password: "12345678" },
    corps: { username: "testcorps", password: "12345678" },
    command: { username: "testcommand", password: "12345678" },
    admin: { username: "admin", password: "12345678" },
};

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // States 
    const [passwordType, setPasswordType] = useState<string>("password");

    // Formik
    const formik = useFormik({
        initialValues: {
            user_role: "unit",
            username: "testuser1",
            password: "12345678"
        },
        validationSchema: LoginSchema,
        onSubmit: async (values, { resetForm }) => {
            const resultAction = await dispatch(reqToLogin(values));
            const result = unwrapResult(resultAction);
            if (result.success) {
                resetForm();
                setTimeout(() => {
                    if (values.user_role === "admin") {
                        navigate("/admin-settings");
                    } else if (values.user_role === "command") {
                        navigate("/dashboard");
                    } else {
                        navigate("/");
                    }
                }, 400);
            }
        },
    });

    return (
        <div className="auth-section">
            <div className="container-fluid">
                <div className="row min-vh-100 align-items-stretch justify-content-center">
                    <div className="col-xxl-6 col-xl-6 d-xl-block d-none">
                        <div className="auth-image-area d-flex align-items-end h-100">
                            <img src="/media/auth/military.png" alt="Military" className="img-fluid object-fit-contain" />
                        </div>
                    </div>
                    <div className="col-xxl-4 col-xl-5 col-md-10 d-flex align-items-center justify-content-center">
                        <div className="auth-form-wrapper w-100 d-flex flex-column align-items-center justify-content-center">
                            <img src="/media/logo/logo.svg" alt="Logo" className="mb-3 mx-auto" width={110} />
                            <div className="auth-form-area w-100">
                                <h2 className="font-lexend fw-6">Login to your Account</h2>
                                <form onSubmit={formik.handleSubmit}>
                                    <div className="mb-3">
                                        <FormSelect
                                            label="Role"
                                            name="user_role"
                                            options={roleOptions}
                                            value={roleOptions.find((opt) => opt.value === formik.values.user_role) || null}
                                            onChange={(selectedOption) => {
                                                const role = selectedOption?.value || "";
                                                formik.setFieldValue("user_role", role);

                                                if (role in roleCredentials) {
                                                    formik.setFieldValue("username", roleCredentials[role].username);
                                                    formik.setFieldValue("password", roleCredentials[role].password);
                                                } else {
                                                    formik.setFieldValue("username", "");
                                                    formik.setFieldValue("password", "");
                                                }
                                            }}
                                            placeholder="Select"
                                            errors={formik.errors.user_role}
                                            touched={formik.touched.user_role}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <FormInput
                                            label="User Name"
                                            name="username"
                                            placeholder="Enter username"
                                            value={formik.values.username}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            errors={formik.errors.username}
                                            touched={formik.touched.username}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label
                                            htmlFor="password"
                                            className="form-label subtitle_3 text_gray_800 mb-1"
                                        >
                                            Password
                                        </label>
                                        <div className="position-relative">
                                            <input
                                                type={passwordType}
                                                className={`form-control ${formik.errors.password && formik.touched.password ? "invalid" : ""}`}
                                                id="password"
                                                name="password"
                                                autoComplete="off"
                                                placeholder="Enter password"
                                                value={formik.values.password}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            <button
                                                className={`position-absolute top-50 translate-middle border-0 bg-transparent end-0`}
                                                type="button"
                                                onClick={() =>
                                                    setPasswordType((prev) =>
                                                        prev === "password" ? "text" : "password"
                                                    )
                                                }
                                                aria-label="Toggle password visibility"
                                            >
                                                <img
                                                    src={`/media/icons/${passwordType === "password" ? "open-eye" : "close-eye"}.svg`}
                                                    alt="Toggle Password Visibility"
                                                />
                                            </button>
                                        </div>
                                        {formik.errors.password && formik.touched.password && (
                                            <p className="error-text">{formik.errors.password}</p>
                                        )}
                                    </div>
                                    <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                                        <label className="ios-checkbox text-nowrap">
                                            <input type="checkbox" hidden defaultChecked />
                                            <div className="checkbox-wrapper">
                                                <div className="checkbox-bg" />
                                                <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                                    <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                                </svg>
                                            </div>
                                            Remember Me
                                        </label>
                                        <Link to="/forgot-password" className="nav-link fw-6">Forgot Password?</Link>
                                    </div>
                                    <button type="submit" className="border-0 w-100 submit-btn" disabled={formik.isSubmitting}>
                                        {formik.isSubmitting ? (
                                            <span>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Signing in...
                                            </span>
                                        ) : (
                                            "Sign in"
                                        )}
                                    </button>
                                    <p className="sign-up-text mt-4">
                                        Don’t have an account? <Link to="/authentication/sign-up" className="fw-6">Sign up</Link>
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login