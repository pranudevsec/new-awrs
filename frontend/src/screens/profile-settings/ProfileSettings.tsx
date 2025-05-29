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

export const hierarchicalStructure = [
  ["mycomd", "mycorps", "mydiv", "mybde", "myunit"],
  ["command1", "corps1", "divison1", "brigade1", "unit1"],
  ["command2", "corps2", "divison2", "brigade2", "unit2"],
  ["command3", "corps3", "divison3", "brigade3", "unit3"],
  ["command4", "corps4", "divison4", "brigade4", "unit4"],
  ["command5", "corps5", "divison5", "brigade5", "unit5"],
];

// Create a lookup for faster access
export const hierarchyMap: Record<string, string[]> = {};
hierarchicalStructure.forEach(([command, corps, division, brigade, unit]) => {
  hierarchyMap[command] = [corps, division, brigade, unit];
});


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
      return `Select ${capRole}`;
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
        const role = profile?.user?.user_role ?? "";
        const visibleFields = getVisibleFields(role);
    
        // Map to backend field names
        const fieldMap: Record<string, string> = {
          unit: "name",
          brigade: "bde",
          division: "div",
          corps: "corps",
          command: "comd",
        };
    
        // Prepare payload with visible fields only; others as null
        const payload:any = {};
    
        // Include all relevant fields
        Object.entries(fieldMap).forEach(([formField, backendField]) => {
          if (visibleFields.includes(formField)) {
            payload[backendField] = values[formField];
          } else {
            payload[backendField] = null;
          }
        });
    
        // Add other values
        payload["adm_channel"] = values.adm_channel;
        payload["tech_channel"] = values.tech_channel;
    
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
      const getDynamicLabel = (userRole: string, field: string): string => {
        const roleMap: Record<string, string> = {
          unit: "Unit",
          brigade: "Brigade",
          division: "Division",
          corps: "Corps",
          command: "Command",
        };
      
        if (field === "unit") {
          const roleLabel = roleMap[userRole] || "Unit";
          return `My ${roleLabel}`;
        }
      
        return roleMap[field] || field.charAt(0).toUpperCase() + field.slice(1);
      };
  return (
    <div className="col-sm-6 mb-3" key={field}>
      <FormSelect
label={getDynamicLabel(profile?.user?.user_role ?? "", field)}
name={field}
        options={optionsForField}
        value={
          optionsForField.find(
            (opt: any) => opt.value === formik.values[field]
          ) || null
        }
        onChange={(selectedOption) => {
          const selectedValue = selectedOption?.value || "";
          if (selectedValue=='n/a') {
            formik.setFieldValue("corps", "");
            formik.setFieldValue("division", "");
            formik.setFieldValue("brigade", "");
            formik.setFieldValue("unit", "");
          }
          formik.setFieldValue(field, selectedValue);


          // ✅ When command changes, update all child fields
          if (field === "command" && selectedValue && hierarchyMap[selectedValue]) {
            const [corps, division, brigade] = hierarchyMap[selectedValue];
            formik.setFieldValue("corps", corps);
            formik.setFieldValue("division", division);
            formik.setFieldValue("brigade", brigade);
            // formik.setFieldValue("unit", unit);
          }
        }}
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
