import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import { ParametersSchema } from "../../validations/validations";
import { useAppDispatch } from "../../reduxToolkit/hooks";
import { updateParameter } from "../../reduxToolkit/services/parameter/parameterService";
import { awardTypeOptions, parameterArmService, roleOptions2 } from "../../data/options";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormInput from "../../components/form/FormInput";
import FormSelect from "../../components/form/FormSelect";
import FormRadioButton from "../../components/form/FormRadioButton";

const EditParameters = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const parameters = location.state;

    useEffect(() => {
        if (!parameters) navigate('/parameters', { replace: true });
    }, [parameters, navigate]);

    // Formik
    const formik = useFormik({
        initialValues: {
            award_type: parameters.award_type?.trim() ?? "",
            applicability: parameters.applicability?.trim() ?? "",
            name: parameters.name?.trim() ?? "",
            category: parameters.category?.trim() ?? "",
            subcategory: parameters.subcategory?.trim() ?? "",
            subsubcategory: parameters.subsubcategory?.trim() ?? "",
            arms_service: parameters.arms_service?.trim() ?? "",
            location: parameters.location?.trim() ?? "",
            description: parameters.description?.trim() ?? "",
            negative: parameters.negative ?? false,
            per_unit_mark: parameters.per_unit_mark ?? "",
            max_marks: parameters.max_marks ?? "",
            proof_reqd: parameters.proof_reqd ?? false,
            weightage: parameters.weightage ?? "",
            param_sequence: parameters.param_sequence ?? "",
            param_mark: parameters.param_mark ?? ""
        },
        validationSchema: ParametersSchema,
        onSubmit: async (values, { resetForm }) => {
            const resultAction = await dispatch(updateParameter({ id: parameters.param_id, payload: values }));
            const result = unwrapResult(resultAction);
            if (result.success) {
                resetForm();
                navigate('/parameters');
            }
        },
    });

    if (!parameters) return <p>Loading...</p>;

    const getErrorProps = (name: keyof typeof formik.values) => ({
        errors: typeof formik.errors[name] === 'string' ? formik.errors[name] : undefined,
        touched: typeof formik.touched[name] === 'boolean' ? formik.touched[name] : undefined,
    });

    return (
        <div className="profile-settings-section">
            <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                <Breadcrumb
                    title="Edit Parameter"
                    paths={[
                        { label: "Parameters", href: "/parameters" },
                        { label: "Edit", href: "/parameters/1" },
                    ]}
                />
            </div>
            <form onSubmit={formik.handleSubmit}>
                <div className="row">
                    <div className="col-sm-6 mb-3">
                        <FormSelect
                            label="Award Type"
                            name="award_type"
                            options={awardTypeOptions}
                            value={awardTypeOptions.find((opt) => opt.value === formik.values.award_type) ?? null}
                            placeholder="Select"
                            onChange={(selectedOption) => formik.setFieldValue("award_type", selectedOption?.value ?? "")}
                            {...getErrorProps("award_type")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormSelect
                            label="Applicability"
                            name="applicability"
                            options={roleOptions2}
                            value={roleOptions2.find((opt) => opt.value === formik.values.applicability) ?? null}
                            onChange={(selectedOption) =>
                                formik.setFieldValue(
                                    "applicability",
                                    selectedOption?.value ?? ""
                                )
                            }
                            placeholder="Select"
                            {...getErrorProps("applicability")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormSelect
                            label="Arm / Service"
                            name="arms_service"
                            options={parameterArmService}
                            value={parameterArmService.find((opt) => opt.value === formik.values.arms_service) ?? null}
                            onChange={(selectedOption) =>
                                formik.setFieldValue(
                                    "arms_service",
                                    selectedOption?.value ?? ""
                                )
                            }
                            placeholder="Select"
                            {...getErrorProps("arms_service")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Name"
                            name="name"
                            placeholder="Enter name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("name")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Category"
                            name="category"
                            placeholder="Enter category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("category")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Sub Category"
                            name="subcategory"
                            placeholder="Enter sub category"
                            value={formik.values.subcategory}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("subcategory")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Sub Sub Category"
                            name="subsubcategory"
                            placeholder="Enter sub sub category"
                            value={formik.values.subsubcategory}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("subsubcategory")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Location"
                            name="location"
                            placeholder="Enter location"
                            value={formik.values.location}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("location")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Per Unit Mark"
                            name="per_unit_mark"
                            type="number"
                            placeholder="Enter per unit mark"
                            value={formik.values.per_unit_mark}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("per_unit_mark")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Max Mark"
                            name="max_marks"
                            type="number"
                            placeholder="Enter max mark"
                            value={formik.values.max_marks}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("max_marks")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Weightage"
                            name="weightage"
                            type="number"
                            placeholder="Enter weightage"
                            value={formik.values.weightage}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("weightage")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Param Sequence"
                            name="param_sequence"
                            type="number"
                            placeholder="Enter param sequence"
                            value={formik.values.param_sequence}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("param_sequence")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormInput
                            label="Param Mark"
                            name="param_mark"
                            type="number"
                            placeholder="Enter param mark"
                            value={formik.values.param_mark}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("param_mark")}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <div className="form-label mb-1">
                            Negative
                        </div>
                        <div className="d-flex align-items-center gap-xxl-4 gap-2 flex-grow-1">
                            <FormRadioButton
                                id="negative_yes"
                                name="negative"
                                value={true}
                                checked={formik.values.negative === true}
                                onChange={(value) => formik.setFieldValue("negative", value)}
                                label="Yes"
                            />
                            <FormRadioButton
                                id="negative_no"
                                name="negative"
                                value={false}
                                checked={formik.values.negative === false}
                                onChange={(value) => formik.setFieldValue("negative", value)}
                                label="No"
                            />
                        </div>
                        {typeof formik.errors.negative === 'string' && formik.touched.negative && (
                            <p className="error-text">{formik.errors.negative}</p>
                        )}
                    </div>
                    <div className="col-sm-6 mb-3">
                        <div className="form-label mb-1">
                            Proof required
                        </div>
                        <div className="d-flex align-items-center gap-xxl-4 gap-2 flex-grow-1">
                            <FormRadioButton
                                id="proof_reqd_yes"
                                name="proof_reqd"
                                value={true}
                                checked={formik.values.proof_reqd === true}
                                onChange={(value) => formik.setFieldValue("proof_reqd", value)}
                                label="Yes"
                            />
                            <FormRadioButton
                                id="proof_reqd_no"
                                name="proof_reqd"
                                value={false}
                                checked={formik.values.proof_reqd === false}
                                onChange={(value) => formik.setFieldValue("proof_reqd", value)}
                                label="No"
                            />
                        </div>
                        {typeof formik.errors.proof_reqd === 'string' && formik.touched.proof_reqd && (
                            <p className="error-text">{formik.errors.proof_reqd}</p>
                        )}
                    </div>
                    <div className="col-12 mb-3">
                        <FormInput
                            label="Description"
                            name="description"
                            as="textarea"
                            placeholder="Enter description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            {...getErrorProps("description")}
                        />
                    </div>
                    <div className="col-12 mt-2">
                        <div className="d-flex align-items-center">
                            <button type="submit" className="_btn _btn-lg primary" disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            aria-hidden="true"
                                        ></span>
                                        {' '}Saving changes...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditParameters;
