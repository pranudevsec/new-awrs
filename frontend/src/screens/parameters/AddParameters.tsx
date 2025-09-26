import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import { useAppDispatch } from "../../reduxToolkit/hooks";
import { ParametersSchema } from "../../validations/validations";
import { createParameter } from "../../reduxToolkit/services/parameter/parameterService";
import { awardTypeOptions, parameterArmService, roleOptions2 } from "../../data/options";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormInput from "../../components/form/FormInput";
import FormSelect from "../../components/form/FormSelect";
import FormRadioButton from "../../components/form/FormRadioButton";

const AddParameters = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Formik
    const formik = useFormik({
        initialValues: {
            award_type: "",
            applicability: "",
            name: "",
            category: "",
            subcategory: "",
            subsubcategory: "",
            arms_service: "",
            location: "",
            description: "",
            negative: null,
            per_unit_mark: "",
            max_marks: "",
            proof_reqd: null,
            weightage: "",
            param_sequence: "",
            param_mark: ""
        },
        validationSchema: ParametersSchema,
        onSubmit: async (values, { resetForm }) => {
            const resultAction = await dispatch(createParameter(values));
            const result = unwrapResult(resultAction);
            if (result.success) {
                resetForm();
                navigate('/parameters');
            }
        },
    });

    return (
        <div className="profile-settings-section">
            <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                <Breadcrumb
                    title="Create Parameter"
                    paths={[
                        { label: "Parameters", href: "/parameters" },
                        { label: "Create", href: "/parameters/add" },
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
                            errors={formik.errors.award_type}
                            touched={formik.touched.award_type}
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
                            errors={formik.errors.applicability}
                            touched={formik.touched.applicability}
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
                            errors={formik.errors.arms_service}
                            touched={formik.touched.arms_service}
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
                            errors={formik.errors.name}
                            touched={formik.touched.name}
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
                            errors={formik.errors.category}
                            touched={formik.touched.category}
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
                            errors={formik.errors.subcategory}
                            touched={formik.touched.subcategory}
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
                            errors={formik.errors.subsubcategory}
                            touched={formik.touched.subsubcategory}
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
                            errors={formik.errors.location}
                            touched={formik.touched.location}
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
                            errors={formik.errors.per_unit_mark}
                            touched={formik.touched.per_unit_mark}
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
                            errors={formik.errors.max_marks}
                            touched={formik.touched.max_marks}
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
                            errors={formik.errors.weightage}
                            touched={formik.touched.weightage}
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
                            errors={formik.errors.param_sequence}
                            touched={formik.touched.param_sequence}
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
                            errors={formik.errors.param_mark}
                            touched={formik.touched.param_mark}
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
                        {formik.errors.negative && formik.touched.negative && (
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
                        {formik.errors.proof_reqd && formik.touched.proof_reqd && (
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
                            errors={formik.errors.description}
                            touched={formik.touched.description}
                        />
                    </div>
                    <div className="col-12 mt-2 mb-3">
                        <div className="d-flex align-items-center">
                            <button type="submit" className="_btn _btn-lg primary" disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                                        {' '}Adding...
                                    </>
                                ) : (
                                    "Add"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddParameters;
