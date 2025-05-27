import { useFormik } from "formik";
import { ProfileSettingSchema } from "../../validations/validations";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormInput from "../../components/form/FormInput";
import TagInput from "../../components/form/TagInput";


const AdminSettings = () => {
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
    },
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
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Admin Settings" />
      </div>
      <form onSubmit={formik.handleSubmit}>
        <div className="row">
          <div className="col-sm-6 mb-3">
            <FormInput
              label="Last Deadline Date"
              name="lastDate"
              placeholder="Enter date"
              type="date"
              value="2025-04-15"
            />
          </div>
          <div className="col-sm-6 mb-3">
            <TagInput label="Cycle Period" placeholder="Enter cycle period" />
          </div>
          <div className="col-12">
            <div className="d-flex align-items-center">
              <button type="submit" className="_btn _btn-lg primary">
                Submit
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
