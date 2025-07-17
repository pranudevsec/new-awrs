import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import { AdminSettingSchema } from "../../validations/validations";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { getConfig, updateConfig } from "../../reduxToolkit/services/config/configService";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormInput from "../../components/form/FormInput";
import TagInput from "../../components/form/TagInput";
import FormSelect from "../../components/form/FormSelect";
import Loader from "../../components/ui/loader/Loader";

const AdminSettings = () => {
  const dispatch = useAppDispatch();

  const { config } = useAppSelector((state) => state.config);

  // States
  const [firstLoad, setFirstLoad] = useState(true);

  // Formik form
  const formik = useFormik({
    initialValues: {
      lastDate: config?.deadline ? config.deadline.split("T")[0] : "",
      cycle_period: config?.cycle_period ?? [],
      current_cycle_period: config?.current_cycle_period ?? "",
    },
    enableReinitialize: true,
    validationSchema: AdminSettingSchema,
    onSubmit: async (values, { resetForm }) => {
      const resultAction = await dispatch(
        updateConfig({
          deadline: values.lastDate,
          cycle_period: values.cycle_period,
          current_cycle_period: values.current_cycle_period,
        })
      );
      const result = unwrapResult(resultAction);
      if (result.success) resetForm();
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getConfig());
      setFirstLoad(false);
    };
    fetchData();
  }, []);

  const cyclePeriodOptions = formik.values.cycle_period.map((item) => ({
    label: item,
    value: item,
  }));

  let cyclePeriodError = "";

  if (formik.touched.cycle_period && formik.errors.cycle_period) {
    if (typeof formik.errors.cycle_period === "string") {
      cyclePeriodError = formik.errors.cycle_period;
    } else {
      cyclePeriodError = formik.errors.cycle_period.join(", ");
    }
  }

  // Show loader
  if (firstLoad) return <Loader />;

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
              value={formik.values.lastDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errors={
                formik.touched.lastDate && formik.errors.lastDate
                  ? formik.errors.lastDate
                  : ""
              }
            />
          </div>
          <div className="col-sm-6 mb-3">
            <TagInput
              label="Cycle Period"
              name="cycle_period"
              placeholder="Enter cycle period"
              value={formik.values.cycle_period}
              onChange={(val) => formik.setFieldValue("cycle_period", val)}
              onBlur={() => formik.setFieldTouched("cycle_period", true)}
              error={cyclePeriodError}
            />
          </div>
          <div className="col-sm-6 mb-3">
            <FormSelect
              label="Current Cycle Period"
              name="current_cycle_period"
              options={cyclePeriodOptions}
              value={
                cyclePeriodOptions.find(
                  (opt) => opt.value === formik.values.current_cycle_period
                ) ?? null
              }
              onChange={(selected) =>
                formik.setFieldValue("current_cycle_period", selected?.value)
              }
              placeholder="Select current cycle"
            />
          </div>
          <div className="col-12">
            <div className="d-flex align-items-center">
              <button type="submit" className="_btn _btn-lg primary" disabled={formik.isSubmitting}>
                {formik.isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                    {' '}Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;