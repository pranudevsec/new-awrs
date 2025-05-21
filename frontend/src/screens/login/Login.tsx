import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"
import { useFormik } from "formik";
// import { unwrapResult } from "@reduxjs/toolkit";
import { LoginSchema } from "../../validations/validations";
// import { useAppDispatch } from "../../reduxToolkit/hooks";
// import { reqToLogin } from "../../reduxToolkit/services/auth/authService";

const Login = () => {
    const navigate = useNavigate();
    // const dispatch = useAppDispatch();

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
        onSubmit: () => {
            setTimeout(() => navigate("/applications"), 400);
        }
        // onSubmit: async (values, { resetForm }) => {
        //     const resultAction = await dispatch(reqToLogin(values));
        //     const result = unwrapResult(resultAction);
        //     if (result.success) {
        //         resetForm();
        //         setTimeout(() => navigate("/"), 400);
        //     }
        // },
    });

    return (
        <div className="auth-section min-vh-100">
            <div className="container-fluid h-100">
                <div className="row align-items-center justify-content-center h-100">
                    <div className="col-xxl-7 col-lg-6 d-lg-block d-none h-100">
                        <div className="auth-image-area d-flex align-items-end justify-content-center">
                            <img src="/media/auth/military.png" alt="Military" className="img-fluid" />
                        </div>
                    </div>
                    <div className="col-xxl-5 col-lg-6 col-md-10">
                        <div className="auth-form-area">
                            <img src="/media/logo/logo-text.svg" alt="Logo" className="mb-4" />
                            <h2 className="font-lexend fw-6 mb-3">Welcome back! Please Sign in to continue.</h2>
                            <form onSubmit={formik.handleSubmit}>
                                <div className="mb-3">
                                    <label
                                        htmlFor="user_role"
                                        className="form-label mb-1"
                                    >
                                        Role
                                    </label>
                                    <select name="user_role" id="user_role" className={`form-select ${formik.errors.user_role && formik.touched.user_role ? "invalid" : ""}`}>
                                        <option value="unit">Unit</option>
                                        <option value="brigade">Brigade</option>
                                        <option value="divison">Divison</option>
                                        <option value="corps">Corps</option>
                                        <option value="command">Command</option>
                                    </select>
                                    {/* <input
                                        type="text"
                                        className={`form-control ${formik.errors.user_role && formik.touched.user_role ? "invalid" : ""}`}
                                        id="user_role"
                                        name="user_role"
                                        placeholder="Enter role"
                                        autoComplete="off"
                                        value={formik.values.user_role}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    /> */}
                                    {formik.errors.user_role && formik.touched.user_role && (
                                        <p className="error-text">{formik.errors.user_role}</p>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <label
                                        htmlFor="username"
                                        className="form-label mb-1"
                                    >
                                        Service Number / ID
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-control ${formik.errors.username && formik.touched.username ? "invalid" : ""}`}
                                        id="username"
                                        name="username"
                                        placeholder="Enter service number / ID"
                                        autoComplete="off"
                                        value={formik.values.username}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    {formik.errors.username && formik.touched.username && (
                                        <p className="error-text">{formik.errors.username}</p>
                                    )}
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
                                <div className="mb-4 d-flex align-items-center justify-content-between gap-2">
                                    <label className="ios-checkbox">
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
                                <button type="submit" className="border-0 w-100 submit-btn">
                                    Sign in
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login