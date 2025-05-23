import { useFormik } from "formik";
import { ProfileSettingSchema } from "../../validations/validations";
import { unitOptions, brigadeOptions, divisonOptions, corpsOptions, commandOptions } from "./options";
import FormSelect from "../../components/form/FormSelect";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";

const ProfileSettings = () => {

    // Formik
    const formik = useFormik({
        initialValues: {
            unit: "",
            brigade: "",
            divison: "",
            corps: "",
            command: "",
        },
        validationSchema: ProfileSettingSchema,
        onSubmit: (values) => {
            console.log("values -> ", values);
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
        <div className="profile-settings-section">
            <Breadcrumb title="Profile Settings" />
            <form onSubmit={formik.handleSubmit}>
                <div className="row">
                    <div className="col-sm-6 mb-3">
                        <FormSelect
                            label="Unit"
                            name="unit"
                            options={unitOptions}
                            value={unitOptions.find((opt) => opt.value === formik.values.unit) || null}
                            onChange={(selectedOption) =>
                                formik.setFieldValue(
                                    "unit",
                                    selectedOption?.value || ""
                                )
                            }
                            placeholder="Select unit"
                            errors={formik.errors.unit}
                            touched={formik.touched.unit}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormSelect
                            label="Brigade"
                            name="brigade"
                            options={brigadeOptions}
                            value={brigadeOptions.find((opt) => opt.value === formik.values.brigade) || null}
                            onChange={(selectedOption) =>
                                formik.setFieldValue(
                                    "brigade",
                                    selectedOption?.value || ""
                                )
                            }
                            placeholder="Select brigade"
                            errors={formik.errors.brigade}
                            touched={formik.touched.brigade}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormSelect
                            label="Divison"
                            name="divison"
                            options={divisonOptions}
                            value={divisonOptions.find((opt) => opt.value === formik.values.divison) || null}
                            onChange={(selectedOption) =>
                                formik.setFieldValue(
                                    "divison",
                                    selectedOption?.value || ""
                                )
                            }
                            placeholder="Select divison"
                            errors={formik.errors.divison}
                            touched={formik.touched.divison}
                        />
                    </div>
                    <div className="col-sm-6 mb-3">
                        <FormSelect
                            label="Corps"
                            name="corps"
                            options={corpsOptions}
                            value={corpsOptions.find((opt) => opt.value === formik.values.corps) || null}
                            onChange={(selectedOption) =>
                                formik.setFieldValue(
                                    "corps",
                                    selectedOption?.value || ""
                                )
                            }
                            placeholder="Select corps"
                            errors={formik.errors.corps}
                            touched={formik.touched.corps}
                        />
                    </div>
                    <div className="col-sm-6 mb-4">
                        <FormSelect
                            label="Command"
                            name="command"
                            options={commandOptions}
                            value={commandOptions.find((opt) => opt.value === formik.values.command) || null}
                            onChange={(selectedOption) =>
                                formik.setFieldValue(
                                    "command",
                                    selectedOption?.value || ""
                                )
                            }
                            placeholder="Select command"
                            errors={formik.errors.command}
                            touched={formik.touched.command}
                        />
                    </div>
                    <div className="col-12">
                        <div className="d-flex align-items-center">
                            <button type="submit" className="submit-btn border-0">Submit</button>
                        </div>
                    </div>
                </div>
            </form >
        </div >
    )
}

export default ProfileSettings