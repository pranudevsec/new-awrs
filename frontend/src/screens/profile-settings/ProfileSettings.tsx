import { useEffect, useState, type FormEvent } from "react";
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import {
  unitOptions,
  brigadeOptions,
  divisionOptions,
  corpsOptions,
  commandOptions,
  hierarchicalStructure,
  unitTypeOptions,
  matrixUnitOptions,
} from "../../data/options";
import { useAppSelector, useAppDispatch } from "../../reduxToolkit/hooks";
import {
  getProfile,
  reqToUpdateUnitProfile,
} from "../../reduxToolkit/services/auth/authService";
import FormSelect from "../../components/form/FormSelect";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import Loader from "../../components/ui/loader/Loader";
import FormInput from "../../components/form/FormInput";
import toast from "react-hot-toast";
import type { UpdateUnitProfileRequest } from "../../reduxToolkit/services/auth/authInterface";

type UserRole = "unit" | "brigade" | "division" | "corps" | "command" | string;

interface Officer {
  id?: string;
  serialNumber: string;
  icNumber: string;
  rank: string;
  name: string;
  appointment: string;
  digitalSign: string;
}

const hierarchyMap: Record<string, string[]> = {};
hierarchicalStructure.forEach(([command, corps, division, brigade, unit]) => {
  hierarchyMap[command] = [corps, division, brigade, unit];
});

const ProfileSettings = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.admin);

  // States
  const [firstLoad, setFirstLoad] = useState(true);
  const [presidingOfficer, setPresidingOfficer] = useState<Officer>({
    id: undefined,
    serialNumber: "",
    icNumber: "",
    rank: "",
    name: "",
    appointment: "",
    digitalSign: "",
  });

  const [officers, setOfficers] = useState<Officer[]>([
    {
      id: undefined,
      serialNumber: "",
      icNumber: "",
      rank: "",
      name: "",
      appointment: "",
      digitalSign: "",
    },
  ]);
  const role = profile?.user?.user_role?.toLowerCase() ?? "";

  useEffect(() => {
    if (profile?.unit?.members && Array.isArray(profile.unit.members)) {
      // Extract presiding officer
      const presiding = profile.unit.members.find(
        (member) => member.member_type === "presiding_officer"
      );
  
      if (presiding) {
        setPresidingOfficer({
          id: presiding.id ?? undefined,
          serialNumber: presiding.member_order ?? "",
          icNumber: presiding.ic_number ?? "",
          rank: presiding.rank ?? "",
          name: presiding.name ?? "",
          appointment: presiding.appointment ?? "",
          digitalSign: presiding.digital_sign ?? "",
        });
      }
  
      // Extract other officers
      const otherOfficers = profile.unit.members
        .filter((member) => member.member_type !== "presiding_officer")
        .map((member) => ({
          id: member.id ?? undefined,
          serialNumber: member.member_order ?? "",
          icNumber: member.ic_number ?? "",
          rank: member.rank ?? "",
          name: member.name ?? "",
          appointment: member.appointment ?? "",
          digitalSign: member.digital_sign ?? "",
        }));
  
      if (otherOfficers.length > 0) {
        setOfficers(otherOfficers);
      } else {
        setOfficers([
          {
            id: undefined,
            serialNumber: "",
            icNumber: "",
            rank: "",
            name: "",
            appointment: "",
            digitalSign: "",
          },
        ]);
      }
    }
  }, [profile?.unit?.members]);
  
  useEffect(() => {
    if (profile) setFirstLoad(false);
  }, [profile]);

  const getVisibleFields = (role: UserRole): string[] => {
    switch (role) {
      case "unit":
        return [
          "brigade",
          "division",
          "corps",
          "command",
          "location",
          "matrix_unit",
          "unit_type",
          "unit",
        ]
          .slice()
          .reverse();
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
    unit_type: unitTypeOptions,
    matrix_unit: matrixUnitOptions,
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

  const handleChange = (index: number, field: keyof Officer, value: string) => {
    const updated = [...officers];
    updated[index][field] = value;
    setOfficers(updated);
  };

  const handleAdd = (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setOfficers((prev) => [
      ...prev,
      {
        serialNumber: "",
        icNumber: "",
        rank: "",
        name: "",
        appointment: "",
        digitalSign: "",
      },
    ]);
  };

  // Formik form
  const formik: any = useFormik({
    initialValues: {
      unit: profile?.unit?.name || "",
      brigade: profile?.unit?.bde || "",
      division: profile?.unit?.div || "",
      corps: profile?.unit?.corps || "",
      command: profile?.unit?.comd || "",
      adm_channel: profile?.unit?.adm_channel || "",
      tech_channel: profile?.unit?.tech_channel || "",
      unit_type: profile?.unit?.unit_type || "",
      matrix_unit: profile?.unit?.matrix_unit || "",
      location: profile?.unit?.location || "",
      goc_award: profile?.unit?.goc_award || "",
      coas_award: profile?.unit?.coas_award || "",
      goc_award_year: profile?.unit?.goc_award_year || "",
      coas_award_year: profile?.unit?.coas_award_year || "",
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
        const payload: any = {};

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
        payload["unit_type"] = values.unit_type;
        payload["matrix_unit"] = values.matrix_unit;
        payload["location"] = values.location;
        payload["goc_award"] = values.goc_award;
        payload["coas_award"] = values.coas_award;
        payload["goc_award_year"] = values.goc_award_year;
        payload["coas_award_year"] = values.coas_award_year;

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
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => {
    const year = currentYear - i;
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  });
  const handlePresidingChange = (field: keyof Officer, value: string) => {
    setPresidingOfficer((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // Show loader
  if (firstLoad) return <Loader />;
  const buildUnitPayload = (members?: UpdateUnitProfileRequest["members"]): UpdateUnitProfileRequest => ({
    name: profile?.unit?.name || "",
    adm_channel: profile?.unit?.adm_channel ?? null,
    tech_channel: profile?.unit?.tech_channel ?? null,
    bde: profile?.unit?.bde ?? null,
    div: profile?.unit?.div ?? null,
    corps: profile?.unit?.corps ?? null,
    comd: profile?.unit?.comd ?? null,
    unit_type: profile?.unit?.unit_type ?? null,
    matrix_unit: profile?.unit?.matrix_unit ?? null,
    location: profile?.unit?.location ?? null,
    goc_award: profile?.unit?.goc_award ?? null,
    coas_award: profile?.unit?.coas_award ?? null,
    goc_award_year: profile?.unit?.goc_award_year ?? null,
    coas_award_year: profile?.unit?.coas_award_year ?? null,
    members
  });
  
  return (
    <div className="profile-settings-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Profile Settings" />
      </div>

      {/* Profile Settings */}
      <form onSubmit={formik.handleSubmit} className="mb-5">
        <div className="row">
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

            const getDynamicLabel = (
              userRole: string,
              field: string
            ): string => {
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

              if (field === "unit_type") {
                return "Arms / Services";
              }

              return field
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
            };

            if (!optionsForField.length) {
              return (
                <div className="col-sm-6 mb-3" key={field}>
                  <label htmlFor={field} className="form-label mb-1">
                    {getDynamicLabel(profile?.user?.user_role ?? "", field)}
                  </label>
                  <input
                    id={field}
                    name={field}
                    type="text"
                    className={`form-control ${
                      formik.touched[field] && formik.errors[field]
                        ? "is-invalid"
                        : ""
                    }`}
                    value={formik.values[field]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder={`Enter ${getDynamicLabel(
                      profile?.user?.user_role ?? "",
                      field
                    )}`}
                  />
                  {formik.touched[field] && formik.errors[field] && (
                    <div className="invalid-feedback">
                      {formik.errors[field]}
                    </div>
                  )}
                </div>
              );
            }

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

                    if (selectedValue === "n/a") {
                      formik.setFieldValue("corps", "");
                      formik.setFieldValue("division", "");
                      formik.setFieldValue("brigade", "");
                      formik.setFieldValue("unit", "");
                    }

                    formik.setFieldValue(field, selectedValue);

                    if (
                      field === "command" &&
                      selectedValue &&
                      hierarchyMap[selectedValue]
                    ) {
                      const [corps, division, brigade] =
                        hierarchyMap[selectedValue];
                      formik.setFieldValue("corps", corps);
                      formik.setFieldValue("division", division);
                      formik.setFieldValue("brigade", brigade);
                    }
                  }}
                  placeholder={getPlaceholder(
                    profile?.user?.user_role ?? "",
                    field
                  )}
                  errors={formik.errors[field]}
                  touched={formik.touched[field]}
                />
              </div>
            );
          })}
          {role === "unit" && (
            <>
              <div className="col-sm-6 mb-3">
                <label htmlFor="goc_award" className="form-label mb-1">
                  GOC Award
                </label>
                <input
                  id="goc_award"
                  name="goc_award"
                  type="text"
                  className={`form-control ${
                    formik.touched.goc_award && formik.errors.goc_award
                      ? "is-invalid"
                      : ""
                  }`}
                  value={formik.values.goc_award}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter GOC Award"
                />
                {formik.touched.goc_award && formik.errors.goc_award && (
                  <div className="invalid-feedback">
                    {formik.errors.goc_award}
                  </div>
                )}
              </div>

              <div className="col-sm-6 mb-3">
                <label htmlFor="goc_award_year" className="form-label mb-1">
                  GOC Award Year
                </label>
                <select
                  id="goc_award_year"
                  name="goc_award_year"
                  className={`form-select ${
                    formik.touched.goc_award_year &&
                    formik.errors.goc_award_year
                      ? "is-invalid"
                      : ""
                  }`}
                  value={formik.values.goc_award_year}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select Year</option>
                  {yearOptions}
                </select>
                {formik.touched.goc_award_year &&
                  formik.errors.goc_award_year && (
                    <div className="invalid-feedback">
                      {formik.errors.goc_award_year}
                    </div>
                  )}
              </div>

              <div className="col-sm-6 mb-3">
                <label htmlFor="coas_award" className="form-label mb-1">
                  COAS Award
                </label>
                <input
                  id="coas_award"
                  name="coas_award"
                  type="text"
                  className={`form-control ${
                    formik.touched.coas_award && formik.errors.coas_award
                      ? "is-invalid"
                      : ""
                  }`}
                  value={formik.values.coas_award}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter COAS Award"
                />
                {formik.touched.coas_award && formik.errors.coas_award && (
                  <div className="invalid-feedback">
                    {formik.errors.coas_award}
                  </div>
                )}
              </div>

              <div className="col-sm-6 mb-3">
                <label htmlFor="coas_award_year" className="form-label mb-1">
                  COAS Award Year
                </label>
                <select
                  id="coas_award_year"
                  name="coas_award_year"
                  className={`form-select ${
                    formik.touched.coas_award_year &&
                    formik.errors.coas_award_year
                      ? "is-invalid"
                      : ""
                  }`}
                  value={formik.values.coas_award_year}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select Year</option>
                  {yearOptions}
                </select>
                {formik.touched.coas_award_year &&
                  formik.errors.coas_award_year && (
                    <div className="invalid-feedback">
                      {formik.errors.coas_award_year}
                    </div>
                  )}
              </div>
            </>
          )}

          {role !== "unit" && (
            <>
              {" "}
              <div className="col-sm-6 mb-3">
                <label htmlFor="adm_channel" className="form-label mb-1">
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
                  <div className="invalid-feedback">
                    {formik.errors.adm_channel}
                  </div>
                )}
              </div>
              <div className="col-sm-6 mb-3">
                <label htmlFor="tech_channel" className="form-label mb-1">
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
                  <div className="invalid-feedback">
                    {formik.errors.tech_channel}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="col-12 mt-2">
            <div className="d-flex align-items-center">
              <button
                type="submit"
                className="_btn _btn-lg primary"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? (
                  <span>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Submiting...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {!["unit", "headquarter", "cw2"].includes(role) && (
        <>
          {/* Commander */}
          {/* <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Commander" />
      </div>
      <form className="mb-5">
        <div className="row">
          <div className="col-sm-6 mb-3">
            <FormInput
              label="Serial Number"
              name="serialNumber"
              placeholder="Enter Serial Number"
              value=""
            />
          </div>
          <div className="col-sm-6 mb-3">
            <FormInput
              label="IC Number"
              name="icNumber"
              placeholder="Enter IC Number"
              value=""
            />
          </div>
          <div className="col-sm-6 mb-3">
            <FormInput
              label="Rank"
              name="rank"
              placeholder="Enter Rank"
              value=""
            />
          </div>
          <div className="col-sm-6 mb-3">
            <FormInput
              label="Name"
              name="name"
              placeholder="Enter Name"
              value=""
            />
          </div>
          <div className="col-sm-6 mb-3">
            <FormInput
              label="Appointment"
              name="appointment"
              placeholder="Enter Appointment"
              value=""
            />
          </div>
          <div className="col-sm-6 mb-3">
            <FormInput
              label="Digital Sign"
              name="digitalSign"
              placeholder="Enter Digital Sign"
              value=""
            />
          </div>
          <div className="col-12 mt-2">
            <div className="d-flex align-items-center">
              <button type="submit" className="_btn _btn-lg primary">
                Add  Commander
              </button>
            </div>
          </div>
        </div>
      </form> */}

          {/* Presiding Officer */}
          <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
            <Breadcrumb title="Presiding Officer" />
          </div>
          <form
  className="mb-5"
  onSubmit={async (e) => {
    e.preventDefault();

    if (!presidingOfficer.icNumber || !presidingOfficer.rank || !presidingOfficer.name) {
      toast.error("Please fill IC Number, Rank, and Name for Presiding Officer.");
      return;
    }

    const presidingPayload = [{
      ...(presidingOfficer.id ? { id: presidingOfficer.id } : {}),
      member_type: "presiding_officer",
      member_order: "",
      ic_number: presidingOfficer.icNumber,
      rank: presidingOfficer.rank,
      name: presidingOfficer.name,
      appointment: presidingOfficer.appointment,
      digital_sign: presidingOfficer.digitalSign,
    }];

    try {
      const payload = buildUnitPayload(presidingPayload);
      const resultAction = await dispatch(reqToUpdateUnitProfile(payload));      const result = unwrapResult(resultAction);

      if (result.success) {
        await dispatch(getProfile());
      }
    } catch (error) {
      toast.error("Failed to add Presiding Officer.");
      console.error(error);
    }
  }}
>
  <div className="row">
    <div className="col-sm-6 mb-3">
      <FormInput
        label="IC Number"
        name="icNumber"
        placeholder="Enter IC Number"
        value={presidingOfficer.icNumber}
        onChange={(e) => handlePresidingChange("icNumber", e.target.value)}
      />
    </div>
    <div className="col-sm-6 mb-3">
      <FormInput
        label="Rank"
        name="rank"
        placeholder="Enter Rank"
        value={presidingOfficer.rank}
        onChange={(e) => handlePresidingChange("rank", e.target.value)}
      />
    </div>
    <div className="col-sm-6 mb-3">
      <FormInput
        label="Name"
        name="name"
        placeholder="Enter Name"
        value={presidingOfficer.name}
        onChange={(e) => handlePresidingChange("name", e.target.value)}
      />
    </div>
    <div className="col-sm-6 mb-3">
      <FormInput
        label="Appointment"
        name="appointment"
        placeholder="Enter Appointment"
        value={presidingOfficer.appointment}
        onChange={(e) => handlePresidingChange("appointment", e.target.value)}
      />
    </div>
    <div className="col-sm-6 mb-3">
      <FormInput
        label="Digital Sign"
        name="digitalSign"
        placeholder="Enter Digital Sign"
        value={presidingOfficer.digitalSign}
        onChange={(e) => handlePresidingChange("digitalSign", e.target.value)}
      />
    </div>
    <div className="col-12 mt-2">
      <button type="submit" className="_btn _btn-lg primary">
        Add Presiding Officer
      </button>
    </div>
  </div>
</form>


          {/* Officers */}
          <form
  className="mb-5"
  onSubmit={async (e) => {
    e.preventDefault();

    if (officers.length === 0) {
      toast.error("Please add at least one Member Officer.");
      return;
    }

    const officersPayload: UpdateUnitProfileRequest["members"] = officers.map((officer, index) => ({
      ...(officer.id ? { id: officer.id } : {}), 
      member_type: "member_officer", // narrowed type
      member_order: String(index + 1),
      ic_number: officer.icNumber,
      rank: officer.rank,
      name: officer.name,
      appointment: officer.appointment,
      digital_sign: officer.digitalSign,
    }));

    try {
      const payload = buildUnitPayload(officersPayload);
      const resultAction = await dispatch(reqToUpdateUnitProfile(payload));
      const result = unwrapResult(resultAction);

      if (result.success) {
        await dispatch(getProfile());
      }
    } catch (error) {
      toast.error("Failed to add Member Officers.");
      console.error(error);
    }
  }}
>
  {officers.map((officer, index) => (
    <div key={index} className="mb-4">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-3">
        <Breadcrumb title={`Member Officer ${index + 1}`} />
      </div>
      <div className="row">
        <div className="col-sm-6 mb-3">
          <FormInput
            label="IC Number"
            name={`icNumber-${index}`}
            placeholder="Enter IC Number"
            value={officer.icNumber}
            onChange={(e) =>
              handleChange(index, "icNumber", e.target.value)
            }
          />
        </div>
        <div className="col-sm-6 mb-3">
          <FormInput
            label="Rank"
            name={`rank-${index}`}
            placeholder="Enter Rank"
            value={officer.rank}
            onChange={(e) =>
              handleChange(index, "rank", e.target.value)
            }
          />
        </div>
        <div className="col-sm-6 mb-3">
          <FormInput
            label="Name"
            name={`name-${index}`}
            placeholder="Enter Name"
            value={officer.name}
            onChange={(e) =>
              handleChange(index, "name", e.target.value)
            }
          />
        </div>
        <div className="col-sm-6 mb-3">
          <FormInput
            label="Appointment"
            name={`appointment-${index}`}
            placeholder="Enter Appointment"
            value={officer.appointment}
            onChange={(e) =>
              handleChange(index, "appointment", e.target.value)
            }
          />
        </div>
        <div className="col-sm-6 mb-3">
          <FormInput
            label="Digital Sign"
            name={`digitalSign-${index}`}
            placeholder="Enter Digital Sign"
            value={officer.digitalSign}
            onChange={(e) =>
              handleChange(index, "digitalSign", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  ))}

  <div className="d-flex align-items-center gap-2">
    <button type="submit" className="_btn _btn-lg primary">
      Add Member Officers
    </button>
    <button type="button" className="_btn _btn-lg success" onClick={handleAdd}>
      Add
    </button>
  </div>
</form>

        </>
      )}
    </div>
  );
};

export default ProfileSettings;
