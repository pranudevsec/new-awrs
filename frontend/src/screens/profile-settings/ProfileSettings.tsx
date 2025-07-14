import { useEffect, useState, type FormEvent } from "react";
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import * as Yup from "yup";
import FormSelect from "../../components/form/FormSelect";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import Loader from "../../components/ui/loader/Loader";
import FormInput from "../../components/form/FormInput";
import type { UpdateUnitProfileRequest } from "../../reduxToolkit/services/auth/authInterface";
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
import { rank } from "../../data/options";

type UserRole = "unit" | "brigade" | "division" | "corps" | "command" | string;

interface Officer {
  id?: string;
  serialNumber: string;
  icNumber: string;
  rank: string;
  name: string;
  appointment: string;
  // digitalSign: string;
}
interface Award {
  award_id?: string;
  award_type: string;
  award_title: string;
  award_year: string;
}
const hierarchyMap: Record<string, string[]> = {};
hierarchicalStructure.forEach(([command, corps, division, brigade, unit]) => {
  hierarchyMap[command] = [corps, division, brigade, unit];
});

const ProfileSettings = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.admin);
  console.log("profile - > ", profile);

  const isMember = profile?.user?.is_member ?? false;
  // States
  const [firstLoad, setFirstLoad] = useState(true);
  const [presidingOfficer, setPresidingOfficer] = useState<Officer>({
    id: undefined,
    serialNumber: "",
    icNumber: "",
    rank: "",
    name: "",
    appointment: "",
    // digitalSign: "",
  });

  const [officers, setOfficers] = useState<Officer[]>([
    {
      id: undefined,
      serialNumber: "",
      icNumber: "",
      rank: "",
      name: "",
      appointment: "",
      // digitalSign: "",
    },
  ]);
  const [awards, setAwards] = useState<Award[]>(profile?.unit?.awards ?? []);

  const role = profile?.user?.user_role?.toLowerCase() ?? "";
  useEffect(() => {
    if (profile?.unit?.awards && Array.isArray(profile.unit.awards)) {
      const processedAwards = profile.unit.awards.map((award) => ({
        award_id: award.award_id ?? undefined,
        award_type: award.award_type ?? "goc",
        award_title: award.award_title ?? "",
        award_year: award.award_year ?? "",
      }));
      setAwards(processedAwards);
    } else {
      setAwards([]);
    }
  }, [profile?.unit?.awards]);
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
          // digitalSign: presiding.digital_sign ?? "",
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
          // digitalSign: member.digital_sign ?? "",
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
            // digitalSign: "",
          },
        ]);
      }
    }
  }, [profile?.unit?.members]);

  useEffect(() => {
    if (profile) setFirstLoad(false);
  }, [profile]);

  const getVisibleFields = (
    role: UserRole,
    isSpecialUnit?: boolean
  ): string[] => {
    if (isSpecialUnit) {
      // If it's a special unit, exclude brigade, division, corps
      switch (role) {
        case "unit":
          return [
            "command",
            "location",
            "matrix_unit",
            "unit_type",
            "unit",
          ].reverse();
        case "brigade":
        case "division":
        case "corps":
        case "command":
          return ["unit"].reverse();
        default:
          return [];
      }
    }

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

  const visibleFields = getVisibleFields(
    profile?.user?.user_role ?? "",
    profile?.user?.is_special_unit
  );

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
        // digitalSign: "",
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
        payload["matrix_unit"] = Array.isArray(values.matrix_unit)
          ? values.matrix_unit.join(",")
          : typeof values.matrix_unit === "string" &&
            values.matrix_unit.length > 0
            ? values.matrix_unit
            : "";
        payload["location"] = values.location;
        payload["awards"] = awards;

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

  const memberFormik: any = useFormik({
    initialValues: {
      memberUsername: "",
      memberPassword: ""
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      memberUsername: Yup.string()
        .min(3, "Username must be at least 3 characters")
        .required("Username is required"),
      memberPassword: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values: any, { resetForm }) => {
      const resultAction = await dispatch(reqToUpdateUnitProfile(values));
      const result = unwrapResult(resultAction);
      if (result.success) {
        resetForm();
        await dispatch(getProfile());
      }
    }
  })

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 50 },
    (_, i) => `${currentYear - i}`
  );

  const handlePresidingChange = (field: keyof Officer, value: string) => {
    setPresidingOfficer((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Show loader
  if (firstLoad) return <Loader />;

  const buildUnitPayload = (
    members?: UpdateUnitProfileRequest["members"]
  ): UpdateUnitProfileRequest => ({
    name: profile?.unit?.name || "",
    adm_channel: profile?.unit?.adm_channel ?? null,
    tech_channel: profile?.unit?.tech_channel ?? null,
    bde: profile?.unit?.bde ?? null,
    div: profile?.unit?.div ?? null,
    corps: profile?.unit?.corps ?? null,
    comd: profile?.unit?.comd ?? null,
    unit_type: profile?.unit?.unit_type ?? null,
    matrix_unit:
      typeof profile?.unit?.matrix_unit === "string"
        ? profile.unit.matrix_unit.split(",").map((val: any) => val.trim())
        : [],
    location: profile?.unit?.location ?? null,
    members,
  });

  const isDisabled = !!isMember;

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

              if (field === "matrix_unit") {
                return "Role / Deployment";
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
                    className={`form-control ${formik.touched[field] && formik.errors[field]
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
                    disabled={isDisabled}
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
                  isMulti={field === "matrix_unit"}
                  label={getDynamicLabel(profile?.user?.user_role ?? "", field)}
                  name={field}
                  options={optionsForField}
                  value={
                    field === "matrix_unit"
                      ? optionsForField.filter((opt: any) =>
                        formik.values[field]?.includes(opt.value)
                      )
                      : optionsForField.find(
                        (opt: any) => opt.value === formik.values[field]
                      ) || null
                  }
                  onChange={(selectedOption: any) => {
                    const selectedValue =
                      field === "matrix_unit"
                        ? selectedOption.map((opt: any) => opt.value)
                        : selectedOption?.value || "";

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

                    formik.setFieldValue(field, selectedValue);
                  }}
                  placeholder={getPlaceholder(
                    profile?.user?.user_role ?? "",
                    field
                  )}
                  errors={formik.errors[field]}
                  touched={formik.touched[field]}
                  isDisabled={isDisabled}
                />
              </div>
            );
          })}
          {role === "unit" && (
            <>
              <div className="col-12 mb-3">
                <label className="form-label fw-6">Awards Received</label>
                <table className="table table-bordered">
                  <thead>
                    {awards.length !== 0 && (
                      <tr>
                        {/* <th>Type</th>
                      <th>Brigade</th>
                      <th>Year</th>
                      <th>Action</th> */}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {awards.map((award, idx) => (
                      <tr key={award.award_id ?? idx}>
                        <td>
                          <select
                            className="form-select"
                            value={award.award_type}
                            onChange={(e) => {
                              const updated = [...awards];
                              updated[idx].award_type = e.target.value as
                                | "goc"
                                | "coas"
                                | "cds";
                              setAwards(updated);
                            }}
                          >
                            <option value="goc">GOC-in-C</option>
                            <option value="coas">COAS</option>
                            <option value="cds">CDS</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={award.award_title}
                            onChange={(e) => {
                              const updated = [...awards];
                              updated[idx].award_title = e.target.value;
                              setAwards(updated);
                            }}
                            placeholder="Enter award title"
                          />
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={award.award_year}
                            onChange={(e) => {
                              const updated = [...awards];
                              updated[idx].award_year = e.target.value;
                              setAwards(updated);
                            }}
                          >
                            <option value="">Select Year</option>
                            {yearOptions.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="_btn danger btn-sm"
                            onClick={() => {
                              setAwards((prev) =>
                                prev.filter((_, i) => i !== idx)
                              );
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {awards.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">
                          No awards added
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <button
                  type="button"
                  className="_btn success btn-sm"
                  onClick={() => {
                    setAwards((prev) => [
                      ...prev,
                      { award_type: "goc", award_title: "", award_year: "" },
                    ]);
                  }}
                >
                  Add Award
                </button>
              </div>
            </>
          )}

          {/* {role !== "unit" && (
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
                  className={`form-control ${formik.touched.adm_channel && formik.errors.adm_channel
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
                  className={`form-control ${formik.touched.tech_channel && formik.errors.tech_channel
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
          )} */}

          {!isDisabled && role !== "cw2" && (
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
                      Submitting...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {!["unit", "headquarter"].includes(role) && (
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

          {!isMember && (
            <>
              {" "}
              {/* Presiding Officer */}
              <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                <Breadcrumb title="Presiding Officer" />
              </div>
              <form
                className="mb-5"
                onSubmit={async (e) => {
                  e.preventDefault();

                  if (
                    !presidingOfficer.icNumber ||
                    !presidingOfficer.rank ||
                    !presidingOfficer.name
                  ) {
                    toast.error(
                      "Please fill IC Number, Rank, and Name for Presiding Officer."
                    );
                    return;
                  }

                  const presidingPayload = [
                    {
                      ...(presidingOfficer.id
                        ? { id: presidingOfficer.id }
                        : {}),
                      member_type: "presiding_officer",
                      member_order: "",
                      ic_number: presidingOfficer.icNumber,
                      rank: presidingOfficer.rank,
                      name: presidingOfficer.name,
                      appointment: presidingOfficer.appointment,
                      // digital_sign: presidingOfficer.digitalSign,
                    },
                  ];

                  try {
                    const payload = buildUnitPayload(presidingPayload);
                    const resultAction = await dispatch(
                      reqToUpdateUnitProfile(payload)
                    );
                    const result = unwrapResult(resultAction);

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
                      onChange={(e) =>
                        handlePresidingChange("icNumber", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <FormSelect
                      label="Rank"
                      name="rank"
                      options={rank}
                      value={rank.find((opt: any) => opt.value === presidingOfficer.rank) || null}
                      onChange={(selected: any) =>
                        handlePresidingChange("rank", selected?.value || "")
                      }
                      placeholder="Select Rank"
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <FormInput
                      label="Name"
                      name="name"
                      placeholder="Enter Name"
                      value={presidingOfficer.name}
                      onChange={(e) =>
                        handlePresidingChange("name", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <FormInput
                      label="Appointment"
                      name="appointment"
                      placeholder="Enter Appointment"
                      value={presidingOfficer.appointment}
                      onChange={(e) =>
                        handlePresidingChange("appointment", e.target.value)
                      }
                    />
                  </div>
                  {/* <div className="col-sm-6 mb-3">
                <FormInput
                  label="Digital Sign"
                  name="digitalSign"
                  placeholder="Enter Digital Sign"
                  value={presidingOfficer.digitalSign}
                  onChange={(e) => handlePresidingChange("digitalSign", e.target.value)}
                />
              </div> */}
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

                  const officersPayload: UpdateUnitProfileRequest["members"] =
                    officers.map((officer, index) => ({
                      ...(officer.id ? { id: officer.id } : {}),
                      member_type: "member_officer", // narrowed type
                      member_order: String(index + 1),
                      ic_number: officer.icNumber,
                      rank: officer.rank,
                      name: officer.name,
                      appointment: officer.appointment,
                      // digital_sign: officer.digitalSign,
                    }));

                  try {
                    const payload = buildUnitPayload(officersPayload);
                    const resultAction = await dispatch(
                      reqToUpdateUnitProfile(payload)
                    );
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
                        <FormSelect
                          label="Rank"
                          name={`rank-${index}`}
                          options={rank}
                          value={rank.find((opt: any) => opt.value === officer.rank) || null}
                          onChange={(selected: any) =>
                            handleChange(index, "rank", selected?.value || "")
                          }
                          placeholder="Select Rank"
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
                      {/* <div className="col-sm-6 mb-3">
                    <FormInput
                      label="Digital Sign"
                      name={`digitalSign-${index}`}
                      placeholder="Enter Digital Sign"
                      value={officer.digitalSign}
                      onChange={(e) =>
                        handleChange(index, "digitalSign", e.target.value)
                      }
                    />
                  </div> */}
                    </div>
                  </div>
                ))}

                <div className="d-flex align-items-center gap-2">
                  <button type="submit" className="_btn _btn-lg primary">
                    Add Member Officers
                  </button>
                  <button
                    type="button"
                    className="_btn _btn-lg success"
                    onClick={handleAdd}
                  >
                    Add
                  </button>
                </div>
              </form>
            </>
          )}
        </>
      )}

      {["brigade", "division", "corps", "command"].includes(role) && (
        <>
          <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
            <Breadcrumb title="Staff Register" />
          </div>

          {profile?.user?.is_member_added ? (
            <div className="mb-5">
              <div className="row">
                <div className="col-sm-6 mb-3">
                  <FormInput
                    label="Registered Member Username"
                    name="memberUsername"
                    value={profile.user.member_username || ""}
                    disabled
                  />
                </div>
              </div>
            </div>
          ) : (
            !profile?.user?.is_member && (
              <form className="mb-5" onSubmit={memberFormik.handleSubmit}>
                <div className="row">
                  <div className="col-sm-6 mb-3">
                    <FormInput
                      label="Username"
                      name="memberUsername"
                      placeholder="Enter Username"
                      value={memberFormik.values.memberUsername}
                      onChange={memberFormik.handleChange}
                      onBlur={memberFormik.handleBlur}
                      errors={memberFormik.errors.memberUsername}
                      touched={memberFormik.touched.memberUsername}
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <FormInput
                      label="Password"
                      name="memberPassword"
                      placeholder="Enter Password"
                      type="password"
                      value={memberFormik.values.memberPassword}
                      onChange={memberFormik.handleChange}
                      onBlur={memberFormik.handleBlur}
                      errors={memberFormik.errors.memberPassword}
                      touched={memberFormik.touched.memberPassword}
                    />
                  </div>
                  <div className="col-12 mt-2">
                    <div className="d-flex align-items-center">
                      <button type="submit" className="_btn _btn-lg primary">
                        Register
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )
          )}
        </>
      )}

    </div>
  );
};

export default ProfileSettings;
