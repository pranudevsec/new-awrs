import { useEffect } from "react";
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import FormInput from "../../components/form/FormInput";
import TagInput from "../../components/form/TagInput";

import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import {
  getConfig,
  updateConfig,
} from "../../reduxToolkit/services/config/configService";
import { AdminSettingSchema } from "../../validations/validations";

const AdminSettings = () => {
  const dispatch = useAppDispatch();

  const { config, loader, error } = useAppSelector((state) => state.config);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      lastDate: config?.deadline ? config.deadline.split("T")[0] : "",
      cycle_period: config?.cycle_period || [],
    },
    validationSchema: AdminSettingSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const resultAction = await dispatch(
          updateConfig({
            deadline: values.lastDate,
            cycle_period: values.cycle_period,
          })
        );
        const result = unwrapResult(resultAction);
        if (result.success) {
          resetForm();
        }
      } catch (err) {
        console.error("Update failed", err);
      }
    },
  });

  useEffect(() => {
    dispatch(getConfig());
  }, [dispatch]);

  return (
    <div className="profile-settings-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Admin Settings" />
      </div>

      {error && <p className="text-danger">{error}</p>}
      {loader && <p>Loading...</p>}

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
              error={
                formik.touched.cycle_period && formik.errors.cycle_period
                  ? typeof formik.errors.cycle_period === "string"
                    ? formik.errors.cycle_period
                    : formik.errors.cycle_period.join(", ")
                  : ""
              }
            />
          </div>

          <div className="col-12">
            <div className="d-flex align-items-center">
              <button
                type="submit"
                className="_btn _btn-lg primary"
                disabled={loader}
              >
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
