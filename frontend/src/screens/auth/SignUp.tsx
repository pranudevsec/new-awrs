import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import { roleOptions } from "../../data/options";
import { SignUpSchema } from "../../validations/validations";
import { reqToSignUp } from "../../reduxToolkit/services/auth/authService";
import { useAppDispatch } from "../../reduxToolkit/hooks";
import FormInput from "../../components/form/FormInput";
import FormSelect from "../../components/form/FormSelect";

const SignUp = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // States 
    const [passwordType, setPasswordType] = useState<string>("password");

    // Formik
    const formik = useFormik({
        initialValues: {
            rank: "",
            name: "",
            user_role: "",
            username: "",
            password: ""
        },
        validationSchema: SignUpSchema,
        onSubmit: async (values, { resetForm }) => {
            const resultAction = await dispatch(reqToSignUp(values));
            const result = unwrapResult(resultAction);
            if (result.success) {
                resetForm();
                setTimeout(() => navigate("/"), 400);
            }
        },
    });

    return (
        <div className="auth-section">
            <div className="container-fluid">
                <div className="row min-vh-100 align-items-stretch justify-content-center">
                    <div className="col-xxl-6 col-xl-6 d-xl-block d-none">
                        <div className="auth-image-area d-flex align-items-end h-100">
                            {/* <img src="/media/auth/military.png" alt="Military" className="img-fluid object-fit-contain" /> */}
                        </div>
                    </div>
                    <div className="col-xxl-4 col-xl-5 col-md-10 d-flex align-items-center justify-content-center">
                        <div className="auth-form-wrapper w-100 d-flex flex-column align-items-center justify-content-center">
                            <img src="/media/logo/logo.svg" alt="Logo" className="mb-3 mx-auto" width={110} />
                            <div className="auth-form-area w-100">
                                <h2 className="font-lexend fw-6">Create an Account</h2>
                                <form onSubmit={formik.handleSubmit}>
                                    <div className="mb-2">
                                        <FormInput
                                            label="Rank"
                                            name="rank"
                                            placeholder="Enter rank"
                                            value={formik.values.rank}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            errors={formik.errors.rank}
                                            touched={formik.touched.rank}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <FormSelect
                                            label="Role"
                                            name="user_role"
                                            options={roleOptions}
                                            value={roleOptions.find((opt) => opt.value === formik.values.user_role) || null}
                                            onChange={(selectedOption) =>
                                                formik.setFieldValue(
                                                    "user_role",
                                                    selectedOption?.value || ""
                                                )
                                            }
                                            placeholder="Select"
                                            errors={formik.errors.user_role}
                                            touched={formik.touched.user_role}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <FormInput
                                            label="Name"
                                            name="name"
                                            placeholder="Enter name"
                                            value={formik.values.name}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            errors={formik.errors.name}
                                            touched={formik.touched.name}
                                        />
                                    </div>
                                    <div className="mb-2">
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
                                    <div className="mb-4">
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
                                    <button type="submit" className="border-0 w-100 submit-btn" disabled={formik.isSubmitting}>
                                        {formik.isSubmitting ? (
                                            <span>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Signing up...
                                            </span>
                                        ) : (
                                            "Sign Up"
                                        )}
                                    </button>
                                    <p className="sign-up-text mt-4">
                                        Already have an account? <Link to="/authentication/sign-in" className="fw-6">Sign In</Link>
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

export default SignUp