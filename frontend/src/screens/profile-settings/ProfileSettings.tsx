import { useFormik } from "formik";
import { ProfileSettingSchema } from "../../validations/validations";
import FormSelect from "../../components/form/FormSelect";

const unitOptions: OptionType[] = [
    { value: 'unit1', label: 'Unit 1' },
    { value: 'unit2', label: 'Unit 2' },
    { value: 'unit3', label: 'Unit 3' },
    { value: 'unit4', label: 'Unit 4' },
    { value: 'unit5', label: 'Unit 5' },
]
const brigadeOptions: OptionType[] = [
    { value: 'brigade1', label: 'Brigade 1' },
    { value: 'brigade2', label: 'Brigade 2' },
    { value: 'brigade3', label: 'Brigade 3' },
    { value: 'brigade4', label: 'Brigade 4' },
    { value: 'brigade5', label: 'Brigade 5' },
]
const divisonOptions: OptionType[] = [
    { value: 'divison1', label: 'Divison 1' },
    { value: 'divison2', label: 'Divison 2' },
    { value: 'divison3', label: 'Divison 3' },
    { value: 'divison4', label: 'Divison 4' },
    { value: 'divison5', label: 'Divison 5' },
]
const corpsOptions: OptionType[] = [
    { value: 'corps1', label: 'Corps 1' },
    { value: 'corps2', label: 'Corps 2' },
    { value: 'corps3', label: 'Corps 3' },
    { value: 'corps4', label: 'Corps 4' },
    { value: 'corps5', label: 'Corps 5' },
]
const commandOptions: OptionType[] = [
    { value: 'command1', label: 'Command 1' },
    { value: 'command2', label: 'Command 2' },
    { value: 'command3', label: 'Command 3' },
    { value: 'command4', label: 'Command 4' },
    { value: 'command5', label: 'Command 5' },
]

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
            <h3 className="breadcrumb-title font-lexend fw-6 mb-3">Profile Settings</h3>
            <form onSubmit={formik.handleSubmit}>
                <div className="row">
                    <div className="col-12 mb-3">
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
                    <div className="col-12 mb-3">
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
                    <div className="col-12 mb-3">
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
                    <div className="col-12 mb-3">
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
                    <div className="col-12 mb-4">
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
                        <div className="d-flex align-items-center justify-content-end">
                            <button type="submit" className="submit-btn border-0">Submit</button>
                        </div>
                    </div>
                </div>
            </form >
        </div >
    )
}

export default ProfileSettings