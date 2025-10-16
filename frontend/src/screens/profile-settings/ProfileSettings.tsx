import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FaPlus } from "react-icons/fa";
import FormSelect from "../../components/form/FormSelect";
import Breadcrumb from "../../components/ui/breadcrumb/Breadcrumb";
import Loader from "../../components/ui/loader/Loader";
import FormInput from "../../components/form/FormInput";
import ICNumberInput from "../../components/form/ICNumberInput";
import type { UpdateUnitProfileRequest } from "../../reduxToolkit/services/auth/authInterface";
import { useAppSelector, useAppDispatch } from "../../reduxToolkit/hooks";
import { getProfile, reqToUpdateUnitProfile } from "../../reduxToolkit/services/auth/authService";
import { hierarchicalStructure, unitTypeOptions, matrixUnitOptions, rank } from "../../data/options";
import { useMasterData } from "../../hooks/useMasterData";

interface Officer {
  id?: string;
  serialNumber: string;
  icNumber: string;
  rank: string;
  name: string;
  appointment: string;

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
  const navigate = useNavigate();
  const { profile } = useAppSelector((state) => state.admin);
  

  const {
    brigadeOptions,
    corpsOptions,
    commandOptions,
    divisionOptions,
    armsServiceOptions,
    roleOptions,
    deploymentOptions,
    unitOptions
  } = useMasterData();

  const isMember = profile?.user?.is_member ?? false;
  const role = profile?.user?.user_role?.toLowerCase() ?? "";
  const cw2_type = profile?.user?.cw2_type?.toLowerCase() ?? "";

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 79 }, (_, i) => `${currentYear - i}`);


  const [firstLoad, setFirstLoad] = useState(true);
  const [awards, setAwards] = useState<Award[]>(profile?.unit?.awards ?? []);
  const [presidingOfficer, setPresidingOfficer] = useState<Officer>({
    id: undefined,
    serialNumber: "",
    icNumber: "",
    rank: "",
    name: "",
    appointment: "",

  });
  const [officers, setOfficers] = useState<Officer[]>([{
    id: undefined,
    serialNumber: "",
    icNumber: "",
    rank: "",
    name: "",
    appointment: "",

  }]);
  const [isDeclarationChecked, setIsDeclarationChecked] = useState(false);
  const [errors, setErrors] = useState<any>([]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDeclarationChecked(e.target.checked);
  };

  useEffect(() => {
    if (profile?.unit?.awards && Array.isArray(profile.unit.awards)) {
      const processedAwards = profile.unit.awards.map((award) => ({
        award_id: award.award_id ?? undefined,
        award_type: award.award_type ?? "GOC-in-C",
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

        });
      }

      const otherOfficers = profile.unit.members
        .filter((member) => member.member_type !== "presiding_officer")
        .map((member) => ({
          id: member.id ?? undefined,
          serialNumber: member.member_order ?? "",
          icNumber: member.ic_number ?? "",
          rank: member.rank ?? "",
          name: member.name ?? "",
          appointment: member.appointment ?? "",

        }));

      if (otherOfficers.length > 0) {
        setOfficers(otherOfficers);
      } else {
        setOfficers([{
          id: undefined,
          serialNumber: "",
          icNumber: "",
          rank: "",
          name: "",
          appointment: "",

        }]);
      }
    }
  }, [profile?.unit?.members]);

  useEffect(() => {
    if (profile) setFirstLoad(false);
  }, [profile]);

  const getVisibleFields = (
    role: string,
    isSpecialUnit?: boolean
  ): string[] => {
    if (isSpecialUnit) {
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
    arms_service: armsServiceOptions,
    role: roleOptions,
    deployment: deploymentOptions,
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

      },
    ]);
  };

  const validateAwards = () => {
    let hasError = false;
    const newErrors = awards.map(() => ({
      award_type: "",
      award_title: "",
      award_year: ""
    }));

    awards.forEach((award, idx) => {
      if (!award.award_type) {
        newErrors[idx].award_type = "Award type is required.";
        hasError = true;
      }

      if (!award.award_title) {
        newErrors[idx].award_title = "Award title is required.";
        hasError = true;
      }

      if (!award.award_year) {
        newErrors[idx].award_year = "Award year is required.";
        hasError = true;
      }


      if (award.award_title && award.award_year) {
        const isDuplicate = awards.some(
          (a, i) =>
            i !== idx &&
            a.award_year === award.award_year &&
            a.award_title === award.award_title
        );

        if (isDuplicate) {
          newErrors[idx].award_year = `Year ${award.award_year} is already selected for award "${award.award_title}".`;
          hasError = true;
        }
      }
    });

    setErrors(newErrors);
    return !hasError;
  };


  const formik: any = useFormik({
    initialValues: {
      unit: profile?.unit?.name ?? "",
      brigade: profile?.unit?.bde ?? "",
      division: profile?.unit?.div ?? "",
      corps: profile?.unit?.corps ?? "",
      command: profile?.unit?.comd ?? "",
      adm_channel: profile?.unit?.adm_channel ?? "",
      tech_channel: profile?.unit?.tech_channel ?? "",
      unit_type: profile?.unit?.unit_type ?? "",
      matrix_unit: profile?.unit?.matrix_unit ?? "",
      location: profile?.unit?.location ?? "",
      start_month: profile?.unit?.start_month ?? "",
      start_year: profile?.unit?.start_year ?? "",
      end_month: profile?.unit?.end_month ?? "",
      end_year: profile?.unit?.end_year ?? "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      start_month: Yup.string()
        .when([], {
          is: () => role === 'unit',
          then: (schema) => schema.required('Start month is required'),
          otherwise: (schema) => schema,
        })
        .test('date-range', 'Start date cannot be after end date', function(value) {
        const { start_year, end_month, end_year } = this.parent;
        
        if (!value || !start_year || !end_month || !end_year) {
          return true; // Allow empty fields
        }
        
        const startDate = new Date(parseInt(start_year), parseInt(value) - 1);
        const endDate = new Date(parseInt(end_year), parseInt(end_month) - 1);
        
        return startDate <= endDate;
      }),
      start_year: Yup.string()
        .when([], {
          is: () => role === 'unit',
          then: (schema) => schema.required('Start year is required'),
          otherwise: (schema) => schema,
        })
        .test('date-range', 'Start date cannot be after end date', function(value) {
        const { start_month, end_month, end_year } = this.parent;
        
        if (!value || !start_month || !end_month || !end_year) {
          return true; // Allow empty fields
        }
        
        const startDate = new Date(parseInt(value), parseInt(start_month) - 1);
        const endDate = new Date(parseInt(end_year), parseInt(end_month) - 1);
        
        return startDate <= endDate;
      }),
      end_month: Yup.string()
        .when([], {
          is: () => role === 'unit',
          then: (schema) => schema.required('End month is required'),
          otherwise: (schema) => schema,
        })
        .test('date-range', 'End date cannot be before start date', function(value) {
        const { start_month, start_year, end_year } = this.parent;
        
        if (!value || !start_month || !start_year || !end_year) {
          return true; // Allow empty fields
        }
        
        const startDate = new Date(parseInt(start_year), parseInt(start_month) - 1);
        const endDate = new Date(parseInt(end_year), parseInt(value) - 1);
        
        return endDate >= startDate;
      }),
      end_year: Yup.string()
        .when([], {
          is: () => role === 'unit',
          then: (schema) => schema.required('End year is required'),
          otherwise: (schema) => schema,
        })
        .test('date-range', 'End date cannot be before start date', function(value) {
        const { start_month, start_year, end_month } = this.parent;
        
        if (!value || !start_month || !start_year || !end_month) {
          return true; // Allow empty fields
        }
        
        const startDate = new Date(parseInt(start_year), parseInt(start_month) - 1);
        const endDate = new Date(parseInt(value), parseInt(end_month) - 1);
        
        return endDate >= startDate;
      })
    }),
    onSubmit: async (values: any, { resetForm }) => {
      try {
        if (!isDeclarationChecked) {
          toast.error("Please agree to the declaration before submitting.");
          return;
        }
        const role = profile?.user?.user_role ?? "";
        const visibleFields = getVisibleFields(role);

        const fieldMap: Record<string, string> = {
          unit: "name",
          brigade: "bde",
          division: "div",
          corps: "corps",
          command: "comd",
        };

        const payload: any = {};
        let matrixUnit = "";
        Object.entries(fieldMap).forEach(([formField, backendField]) => {
          if (visibleFields.includes(formField)) {
            payload[backendField] = values[formField];
          } else {
            payload[backendField] = null;
          }
        });

        if (Array.isArray(values.matrix_unit)) {
          matrixUnit = values.matrix_unit.join(",");
        } else if (typeof values.matrix_unit === "string" && values.matrix_unit.length > 0) {
          matrixUnit = values.matrix_unit;
        }

        payload["adm_channel"] = values.adm_channel;
        payload["tech_channel"] = values.tech_channel;
        payload["unit_type"] = values.unit_type;
        payload["matrix_unit"] = matrixUnit;
        payload["location"] = values.location;
        payload["awards"] = awards;
        

        if (role === "unit") {
          payload["start_month"] = values.start_month;
          payload["start_year"] = values.start_year;
          payload["end_month"] = values.end_month;
          payload["end_year"] = values.end_year;
        }

        const resultAction = await dispatch(reqToUpdateUnitProfile(payload));
        const result = unwrapResult(resultAction);

        if (result.success) {
          resetForm();
          await dispatch(getProfile());
          if ((role || "").toLowerCase() === "unit") {
            navigate("/");
          }
        }
      } catch (err) {
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

  const handlePresidingChange = (field: keyof Officer, value: string) => {
    setPresidingOfficer((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // const validateDateRange = (startMonth: string, startYear: string, endMonth: string, endYear: string) => {
  //   if (!startMonth || !startYear || !endMonth || !endYear) return true;
    
  //   const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1);
  //   const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1);
    
  //   return startDate <= endDate;
  // };

  const handleDateFieldChange = (field: string, value: string) => {
    formik.setFieldValue(field, value);
    

    setTimeout(() => {
      formik.validateForm();
    }, 0);
  };

  const buildUnitPayload = (
    members?: UpdateUnitProfileRequest["members"]
  ): UpdateUnitProfileRequest => ({
    name: profile?.unit?.name ?? "",
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

  // Helpers to avoid deep inline nesting in JSX handlers
  const handleRemoveAward = (index: number) => {
    setAwards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAward = () => {
    setAwards((prev) => [
      ...prev,
      { award_type: "GOC-in-C", award_title: "", award_year: "" },
    ]);
  };


  if (firstLoad) return <Loader />;

  return (
    <div className="profile-settings-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Profile Settings" />
      </div>

      {/* Profile Settings */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const awardsValid = validateAwards();
          if (!awardsValid) return;
          formik.handleSubmit();
        }}
        className="mb-5">
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
                }[profile?.user?.user_role ?? "unit"] ?? []
                : optionsMap[field] ?? [];

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
                return `${roleLabel} Name`;
              }

              if (field === "unit_type") {
                return "Arm / Service";
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
                    <p className="error-text">
                      {formik.errors[field]}
                    </p>
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
                      ) ?? null
                  }
                  onChange={(selectedOption: any) => {
                    const selectedValue =
                      field === "matrix_unit"
                        ? selectedOption.map((opt: any) => opt.value)
                        : selectedOption?.value ?? "";

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
          {role=='unit' && (
            <div className="col-12 mb-3">
              <div className="mb-2">
                <label className="form-label fw-semibold">Period Covered</label>
              </div>
              <div className="row">
                <div className="col-md-3 mb-2">
                  <FormSelect
                    label="Start Month"
                    name="start_month"
                    options={[
                      { value: "01", label: "January" },
                      { value: "02", label: "February" },
                      { value: "03", label: "March" },
                      { value: "04", label: "April" },
                      { value: "05", label: "May" },
                      { value: "06", label: "June" },
                      { value: "07", label: "July" },
                      { value: "08", label: "August" },
                      { value: "09", label: "September" },
                      { value: "10", label: "October" },
                      { value: "11", label: "November" },
                      { value: "12", label: "December" },
                    ]}
                    value={
                      [
                        { value: "01", label: "January" },
                        { value: "02", label: "February" },
                        { value: "03", label: "March" },
                        { value: "04", label: "April" },
                        { value: "05", label: "May" },
                        { value: "06", label: "June" },
                        { value: "07", label: "July" },
                        { value: "08", label: "August" },
                        { value: "09", label: "September" },
                        { value: "10", label: "October" },
                        { value: "11", label: "November" },
                        { value: "12", label: "December" },
                      ].find((opt) => opt.value === formik.values.start_month) ?? null
                    }
                    onChange={(selectedOption) => {
                      handleDateFieldChange("start_month", selectedOption?.value ?? "");
                    }}
                    placeholder="Select Month"
                  />
                  {(formik.submitCount > 0 || formik.touched.start_month) && formik.errors.start_month && (
                    <p className="error-text">{formik.errors.start_month}</p>
                  )}
                </div>
                <div className="col-md-3 mb-2">
                  <FormSelect
                    label="Start Year"
                    name="start_year"
                    options={[
                      { value: String(currentYear), label: String(currentYear) },
                      { value: String(currentYear - 1), label: String(currentYear - 1) },
                      { value: String(currentYear - 2), label: String(currentYear - 2) },
                      { value: String(currentYear - 3), label: String(currentYear - 3) },
                    ]}
                    value={
                      [
                        { value: String(currentYear), label: String(currentYear) },
                        { value: String(currentYear - 1), label: String(currentYear - 1) },
                        { value: String(currentYear - 2), label: String(currentYear - 2) },
                        { value: String(currentYear - 3), label: String(currentYear - 3) },
                      ].find((opt) => opt.value === formik.values.start_year) ?? null
                    }
                    onChange={(selectedOption) => {
                      handleDateFieldChange("start_year", selectedOption?.value ?? "");
                    }}
                    placeholder="Select Year"
                  />
                  {(formik.submitCount > 0 || formik.touched.start_year) && formik.errors.start_year && (
                    <p className="error-text">{formik.errors.start_year}</p>
                  )}
                </div>
                <div className="col-md-1 mb-2 d-flex align-items-end justify-content-center">
                  <span className="fw-semibold text-muted">to</span>
                </div>
                <div className="col-md-2 mb-2">
                  <FormSelect
                    label="End Month"
                    name="end_month"
                    options={[
                      { value: "01", label: "January" },
                      { value: "02", label: "February" },
                      { value: "03", label: "March" },
                      { value: "04", label: "April" },
                      { value: "05", label: "May" },
                      { value: "06", label: "June" },
                      { value: "07", label: "July" },
                      { value: "08", label: "August" },
                      { value: "09", label: "September" },
                      { value: "10", label: "October" },
                      { value: "11", label: "November" },
                      { value: "12", label: "December" },
                    ]}
                    value={
                      [
                        { value: "01", label: "January" },
                        { value: "02", label: "February" },
                        { value: "03", label: "March" },
                        { value: "04", label: "April" },
                        { value: "05", label: "May" },
                        { value: "06", label: "June" },
                        { value: "07", label: "July" },
                        { value: "08", label: "August" },
                        { value: "09", label: "September" },
                        { value: "10", label: "October" },
                        { value: "11", label: "November" },
                        { value: "12", label: "December" },
                      ].find((opt) => opt.value === formik.values.end_month) ?? null
                    }
                    onChange={(selectedOption) => {
                      handleDateFieldChange("end_month", selectedOption?.value ?? "");
                    }}
                    placeholder="Select Month"
                  />
                  {(formik.submitCount > 0 || formik.touched.end_month) && formik.errors.end_month && (
                    <p className="error-text">{formik.errors.end_month}</p>
                  )}
                </div>
                <div className="col-md-3 mb-2">
                  <FormSelect
                    label="End Year"
                    name="end_year"
                    options={[
                      { value: String(currentYear), label: String(currentYear) },
                      { value: String(currentYear - 1), label: String(currentYear - 1) },
                      { value: String(currentYear - 2), label: String(currentYear - 2) },
                      { value: String(currentYear - 3), label: String(currentYear - 3) },
                    ]}
                    value={
                      [
                        { value: String(currentYear), label: String(currentYear) },
                        { value: String(currentYear - 1), label: String(currentYear - 1) },
                        { value: String(currentYear - 2), label: String(currentYear - 2) },
                        { value: String(currentYear - 3), label: String(currentYear - 3) },
                      ].find((opt) => opt.value === formik.values.end_year) ?? null
                    }
                    onChange={(selectedOption) => {
                      handleDateFieldChange("end_year", selectedOption?.value ?? "");
                    }}
                    placeholder="Select Year"
                  />
                  {(formik.submitCount > 0 || formik.touched.end_year) && formik.errors.end_year && (
                    <p className="error-text">{formik.errors.end_year}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {role === "unit" && (
            <div className="col-12 mb-3">
              <span className="form-label fw-6">Awards Received</span>
              <table className="table table-bordered">
                <tbody style={{ backgroundColor: "#007bff" }}>
                  {awards.map((award, idx) => (
                    <tr key={award.award_id ?? idx} >
                      <td style={{ color: "white" }}>
                        <select
                          className={`form-select ${errors[idx]?.award_type ? "invalid" : ""}`}
                          value={award.award_type}
                          onChange={(e) => {
                            const updated = [...awards];
                            updated[idx].award_type = e.target.value as
                              | "GOC-in-C"
                              | "COAS"
                              | "CDS"
                              | "VCOAS"
                              | "CINCAN";
                            setAwards(updated);
                          }}
                        >
                          <option value="CDS">CDS</option>
                          <option value="COAS">COAS</option>
                          <option value="GOC-in-C">GOC-in-C</option>
                          <option value="VCOAS">VCOAS</option>
                          <option value="CINCAN">CINCAN</option>
                        </select>
                        {errors[idx]?.award_type && (
                          <p className="error-text">{errors[idx].award_type}</p>
                        )}
                      </td>
                      <td style={{ color: "white" }}>
                        <select
                          className={`form-select ${errors[idx]?.award_title ? "invalid" : ""}`}
                          value={award.award_title}
                          onChange={(e) => {
                            const updated = [...awards];
                            updated[idx].award_title = e.target.value as
                              | "citation"
                              | "appreciation";
                            setAwards(updated);
                          }}
                        >
                          <option value="">Select Award Title</option>
                          <option value="citation">Citation</option>
                          <option value="appreciation">Appreciation</option>
                        </select>
                        {errors[idx]?.award_title && (
                          <p className="error-text">{errors[idx].award_title}</p>
                        )}
                      </td>
                      <td style={{ color: "white" }}>
                        <select
                          className={`form-select ${errors[idx]?.award_year ? "invalid" : ""}`}
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
                        {errors[idx]?.award_year && (
                          <p className="error-text">{errors[idx].award_year}</p>
                        )}
                      </td>
                      <td style={{ color: "white" }}>
                        <button
                          type="button"
                          className="_btn danger btn-sm"
                          onClick={() => handleRemoveAward(idx)}
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
                style={{
                  background: "#9c9c9cff",
                  color: "#fff",
                  borderRadius: "20px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                  boxShadow: "0 2px 8px rgba(59,130,246,0.15)",
                  border: "none",
                  padding: 0,
                }}
                onClick={handleAddAward}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5em" }}>
                  <FaPlus />
                </span>
              </button>
            </div>
          )}
          {!isMember && !["mo", "ol"].includes(cw2_type) && (
            <div className="col-12 mt-3">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="declarationCheckbox"
                  checked={isDeclarationChecked}
                  onChange={handleCheckboxChange}
                />
                <label className="form-check-label" htmlFor="declarationCheckbox">
                  I agree and declare that the information of Hierarchy/Channel of reporting filled by me is accurate and up-to-date.
                </label>
              </div>
            </div>
          )}
          {!isDisabled && role !== "cw2" && (
            <div className="col-12 mt-2">
              <div className="d-flex align-items-center">
                <button
                  type="submit"
                  className="_btn _btn-lg primary"
                  disabled={formik.isSubmitting}
                >
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
          )}
        </div>
      </form>

      {!["unit", "headquarter"].includes(role) && (
        <>
          {!isMember && (
            <>
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
                    !presidingOfficer.name ||
                    !presidingOfficer.appointment
                  ) {
                    toast.error(
                      "Please fill all required fields (IC Number, Rank, Name, and Appointment) for Presiding Officer."
                    );
                    return;
                  }


                  if (presidingOfficer.icNumber && !/^IC-\d{5}[A-Z]$/.test(presidingOfficer.icNumber)) {
                    toast.error("Invalid IC number format. Must be in format IC-XXXXX[A-Z] where XXXXX are 5 digits and last character is any alphabet.");
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
                  }
                }}
              >
                <div className="row">
                  <div className="col-sm-6 mb-3">
                    <ICNumberInput
                      label="IC Number"
                      name="icNumber"
                      placeholder="Enter 5 digits and alphabet (e.g., 87878K)"
                      value={presidingOfficer.icNumber}
                      onChange={(value) =>
                        handlePresidingChange("icNumber", value)
                      }
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <FormSelect
                      label="Rank"
                      name="rank"
                      options={rank}
                      value={rank.find((opt: any) => opt.value === presidingOfficer.rank) ?? null}
                      onChange={(selected: any) =>
                        handlePresidingChange("rank", selected?.value ?? "")
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


                  const invalidOfficers = officers.filter(officer => 
                    !officer.icNumber || officer.icNumber.trim() === "" ||
                    !officer.rank || officer.rank.trim() === "" ||
                    !officer.name || officer.name.trim() === "" ||
                    !officer.appointment || officer.appointment.trim() === ""
                  );

                  if (invalidOfficers.length > 0) {
                    toast.error("All Member Officers must have complete information (IC Number, Rank, Name, and Appointment). Please fill all required fields.");
                    return;
                  }


                  const invalidICNumbers = officers.filter(officer => 
                    officer.icNumber && !/^IC-\d{5}[A-Z]$/.test(officer.icNumber)
                  );

                  if (invalidICNumbers.length > 0) {
                    toast.error("Invalid IC number format. Must be in format IC-XXXXX[A-Z] where XXXXX are 5 digits and last character is any alphabet.");
                    return;
                  }

                  const officersPayload: UpdateUnitProfileRequest["members"] =
                    officers.map((officer, index) => ({
                      ...(officer.id ? { id: officer.id } : {}),
                      member_type: "member_officer",
                      member_order: String(index + 1),
                      ic_number: officer.icNumber,
                      rank: officer.rank,
                      name: officer.name,
                      appointment: officer.appointment,

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
                  }
                }}
              >
                {officers.map((officer, index) => (
                  <div key={officer.id} className="mb-4">
                    <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-3">
                      <Breadcrumb title={`Member Officer ${index + 1}`} />
                    </div>
                    <div className="row">
                      <div className="col-sm-6 mb-3">
                        <ICNumberInput
                          label="IC Number"
                          name={`icNumber-${index}`}
                          placeholder="Enter 5 digits and alphabet (e.g., 87878K)"
                          value={officer.icNumber}
                          onChange={(value) =>
                            handleChange(index, "icNumber", value)
                          }
                        />
                      </div>
                      <div className="col-sm-6 mb-3">
                        <FormSelect
                          label="Rank"
                          name={`rank-${index}`}
                          options={rank}
                          value={rank.find((opt: any) => opt.value === officer.rank) ?? null}
                          onChange={(selected: any) =>
                            handleChange(index, "rank", selected?.value ?? "")
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

              {officers.length > 0 && (
                <div className="my-4">
                  <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-3">
                    <Breadcrumb title="Member Officers List" />
                  </div>
                  <div className="table-responsive mt-4">
                    <table className="table-style-1 w-100">
                      <thead style={{ backgroundColor: "#007bff" }}>
                        <tr>
                          <th style={{ color: "white" }}>#</th>
                          <th style={{ color: "white" }}>Rank</th>
                          <th style={{ color: "white" }}>Name</th>
                          <th style={{ color: "white" }}>Appointment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {officers.map((officer, index) => (
                          <tr key={officer.id ?? index}>
                            <td>{index + 1}</td>
                            <td>{officer.rank}</td>
                            <td>{officer.name}</td>
                            <td>{officer.appointment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {["brigade", "division", "corps", "command"].includes(role) && (
        <>

          {profile?.user?.is_member_added ? (
            <>
              <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
                <Breadcrumb title="Staff Officer Register" />
              </div>
              <div className="mb-5">
                <div className="row">
                  <div className="col-sm-6 mb-3">
                    <FormInput
                      label="Registered Member Username"
                      name="memberUsername"
                      value={profile.user.member_username ?? ""}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </>
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
