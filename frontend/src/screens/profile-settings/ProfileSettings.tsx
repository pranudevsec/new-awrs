import React, { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { unwrapResult } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';
import * as Yup from 'yup';

import FormSelect from '../../components/form/FormSelect';
import Breadcrumb from '../../components/ui/breadcrumb/Breadcrumb';
import Loader from '../../components/ui/loader/Loader';
import FormInput from '../../components/form/FormInput';
import ICNumberInput from '../../components/form/ICNumberInput';

import type { UpdateUnitProfileRequest } from '../../reduxToolkit/services/auth/authInterface';
import { useAppSelector, useAppDispatch } from '../../reduxToolkit/hooks';
import {
  getProfile,
  reqToUpdateUnitProfile,
} from '../../reduxToolkit/services/auth/authService';
import {
  hierarchicalStructure,
  unitTypeOptions,
  matrixUnitOptions,
  rank,
} from '../../data/options';
import { useMasterData } from '../../hooks/useMasterData';

type OptionType = { value: string; label: string };

interface Officer {
  officerKey: string;
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

interface FormValues {
  unit: string;
  brigade: string;
  division: string;
  corps: string;
  command: string;
  adm_channel: string;
  tech_channel: string;
  unit_type: string;
  matrix_unit: string | string[];
  location: string;
  start_month: string;
  start_year: string;
  end_month: string;
  end_year: string;
}

const hierarchyMap: Record<string, string[]> = {};
hierarchicalStructure.forEach(([command, corps, division, brigade, unit]) => {
  hierarchyMap[command] = [corps, division, brigade, unit];
});

const ProfileSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { profile } = useAppSelector((state: any) => state.admin);

  const {
    brigadeOptions,
    corpsOptions,
    commandOptions,
    divisionOptions,
    armsServiceOptions,
    roleOptions,
    deploymentOptions,
    unitOptions,
  } = useMasterData();

  const isMember = profile?.user?.is_member ?? false;
  const role = (profile?.user?.user_role?.toLowerCase() ?? '') as string;
  const cw2_type = (profile?.user?.cw2_type?.toLowerCase() ?? '') as string;
  const is_member_added = profile?.user?.is_member_added ?? false;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 79 }, (_, i) => `${currentYear - i}`);

  const [firstLoad, setFirstLoad] = useState(true);
  const [awards, setAwards] = useState<Award[]>([]);
  const [presidingOfficer, setPresidingOfficer] = useState<Omit<Officer, 'officerKey'>>({
    id: undefined,
    serialNumber: '',
    icNumber: '',
    rank: '',
    name: '',
    appointment: '',
  });
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isDeclarationChecked, setIsDeclarationChecked] = useState(false);
  const [awardErrors, setAwardErrors] = useState<
    Array<{ award_type: string; award_title: string; award_year: string }>
  >([]);

  useEffect(() => {
    if (!profile?.unit) return;

    const loadedAwards: Award[] =
      profile.unit.awards?.map((a: any) => ({
        award_id: a.award_id ?? undefined,
        award_type: a.award_type ?? 'GOC-in-C',
        award_title: a.award_title ?? '',
        award_year: a.award_year ?? '',
      })) ?? [];
    setAwards(loadedAwards);

    const presiding = profile.unit.members?.find(
      (m: any) => m.member_type === 'presiding_officer',
    );
    if (presiding) {
      setPresidingOfficer({
        id: presiding.id ?? undefined,
        serialNumber: presiding.member_order ?? '',
        icNumber: presiding.ic_number ?? '',
        rank: presiding.rank ?? '',
        name: presiding.name ?? '',
        appointment: presiding.appointment ?? '',
      });
    }

    const other = profile.unit.members
      ?.filter((m: any) => m.member_type !== 'presiding_officer')
      .map((m: any) => ({
        officerKey: m.id ?? crypto.randomUUID(),
        id: m.id ?? undefined,
        serialNumber: m.member_order ?? '',
        icNumber: m.ic_number ?? '',
        rank: m.rank ?? '',
        name: m.name ?? '',
        appointment: m.appointment ?? '',
      })) ?? [];

    setOfficers(
      other.length > 0
        ? other
        : [
            {
              officerKey: crypto.randomUUID(),
              serialNumber: '',
              icNumber: '',
              rank: '',
              name: '',
              appointment: '',
            },
          ],
    );

    setFirstLoad(false);
  }, [profile]);

  const getVisibleFields = (r: string, isSpecial?: boolean): (keyof FormValues)[] => {
    if (isSpecial) {
      switch (r) {
        case 'unit':
          return ['command', 'location', 'matrix_unit', 'unit_type', 'unit'].reverse() as any;
        case 'brigade':
        case 'division':
        case 'corps':
        case 'command':
          return ['unit'].reverse() as any;
        default:
          return [];
      }
    }

    switch (r) {
      case 'unit':
        return [
          'brigade',
          'division',
          'corps',
          'command',
          'location',
          'matrix_unit',
          'unit_type',
          'unit',
        ].reverse() as any;
      case 'brigade':
        return ['unit', 'division', 'corps', 'command'].reverse() as any;
      case 'division':
        return ['unit', 'corps', 'command'].reverse() as any;
      case 'corps':
        return ['unit', 'command'].reverse() as any;
      case 'command':
        return ['unit'].reverse() as any;
      default:
        return [];
    }
  };

  const visibleFields = getVisibleFields(role, profile?.user?.is_special_unit);

  type OptionsMap = Record<string, OptionType[]>;
  const optionsMap: OptionsMap = {
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

  const getPlaceholder = (r: string, f: string) => {
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    return f === 'unit' ? `Select ${cap(r)}` : `Select ${cap(f)}`;
  };

  const handleOfficerChange = useCallback(
    (officerKey: string, field: keyof Omit<Officer, 'officerKey'>, value: string) => {
      setOfficers(prev =>
        prev.map(o =>
          o.officerKey === officerKey ? { ...o, [field]: value } : o,
        ),
      );
    },
    [],
  );

  const handleAddOfficer = useCallback((e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setOfficers(prev => [
      ...prev,
      {
        officerKey: crypto.randomUUID(),
        serialNumber: '',
        icNumber: '',
        rank: '',
        name: '',
        appointment: '',
      },
    ]);
  }, []);

  const handleRemoveOfficer = useCallback((officerKey: string) => {
    setOfficers(prev => prev.filter(o => o.officerKey !== officerKey));
  }, []);

  const validateAwards = useCallback(() => {
    const errors: typeof awardErrors = awards.map(() => ({
      award_type: '',
      award_title: '',
      award_year: '',
    }));
    let hasError = false;

    awards.forEach((a, i) => {
      if (!a.award_type) {
        errors[i].award_type = 'Award type is required.';
        hasError = true;
      }
      if (!a.award_title) {
        errors[i].award_title = 'Award title is required.';
        hasError = true;
      }
      if (!a.award_year) {
        errors[i].award_year = 'Award year is required.';
        hasError = true;
      }

      const isDuplicate = awards.some(
        (b, j) =>
          j !== i &&
          b.award_year === a.award_year &&
          b.award_title === a.award_title,
      );
      if (isDuplicate) {
        errors[i].award_year = `Year ${a.award_year} already used for "${a.award_title}".`;
        hasError = true;
      }
    });

    setAwardErrors(errors);
    return !hasError;
  }, [awards]);

  const handleAddAward = useCallback(() => {
    setAwards(prev => [
      ...prev,
      { award_type: 'GOC-in-C', award_title: '', award_year: '' },
    ]);
  }, []);

  const handleRemoveAward = useCallback((idx: number) => {
    setAwards(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const formik = useFormik<FormValues>({
    initialValues: {
      unit: profile?.unit?.name ?? '',
      brigade: profile?.unit?.bde ?? '',
      division: profile?.unit?.div ?? '',
      corps: profile?.unit?.corps ?? '',
      command: profile?.unit?.comd ?? '',
      adm_channel: profile?.unit?.adm_channel ?? '',
      tech_channel: profile?.unit?.tech_channel ?? '',
      unit_type: profile?.unit?.unit_type ?? '',
      matrix_unit: profile?.unit?.matrix_unit ?? '',
      location: profile?.unit?.location ?? '',
      start_month: profile?.unit?.start_month ?? '',
      start_year: profile?.unit?.start_year ?? '',
      end_month: profile?.unit?.end_month ?? '',
      end_year: profile?.unit?.end_year ?? '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      start_month: Yup.string()
        .when([], {
          is: () => role === 'unit',
          then: schema => schema.required('Start month is required'),
        })
        .test('date-range', 'Start date cannot be after end date', function (value) {
          const { start_year, end_month, end_year } = this.parent;
          if (!value || !start_year || !end_month || !end_year) return true;
          const start = new Date(parseInt(start_year), parseInt(value) - 1);
          const end = new Date(parseInt(end_year), parseInt(end_month) - 1);
          return start <= end;
        }),
      start_year: Yup.string()
        .when([], {
          is: () => role === 'unit',
          then: schema => schema.required('Start year is required'),
        })
        .test('date-range', 'Start date cannot be after end date', function (value) {
          const { start_month, end_month, end_year } = this.parent;
          if (!value || !start_month || !end_month || !end_year) return true;
          const start = new Date(parseInt(value), parseInt(start_month) - 1);
          const end = new Date(parseInt(end_year), parseInt(end_month) - 1);
          return start <= end;
        }),
      end_month: Yup.string()
        .when([], {
          is: () => role === 'unit',
          then: schema => schema.required('End month is required'),
        })
        .test('date-range', 'End date cannot be before start date', function (value) {
          const { start_month, start_year, end_year } = this.parent;
          if (!value || !start_month || !start_year || !end_year) return true;
          const start = new Date(parseInt(start_year), parseInt(start_month) - 1);
          const end = new Date(parseInt(end_year), parseInt(value) - 1);
          return end >= start;
        }),
      end_year: Yup.string()
        .when([], {
          is: () => role === 'unit',
          then: schema => schema.required('End year is required'),
        })
        .test('date-range', 'End date cannot be before start date', function (value) {
          const { start_month, start_year, end_month } = this.parent;
          if (!value || !start_month || !start_year || !end_month) return true;
          const start = new Date(parseInt(start_year), parseInt(start_month) - 1);
          const end = new Date(parseInt(value), parseInt(end_month) - 1);
          return end >= start;
        }),
    }),
    onSubmit: async (values) => {
      if (!isDeclarationChecked) {
        toast.error('Please agree to the declaration before submitting.');
        return;
      }

      const payload: any = {};
      const fieldMap: Record<keyof FormValues, string> = {
        unit: 'name',
        brigade: 'bde',
        division: 'div',
        corps: 'corps',
        command: 'comd',
        adm_channel: 'adm_channel',
        tech_channel: 'tech_channel',
        unit_type: 'unit_type',
        matrix_unit: 'matrix_unit',
        location: 'location',
        start_month: 'start_month',
        start_year: 'start_year',
        end_month: 'end_month',
        end_year: 'end_year',
      };

      visibleFields.forEach(f => {
        payload[fieldMap[f]] = values[f] ?? null;
      });

      const matrixUnit = Array.isArray(values.matrix_unit)
        ? values.matrix_unit.join(',')
        : values.matrix_unit ?? '';
      payload.matrix_unit = matrixUnit;

      payload.awards = awards;

      if (role === 'unit') {
        payload.start_month = values.start_month;
        payload.start_year = values.start_year;
        payload.end_month = values.end_month;
        payload.end_year = values.end_year;
      }

      try {
        const resultAction = await dispatch(reqToUpdateUnitProfile(payload));
        const result = unwrapResult(resultAction);
        if (result.success) {
          await dispatch(getProfile());
          if (role === 'unit') navigate('/');
        }
      } catch (err) {
        toast.error('Failed to update profile.');
      }
    },
  });

  const memberFormik = useFormik({
    initialValues: {
      memberUsername: '',
      memberPassword: '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      memberUsername: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .required('Username is required'),
      memberPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const resultAction = await dispatch(reqToUpdateUnitProfile(values));
        const result = unwrapResult(resultAction);
        if (result.success) {
          resetForm();
          await dispatch(getProfile());
        }
      } catch (err) {
        toast.error('Failed to register member.');
      }
    },
  });

  const handlePresidingChange = useCallback(
    (field: keyof typeof presidingOfficer, value: string) => {
      setPresidingOfficer(prev => ({ ...prev, [field]: value }));
    },
    [],
  );

  const buildUnitPayload = (
    members?: UpdateUnitProfileRequest['members'],
  ): UpdateUnitProfileRequest => ({
    name: profile?.unit?.name ?? '',
    adm_channel: profile?.unit?.adm_channel ?? null,
    tech_channel: profile?.unit?.tech_channel ?? null,
    bde: profile?.unit?.bde ?? null,
    div: profile?.unit?.div ?? null,
    corps: profile?.unit?.corps ?? null,
    comd: profile?.unit?.comd ?? null,
    unit_type: profile?.unit?.unit_type ?? null,
    matrix_unit:
      typeof profile?.unit?.matrix_unit === 'string'
        ? profile.unit.matrix_unit.split(',').map((v: string) => v.trim())
        : [],
    location: profile?.unit?.location ?? null,
    members,
  });

  const isDisabled = !!isMember;

  if (firstLoad) return <Loader />;

  return (
    <div className="profile-settings-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb title="Profile Settings" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!validateAwards()) return;
          formik.handleSubmit();
        }}
        className="mb-5"
      >
        <div className="row">
          {visibleFields.map((field) => {
            const options = field === 'unit' ? unitOptions : optionsMap[field] ?? [];

            const getLabel = () => {
              if (field === 'unit') return `${role.charAt(0).toUpperCase() + role.slice(1)} Name`;
              if (field === 'unit_type') return 'Arm / Service';
              if (field === 'matrix_unit') return 'Role / Deployment';
              return field
                .split('_')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            };

            return options.length > 0 ? (
              <div className="col-sm-6 mb-3" key={field}>
                <FormSelect
                  isMulti={field === 'matrix_unit'}
                  label={getLabel()}
                  name={field}
                  options={options}
                  value={
                    field === 'matrix_unit'
                      ? Array.isArray(formik.values[field])
                        ? options.filter(o =>
                            (formik.values[field] as string[]).includes(o.value),
                          )
                        : []
                      : options.find(o => o.value === formik.values[field]) ?? null
                  }
                  onChange={(selected: OptionType | OptionType[] | null) => {
                    const val =
                      field === 'matrix_unit'
                        ? Array.isArray(selected)
                          ? selected.map(o => o.value)
                          : []
                        : (selected as OptionType)?.value ?? '';

                    if (field === 'command' && typeof val === 'string' && hierarchyMap[val]) {
                      const [c, d, b] = hierarchyMap[val];
                      formik.setFieldValue('corps', c);
                      formik.setFieldValue('division', d);
                      formik.setFieldValue('brigade', b);
                    }
                    formik.setFieldValue(field, val);
                  }}
                  placeholder={getPlaceholder(role, field)}
                  errors={formik.errors[field] as string | undefined}
                  touched={formik.touched[field] as boolean | undefined}
                  isDisabled={isDisabled}
                />
              </div>
            ) : (
              <div className="col-sm-6 mb-3" key={field}>
                <label className="form-label mb-1">{getLabel()}</label>
                <input
                  type="text"
                  className={`form-control ${
                    formik.touched[field] && formik.errors[field] ? 'is-invalid' : ''
                  }`}
                  value={formik.values[field]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={`Enter ${getLabel()}`}
                  disabled={isDisabled}
                />
                {formik.touched[field] && formik.errors[field] && (
                  <p className="error-text">{formik.errors[field] as string}</p>
                )}
              </div>
            );
          })}

          {role === 'unit' && (
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
                      { value: '01', label: 'January' },
                      { value: '02', label: 'February' },
                      { value: '03', label: 'March' },
                      { value: '04', label: 'April' },
                      { value: '05', label: 'May' },
                      { value: '06', label: 'June' },
                      { value: '07', label: 'July' },
                      { value: '08', label: 'August' },
                      { value: '09', label: 'September' },
                      { value: '10', label: 'October' },
                      { value: '11', label: 'November' },
                      { value: '12', label: 'December' },
                    ]}
                    value={
                      [
                        { value: '01', label: 'January' },
                        { value: '02', label: 'February' },
                        { value: '03', label: 'March' },
                        { value: '04', label: 'April' },
                        { value: '05', label: 'May' },
                        { value: '06', label: 'June' },
                        { value: '07', label: 'July' },
                        { value: '08', label: 'August' },
                        { value: '09', label: 'September' },
                        { value: '10', label: 'October' },
                        { value: '11', label: 'November' },
                        { value: '12', label: 'December' },
                      ].find(opt => opt.value === formik.values.start_month) ?? null
                    }
                    onChange={(opt) =>
                      formik.setFieldValue('start_month', opt?.value ?? '')
                    }
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
                      ].find(opt => opt.value === formik.values.start_year) ?? null
                    }
                    onChange={(opt) =>
                      formik.setFieldValue('start_year', opt?.value ?? '')
                    }
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
                      { value: '01', label: 'January' },
                      { value: '02', label: 'February' },
                      { value: '03', label: 'March' },
                      { value: '04', label: 'April' },
                      { value: '05', label: 'May' },
                      { value: '06', label: 'June' },
                      { value: '07', label: 'July' },
                      { value: '08', label: 'August' },
                      { value: '09', label: 'September' },
                      { value: '10', label: 'October' },
                      { value: '11', label: 'November' },
                      { value: '12', label: 'December' },
                    ]}
                    value={
                      [
                        { value: '01', label: 'January' },
                        { value: '02', label: 'February' },
                        { value: '03', label: 'March' },
                        { value: '04', label: 'April' },
                        { value: '05', label: 'May' },
                        { value: '06', label: 'June' },
                        { value: '07', label: 'July' },
                        { value: '08', label: 'August' },
                        { value: '09', label: 'September' },
                        { value: '10', label: 'October' },
                        { value: '11', label: 'November' },
                        { value: '12', label: 'December' },
                      ].find(opt => opt.value === formik.values.end_month) ?? null
                    }
                    onChange={(opt) =>
                      formik.setFieldValue('end_month', opt?.value ?? '')
                    }
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
                      ].find(opt => opt.value === formik.values.end_year) ?? null
                    }
                    onChange={(opt) =>
                      formik.setFieldValue('end_year', opt?.value ?? '')
                    }
                    placeholder="Select Year"
                  />
                  {(formik.submitCount > 0 || formik.touched.end_year) && formik.errors.end_year && (
                    <p className="error-text">{formik.errors.end_year}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {role === 'unit' && (
            <div className="col-12 mb-3">
              <span className="form-label fw-6">Awards Received</span>
              <table className="table table-bordered">
                <tbody style={{ backgroundColor: '#007bff' }}>
                  {awards.map((award, idx) => (
                    <tr key={award.award_id ?? idx}>
                      <td style={{ color: 'white' }}>
                        <select
                          className={`form-select ${awardErrors[idx]?.award_type ? 'is-invalid' : ''}`}
                          value={award.award_type}
                          onChange={(e) => {
                            setAwards(prev => {
                              const copy = [...prev];
                              copy[idx].award_type = e.target.value as any;
                              return copy;
                            });
                          }}
                        >
                          <option value="CDS">CDS</option>
                          <option value="COAS">COAS</option>
                          <option value="GOC-in-C">GOC-in-C</option>
                          <option value="VCOAS">VCOAS</option>
                          <option value="CINCAN">CINCAN</option>
                        </select>
                        {awardErrors[idx]?.award_type && (
                          <p className="error-text">{awardErrors[idx].award_type}</p>
                        )}
                      </td>
                      <td style={{ color: 'white' }}>
                        <select
                          className={`form-select ${awardErrors[idx]?.award_title ? 'is-invalid' : ''}`}
                          value={award.award_title}
                          onChange={(e) => {
                            setAwards(prev => {
                              const copy = [...prev];
                              copy[idx].award_title = e.target.value;
                              return copy;
                            });
                          }}
                        >
                          <option value="">Select Award Title</option>
                          <option value="citation">Citation</option>
                          <option value="appreciation">Appreciation</option>
                        </select>
                        {awardErrors[idx]?.award_title && (
                          <p className="error-text">{awardErrors[idx].award_title}</p>
                        )}
                      </td>
                      <td style={{ color: 'white' }}>
                        <select
                          className={`form-select ${awardErrors[idx]?.award_year ? 'is-invalid' : ''}`}
                          value={award.award_year}
                          onChange={(e) => {
                            setAwards(prev => {
                              const copy = [...prev];
                              copy[idx].award_year = e.target.value;
                              return copy;
                            });
                          }}
                        >
                          <option value="">Select Year</option>
                          {yearOptions.map(year => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                        {awardErrors[idx]?.award_year && (
                          <p className="error-text">{awardErrors[idx].award_year}</p>
                        )}
                      </td>
                      <td style={{ color: 'white' }}>
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
                  background: '#9c9c9cff',
                  color: '#fff',
                  borderRadius: '20px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  boxShadow: '0 2px 8px rgba(59,130,246,0.15)',
                  border: 'none',
                  padding: 0,
                }}
                onClick={handleAddAward}
              >
                <FaPlus />
              </button>
            </div>
          )}

          {!isMember && !['mo', 'ol'].includes(cw2_type) && (
            <div className="col-12 mt-3">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="declarationCheckbox"
                  checked={isDeclarationChecked}
                  onChange={(e) => setIsDeclarationChecked(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="declarationCheckbox">
                  I agree and declare that the information of Hierarchy/Channel of
                  reporting filled by me is accurate and up-to-date.
                </label>
              </div>
            </div>
          )}

          {!isDisabled && role !== 'cw2' && (
            <div className="col-12 mt-2">
              <button
                type="submit"
                className="_btn _btn-lg primary"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Presiding Officer & Member Officers (Edit Mode) */}
      {!['unit', 'headquarter'].includes(role) && !isMember && (
        <>
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
                toast.error('Please fill all required fields for Presiding Officer.');
                return;
              }

              if (!/^IC-\d{5}[A-Z]$/.test(presidingOfficer.icNumber)) {
                toast.error('Invalid IC number format. Must be IC-XXXXX[A-Z]');
                return;
              }

              const payload = buildUnitPayload([
                {
                  ...(presidingOfficer.id ? { id: presidingOfficer.id } : {}),
                  member_type: 'presiding_officer',
                  member_order: '',
                  ic_number: presidingOfficer.icNumber,
                  rank: presidingOfficer.rank,
                  name: presidingOfficer.name,
                  appointment: presidingOfficer.appointment,
                },
              ]);

              try {
                const resultAction = await dispatch(reqToUpdateUnitProfile(payload));
                const result = unwrapResult(resultAction);
                if (result.success) {
                  await dispatch(getProfile());
                }
              } catch (error) {
                toast.error('Failed to update Presiding Officer.');
              }
            }}
          >
            <div className="row">
              <div className="col-sm-6 mb-3">
                <ICNumberInput
                  label="IC Number"
                  name="presidingIc"
                  value={presidingOfficer.icNumber}
                  onChange={(v) => handlePresidingChange('icNumber', v)}
                />
              </div>
              <div className="col-sm-6 mb-3">
                <FormSelect
                  label="Rank"
                  name="presidingRank"
                  options={rank}
                  value={rank.find(o => o.value === presidingOfficer.rank) ?? null}
                  onChange={(opt) => handlePresidingChange('rank', opt?.value ?? '')}
                  placeholder="Select Rank"
                />
              </div>
              <div className="col-sm-6 mb-3">
                <FormInput
                  label="Name"
                  name="presidingName"
                  value={presidingOfficer.name}
                  onChange={(e) => handlePresidingChange('name', e.target.value)}
                />
              </div>
              <div className="col-sm-6 mb-3">
                <FormInput
                  label="Appointment"
                  name="presidingAppointment"
                  value={presidingOfficer.appointment}
                  onChange={(e) => handlePresidingChange('appointment', e.target.value)}
                />
              </div>
              <div className="col-12 mt-2">
                <button type="submit" className="_btn _btn-lg primary">
                  {presidingOfficer.id ? 'Update' : 'Add'} Presiding Officer
                </button>
              </div>
            </div>
          </form>

          <form
            className="mb-5"
            onSubmit={async (e) => {
              e.preventDefault();

              if (officers.length === 0) {
                toast.error('Please add at least one Member Officer.');
                return;
              }

              const missing = officers.some(
                o =>
                  !o.icNumber ||
                  !o.rank ||
                  !o.name ||
                  !o.appointment,
              );
              if (missing) {
                toast.error('All Member Officer fields are required.');
                return;
              }

              const invalidIC = officers.some(
                o => !/^IC-\d{5}[A-Z]$/.test(o.icNumber),
              );
              if (invalidIC) {
                toast.error('Invalid IC number format.');
                return;
              }

              const payload = buildUnitPayload(
                officers.map((o, i) => ({
                  ...(o.id ? { id: o.id } : {}),
                  member_type: 'member_officer',
                  member_order: String(i + 1),
                  ic_number: o.icNumber,
                  rank: o.rank,
                  name: o.name,
                  appointment: o.appointment,
                })),
              );

              try {
                const resultAction = await dispatch(reqToUpdateUnitProfile(payload));
                const result = unwrapResult(resultAction);
                if (result.success) {
                  await dispatch(getProfile());
                }
              } catch (error) {
                toast.error('Failed to update Member Officers.');
              }
            }}
          >
            {officers.map((officer, index) => (
              <div key={officer.officerKey} className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Breadcrumb title={`Member Officer ${index + 1}`} />
                  {!officer.id && index > 0 && (
                    <button
                      type="button"
                      className="_btn danger btn-sm"
                      onClick={() => handleRemoveOfficer(officer.officerKey)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="row">
                  <div className="col-sm-6 mb-3">
                    <ICNumberInput
                      label="IC Number"
                      name={`officerIc-${index}`}
                      value={officer.icNumber}
                      onChange={(v) =>
                        handleOfficerChange(officer.officerKey, 'icNumber', v)
                      }
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <FormSelect
                      label="Rank"
                      name={`officerRank-${index}`}
                      options={rank}
                      value={rank.find(o => o.value === officer.rank) ?? null}
                      onChange={(opt) =>
                        handleOfficerChange(officer.officerKey, 'rank', opt?.value ?? '')
                      }
                      placeholder="Select Rank"
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <FormInput
                      label="Name"
                      name={`officerName-${index}`}
                      value={officer.name}
                      onChange={(e) =>
                        handleOfficerChange(officer.officerKey, 'name', e.target.value)
                      }
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <FormInput
                      label="Appointment"
                      name={`officerAppointment-${index}`}
                      value={officer.appointment}
                      onChange={(e) =>
                        handleOfficerChange(officer.officerKey, 'appointment', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="d-flex gap-2">
              <button type="submit" className="_btn _btn-lg primary">
                {officers.some(o => o.id) ? 'Update' : 'Add'} Member Officers
              </button>
              <button
                type="button"
                className="_btn _btn-lg success"
                onClick={handleAddOfficer}
              >
                Add New
              </button>
            </div>
          </form>
        </>
      )}

      {/* READ-ONLY: Member Officers List + Staff Register + Member Username */}
      {profile?.unit?.members?.length > 0 && !(['brigade','division','corps','command'].includes(role) && isMember) && (
        <div className="my-4">
          <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-3">
            <Breadcrumb title="Member Officers List" />
          </div>
          <div className="table-responsive mt-4">
            <table className="table-style-1 w-100">
              <thead style={{ backgroundColor: '#007bff' }}>
                <tr>
                  <th style={{ color: 'white' }}>#</th>
                  <th style={{ color: 'white' }}>RANK</th>
                  <th style={{ color: 'white' }}>NAME</th>
                  <th style={{ color: 'white' }}>APPOINTMENT</th>
                </tr>
              </thead>
              <tbody>
                {profile.unit.members
                  .filter((m: any) => m.member_type !== 'presiding_officer')
                  .sort((a: any, b: any) => (a.member_order ?? 0) - (b.member_order ?? 0))
                  .map((m: any, i: number) => (
                    <tr key={m.id ?? i}>
                      <td>{i + 1}</td>
                      <td>{m.rank ?? '-'}</td>
                      <td>{m.name ?? '-'}</td>
                      <td>{m.appointment ?? '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Officer Register + Registered Member Username */}
      {['brigade', 'division', 'corps', 'command'].includes(role) && (
        <>
          {is_member_added ? (
            <>
              <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between ">
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
            !isMember && (
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