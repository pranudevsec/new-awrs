import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import FormInput from "../../../components/form/FormInput";
import { useAppDispatch } from "../../../reduxToolkit/hooks";
import { useEffect, useState } from "react";
import { getConfig } from "../../../reduxToolkit/services/config/configService";
import type { Parameter } from "../../../reduxToolkit/services/parameter/parameterInterface";
import { fetchParameters } from "../../../reduxToolkit/services/parameter/parameterService";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import { resetCitationState } from "../../../reduxToolkit/slices/citation/citationSlice";
import { unwrapResult } from "@reduxjs/toolkit";
import { createAppreciation } from "../../../reduxToolkit/services/appreciation/appreciationService";

interface OptionType {
  label: string;
  value: string;
}

const awardTypeOptions: OptionType[] = [
  { value: "citation", label: "Citation" },
  { value: "appreciation", label: "Appreciation" },
];

const DRAFT_STORAGE_KEY = "applyAppreciationDraft";

const ApplyAppreciation = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [cyclePeriodOptions, setCyclePeriodOptions] = useState<OptionType[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [marks, setMarks] = useState<Record<number, number>>({});
  const [lastDate, setLastDate] = useState("");

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.counts) setCounts(parsed.counts);
        if (parsed.marks) setMarks(parsed.marks);
      } catch (err) {
        console.error("Failed to parse draft from localStorage", err);
      }
    }
  }, []);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      cyclePeriod: "",
      lastDate: lastDate || "",
    },
    onSubmit: async (values) => {
      try {
        const formattedParameters = parameters.map((param: any) => {
          const trimmedName = param.name.trim();
          const count = Number(counts[param.param_id] ?? 0);
          const calculatedMarks = marks[param.param_id] ?? 0;
          const uploadPath = param.proof_reqd
            ? `uploads/${trimmedName.toLowerCase().replace(/\s+/g, "_")}_file.pdf`
            : "";

          return {
            name: trimmedName,
            count,
            marks: calculatedMarks,
            upload: uploadPath,
          };
        });

        const payload :any= {
          date_init: "2024-04-01",
          appre_fds: {
            award_type: "appreciation",
            cycle_period: values.cyclePeriod,
            last_date: values.lastDate,
            parameters: formattedParameters,
          },
        };

        const resultAction = await dispatch(createAppreciation(payload));
        const result = unwrapResult(resultAction);

        if (result.success) {
          toast.success("Appreciation created successfully!");
          formik.resetForm();
          dispatch(resetCitationState());
          navigate("/applications/thanks");
        } else {
          toast.error("Failed to create appreciation.");
        }
      } catch (err) {
        console.error("create failed", err);
      }
    },
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [configRes, paramsRes] = await Promise.all([
          dispatch(getConfig()).unwrap(),
          dispatch(fetchParameters({ awardType: "appreciation" })).unwrap(),
        ]);

        if (configRes?.success && configRes.data) {
          const options = configRes.data.cycle_period.map((val: string) => ({
            label: val,
            value: val,
          }));
          setCyclePeriodOptions(options);
          const formattedDate = configRes.data.deadline?.split("T")[0] || "";
          setLastDate(formattedDate);
        }

        if (paramsRes.success && paramsRes.data) {
          setParameters(paramsRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };

    fetchAllData();
  }, [dispatch]);

  useEffect(() => {
    const draft = { counts, marks };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [counts, marks]);

  const handleCountChange = (paramId: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    setCounts((prev) => ({ ...prev, [paramId]: value }));
    const countNum = value === "" ? 0 : Number(value);

    const param: any = parameters.find((p: any) => p.param_id === paramId);
    if (param) {
      const calcMarks = Math.min(countNum * param.per_unit_mark, param.max_marks);
      setMarks((prev) => ({ ...prev, [paramId]: calcMarks }));
    }
  };

  const handleDeleteDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setCounts({});
    setMarks({});
  };

  return (
    <div className="apply-citation-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Apply for Appreciation"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Apply for Appreciation", href: "/applications/appreciation" },
          ]}
        />
      </div>
      <form onSubmit={formik.handleSubmit}>
        <div className="table-filter-area mb-4">
          <div className="row">
            <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
              <FormSelect
                label="Award Type"
                name="awardType"
                options={awardTypeOptions}
                value={awardTypeOptions.find((opt) => opt.value === "appreciation") || null}
                placeholder="Select"
                isDisabled
              />
            </div>
            <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
              <FormSelect
                label="Cycle Period"
                name="cyclePeriod"
                options={cyclePeriodOptions}
                value={cyclePeriodOptions.find((opt) => opt.value === formik.values.cyclePeriod) || null}
                onChange={(selected) => formik.setFieldValue("cyclePeriod", selected?.value)}
                placeholder="Select"
              />
            </div>
            <div className="col-lg-3 col-sm-4">
              <FormInput
                label="Last Date"
                name="lastDate"
                type="date"
                value={formik.values.lastDate}
                onChange={formik.handleChange}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-style-1 w-100">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Count</th>
                <th>Marks</th>
                <th>Upload</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param: any) => (
                <tr key={param.param_id}>
                  <td>
                    <p className="fw-5">{param.name}</p>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter count"
                      autoComplete="off"
                      value={counts[param.param_id] ?? ""}
                      onChange={(e) => handleCountChange(param.param_id, e.target.value)}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </td>
                  <td>
                    <div className="input-with-tooltip">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Marks"
                        value={marks[param.param_id] ?? 0}
                        readOnly
                      />
                      <div className="tooltip-icon">
                        <i className="info-circle">i</i>
                        <span className="tooltip-text">
                          {`1 unit = ${param.per_unit_mark} marks, max ${param.max_marks} marks`}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {param.proof_reqd ? (
                      <input type="file" className="form-control" autoComplete="off" />
                    ) : (
                      <span>Not required</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="submit-button-wrapper">
          <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-1 justify-content-end">
            <button
              type="button"
              className="_btn outline"
              onClick={() => alert("Draft saved!")}
            >
              Save as Draft
            </button>
            <button type="submit" className="_btn primary">
              Submit
            </button>
            <button
              type="button"
              className="_btn danger"
              onClick={handleDeleteDraft}
            >
              Delete
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ApplyAppreciation;
