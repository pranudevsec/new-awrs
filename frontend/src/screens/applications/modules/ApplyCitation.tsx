import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import FormInput from "../../../components/form/FormInput";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import React, { useState, useEffect } from "react";
import { getConfig } from "../../../reduxToolkit/services/config/configService";
import type { Parameter } from "../../../reduxToolkit/services/parameter/parameterInterface";
import { fetchParameters } from "../../../reduxToolkit/services/parameter/parameterService";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import { resetCitationState } from "../../../reduxToolkit/slices/citation/citationSlice";
import { createCitation } from "../../../reduxToolkit/services/citation/citationService";
import { unwrapResult } from "@reduxjs/toolkit";
import { Tabs, Tab } from "react-bootstrap";
import { awardTypeOptions } from "../../../data/options";

const DRAFT_STORAGE_KEY = "applyCitationDraft";

const groupParametersByCategory = (params: Parameter[]) => {
  return params.reduce((acc: Record<string, Parameter[]>, param) => {
    const category = param.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(param);
    return acc;
  }, {});
};

const ApplyCitation = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.admin.profile);

  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [marks, setMarks] = useState<Record<number, number>>({});
  const groupedParams = groupParametersByCategory(parameters);

  const [activeTab, setActiveTab] = useState(Object.keys(groupedParams)[0] || "");
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (!initializedRef.current) {
      const firstCategory = Object.keys(groupedParams)[0];
      if (firstCategory) {
        setActiveTab(firstCategory);
        initializedRef.current = true; // mark as initialized
      }
    }
  }, [groupedParams]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const categoryRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleTabSelect = (key: string | null) => {
    if (!key) return;
    setActiveTab(key);

    const categoryElement = categoryRefs.current[key];
    const container = scrollContainerRef.current;

    if (categoryElement && container) {
      // Scroll relative to the container top
      const containerTop = container.getBoundingClientRect().top;
      const categoryTop = categoryElement.getBoundingClientRect().top;
      const scrollOffset = categoryTop - containerTop + container.scrollTop;

      container.scrollTo({
        top: scrollOffset,
        behavior: 'smooth',
      });
    }
  };

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

  const [lastDate, setLastDate] = useState("");
  const [cyclePerios, setCyclePerios] = useState("");
  const [command, setCommand] = useState("");

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      cyclePeriod: cyclePerios || "",
      lastDate: lastDate || "",
      command: command || "",
    },
    onSubmit: async (values) => {
      try {
        const formattedParameters = parameters.map((param: any) => {
          const trimmedName = param.name.trim(); // removes leading/trailing spaces
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

        const payload = {
          date_init: "2024-04-01", // can also be a dynamic value
          citation_fds: {
            award_type: "citation",
            cycle_period: values.cyclePeriod,
            last_date: values.lastDate,
            command: values.command,
            parameters: formattedParameters,
          },
        };

        const resultAction = await dispatch(createCitation(payload));
        const result = unwrapResult(resultAction);

        if (result.success) {
          toast.success("Citation created successfully!");
          formik.resetForm();
          dispatch(resetCitationState());
          navigate("/applications/thanks");
        } else {
          toast.error("Failed to create citation.");
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
          dispatch(fetchParameters({ awardType: "citation", search: "" })).unwrap(),
        ]);

        if (configRes?.success && configRes.data) {
          setCyclePerios(configRes.data.current_cycle_period);
          const formattedDate = configRes.data.deadline?.split("T")[0] || "";
          setLastDate(formattedDate);
          if (profile) {
            setCommand(profile?.unit?.comd)
          }
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
          title="Apply for Citation"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Apply for Citation", href: "/applications/citation" },
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
                value={awardTypeOptions.find((opt) => opt.value === "citation") || null}
                placeholder="Select"
                isDisabled
              />
            </div>
            <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
              <FormInput
                label="Cycle Period"
                name="cyclePeriod"
                value={formik.values.cyclePeriod}
                onChange={formik.handleChange}
                readOnly
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
            <div className="col-lg-3 col-sm-4">
              <FormInput
                label="Command"
                name="command"
                value={profile?.unit?.comd || "--"}
                onChange={formik.handleChange}
                readOnly
              />
            </div>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, paddingBottom: '1rem' }}>
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabSelect}
            id="category-tabs"
            className="mb-3 custom-tabs"
          >
            {Object.keys(groupedParams).map((category) => (
              <Tab
                eventKey={category}
                title={<span className="form-label mb-1">{category.toUpperCase()}</span>}
                key={category}
              />
            ))}
          </Tabs>
        </div>

        <div
          ref={scrollContainerRef}
          style={{
            height: '60vh', // adjust height as needed
            overflowY: 'auto',
            paddingRight: '1rem',
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none',
          }}
        >
          {Object.entries(groupedParams).map(([category, params]) => (
            <div
              key={category}
              id={`category-${category}`}
              ref={(el) => {
                categoryRefs.current[category] = el;
              }}
              style={{ marginBottom: "2rem" }}
            >
              <h5
                className="mb-4 p-2"
                style={{ color: "#333", fontWeight: "600" }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h5>
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
                  {params.map((param: any) => (
                    <tr key={param.param_id}>
                      <td><p className="fw-5">{param.name}</p></td>
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
          ))}
        </div>


        <div
          className="submit-button-wrapper"
          style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
            padding: '1rem 0',
            borderTop: '1px solid #ddd',
            zIndex: 10,
          }}
        >
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

export default ApplyCitation;
