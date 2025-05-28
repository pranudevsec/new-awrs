import { useFormik } from "formik";
import {
  unitOptions,
  brigadeOptions,
  divisionOptions,
  corpsOptions,
  commandOptions,
} from "./options";
import FormSelect from "../../components/form/FormSelect";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import { useAppSelector, useAppDispatch } from "../../reduxToolkit/hooks";
import { unwrapResult } from "@reduxjs/toolkit";
import { getProfile, reqToUpdateUnitProfile } from "../../reduxToolkit/services/auth/authService";

const ProfileSettings = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.admin.profile);
  type UserRole = "unit" | "brigade" | "division" | "corps" | "command" | string;

  const getVisibleFields = (role: UserRole): string[] => {
    switch (role) {
      case "unit":
        return ["unit", "brigade", "division", "corps", "command"].slice().reverse();
      case "brigade":
        return ["unit", "division", "corps", "command"].slice().reverse();
      case "division":
        return ["unit", "corps", "command"].slice().reverse();
      case "corps":
        return ["unit", "command"].slice().reverse();
      case "command":
        return ["unit"].slice().reverse();
      default:
        return [];
    }
  };
  

  const visibleFields = getVisibleFields(profile?.user?.user_role ?? "");

  const optionsMap: Record<string, any> = {
    unit: unitOptions,
    brigade: brigadeOptions,
    division: divisionOptions,
    corps: corpsOptions,
    command: commandOptions,
  };

  const getPlaceholder = (role: string, field: string) => {
    const capRole = role.charAt(0).toUpperCase() + role.slice(1);
    const capField = field.charAt(0).toUpperCase() + field.slice(1);

    if (field === "unit") {
      return `Select ${capRole} Unit`;
    } else {
      return `Select ${capField}`;
    }
  };

  const formik :any= useFormik({
    initialValues: {
      unit: profile?.unit?.name || "",
      brigade: profile?.unit?.bde || "",
      division: profile?.unit?.div || "",
      corps: profile?.unit?.corps || "",
      command: profile?.unit?.comd || "",
      adm_channel: profile?.unit?.adm_channel || "",
      tech_channel: profile?.unit?.tech_channel || "",
    },
    enableReinitialize: true,
    onSubmit: async (values: any, { resetForm }) => {
      try {
        const payload = {
          ...values,
          name: values.unit,
          "bde": values.brigade,
          "div": values.division,
          "corps": values.corps,
          "comd": values.command,
        };
        delete payload.unit;
  
        const resultAction = await dispatch(reqToUpdateUnitProfile(payload));
        const result = unwrapResult(resultAction);
  
        if (result.success) {
          resetForm();
          await dispatch(getProfile());
        }
      } catch (err) {
        console.error("Update failed", err);
      }
    },
  });

  return (
    <div className="profile-settings-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Profile Settings" />
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="row">
       

          {/* Conditionally render select fields based on role */}
          {visibleFields.map((field) => {
            const optionsForField =
            field === "unit"
              ? {
                  unit: unitOptions,
                  brigade: brigadeOptions,
                  division: divisionOptions,
                  corps: corpsOptions,
                  command: commandOptions,
                }[profile?.user?.user_role ?? "unit"] || []
              : optionsMap[field] || [];

            return (
              <div className="col-sm-6 mb-3" key={field}>
                <FormSelect
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  name={field}
                  options={optionsForField}
                  value={
                    optionsForField.find(
                      (opt: any) => opt.value === formik.values[field]
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    formik.setFieldValue(field, selectedOption?.value || "")
                  }
                  placeholder={getPlaceholder(profile?.user?.user_role ?? "", field)}
                  errors={formik.errors[field]}
                  touched={formik.touched[field]}
                />
              </div>
            );
          })}
   <div className="col-sm-6 mb-3">
            <label htmlFor="adm_channel" className="form-label">
              Adm Channel
            </label>
            <input
              id="adm_channel"
              name="adm_channel"
              type="text"
              className={`form-control ${
                formik.touched.adm_channel && formik.errors.adm_channel
                  ? "is-invalid"
                  : ""
              }`}
              value={formik.values.adm_channel}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter Adm Channel"
            />
            {formik.touched.adm_channel && formik.errors.adm_channel && (
              <div className="invalid-feedback">{formik.errors.adm_channel}</div>
            )}
          </div>

          {/* Always show tech_channel */}
          <div className="col-sm-6 mb-3">
            <label htmlFor="tech_channel" className="form-label">
              Tech Channel
            </label>
            <input
              id="tech_channel"
              name="tech_channel"
              type="text"
              className={`form-control ${
                formik.touched.tech_channel && formik.errors.tech_channel
                  ? "is-invalid"
                  : ""
              }`}
              value={formik.values.tech_channel}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter Tech Channel"
            />
            {formik.touched.tech_channel && formik.errors.tech_channel && (
              <div className="invalid-feedback">{formik.errors.tech_channel}</div>
            )}
          </div>
          <div className="col-12 mt-2">
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

export default ProfileSettings;

