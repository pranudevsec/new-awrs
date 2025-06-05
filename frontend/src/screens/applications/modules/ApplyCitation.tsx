import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { Tabs, Tab } from "react-bootstrap";
import { unwrapResult } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormSelect from "../../../components/form/FormSelect";
import FormInput from "../../../components/form/FormInput";
import Loader from "../../../components/ui/loader/Loader";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import { awardTypeOptions } from "../../../data/options";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { getConfig } from "../../../reduxToolkit/services/config/configService";
import { fetchParameters } from "../../../reduxToolkit/services/parameter/parameterService";
import { resetCitationState } from "../../../reduxToolkit/slices/citation/citationSlice";
import { createCitation } from "../../../reduxToolkit/services/citation/citationService";
import type { Parameter } from "../../../reduxToolkit/services/parameter/parameterInterface";
import Axios, { baseURL } from "../../../reduxToolkit/helper/axios";
import { SVGICON } from "../../../constants/iconsList";

const DRAFT_STORAGE_KEY = "applyCitationDraft";
const DRAFT_FILE_UPLOAD_KEY = "applyCitationuploadedDocsDraft";

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

  const { profile } = useAppSelector((state) => state.admin);
  const { loading } = useAppSelector((state) => state.parameter);

  const initializedRef = useRef(false);

  // States
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [marks, setMarks] = useState<Record<number, number>>({});
  const [lastDate, setLastDate] = useState("");
  const [cyclePerios, setCyclePerios] = useState("");
  const [command, setCommand] = useState("");
  const groupedParams = groupParametersByCategory(parameters);
  const [activeTab, setActiveTab] = useState(Object.keys(groupedParams)[0] || "");
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_FILE_UPLOAD_KEY) || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!initializedRef.current) {
      const firstCategory = Object.keys(groupedParams)[0];
      if (firstCategory) {
        setActiveTab(firstCategory);
        initializedRef.current = true;
      }
    }
  }, [groupedParams]);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
  
    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
  
      let closestCategory = "";
      let minOffset = Infinity;
  
      Object.entries(categoryRefs.current).forEach(([category, el]) => {
        if (el) {
          const offset = Math.abs(el.getBoundingClientRect().top - containerTop);
          if (offset < minOffset) {
            closestCategory = category;
            minOffset = offset;
          }
        }
      });
  
      if (closestCategory && closestCategory !== activeTab) {
        setActiveTab(closestCategory);
      }
    };
  
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeTab]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleTabSelect = (key: string | null) => {
    if (!key) return;
    setActiveTab(key);

    const categoryElement = categoryRefs.current[key];
    const container = scrollContainerRef.current;

    if (categoryElement && container) {
      const containerTop = container.getBoundingClientRect().top;
      const categoryTop = categoryElement.getBoundingClientRect().top;
      const scrollOffset = categoryTop - containerTop + container.scrollTop;

      container.scrollTo({
        top: scrollOffset,
        behavior: 'smooth',
      });
    }
  };

  const makeFieldName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
  };

  const uploadFileToServer = async (
    file: File,
    paramName: string
  ): Promise<string | null> => {
    const fieldName = makeFieldName(paramName);
    const formData = new FormData();
    formData.append(fieldName, file);

    try {
      const response = await Axios.post("/api/applications/upload-doc", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedData = response.data;
      if (Array.isArray(uploadedData) && uploadedData.length > 0) {
        return uploadedData[0].urlPath;
      } else {
        throw new Error("Invalid upload response");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    paramId: number,
    paramName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const uploadedUrl = await uploadFileToServer(file, paramName);
    if (uploadedUrl) {
      const newUploads = { ...uploadedFiles, [paramId]: uploadedUrl };
      setUploadedFiles(newUploads);
      localStorage.setItem(DRAFT_FILE_UPLOAD_KEY, JSON.stringify(newUploads));
      toast.success("Upload successful");
    } else {
      toast.error("Upload failed");
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

  // Formik form
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      cyclePeriod: cyclePerios || "",
      lastDate: lastDate || "",
      command: command || "",
    },
    onSubmit: async (values) => {
      try {
        const uploadedDocs = JSON.parse(localStorage.getItem(DRAFT_FILE_UPLOAD_KEY) || "{}");

        const formattedParameters = parameters
        .map((param: any) => {
          const trimmedName = param.name.trim();
          const count = Number(counts[param.param_id] ?? 0);
          const calculatedMarks = marks[param.param_id] ?? 0;
          const uploadPath = uploadedDocs[param.param_id] || "";
      
          return {
            name: trimmedName,
            count,
            marks: calculatedMarks,
            upload: uploadPath,
          };
        })
        .filter((param) => param.count > 0 || param.marks > 0);
      
        const payload = {
          date_init: new Date().toISOString().split("T")[0],
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
  }, []);

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
    localStorage.removeItem(DRAFT_FILE_UPLOAD_KEY);
    setCounts({});
    setMarks({});
    setUploadedFiles({});
  };

  const handlePreviewClick = () => {
    const uploadedDocs = JSON.parse(localStorage.getItem(DRAFT_FILE_UPLOAD_KEY) || "{}");
      const hasAtLeastOneCount = parameters.some(
        (param: any) => Number(counts[param.param_id] ?? 0) > 0
      );
    
      if (!hasAtLeastOneCount) {
        toast.error("Please fill at least one parameter count before previewing.");
        return;
      }
const missingUploads = parameters.filter((param: any) => {
  const count = Number(counts[param.param_id] ?? 0);
  const mark = Number(marks[param.param_id] ?? 0);
  const requiresUpload = param.proof_reqd && (count > 0 || mark > 0);
  const fileUploaded = uploadedDocs[param.param_id];

  return requiresUpload && !fileUploaded;
});

if (missingUploads.length > 0) {
  toast.error("Please upload all necessary files before previewing.");
  return;
}

  
    // If all good, navigate
    navigate('/applications/citation-review');
  };

  // Show loader
  if (loading) return <Loader />

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

      {Object.keys(groupedParams).length === 0 ?
        <EmptyTable /> :
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
              height: '60vh',
              overflowY: 'auto',
              paddingRight: '1rem',
              scrollbarWidth: 'none',
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
                      <th style={{ width: 250, minWidth: 250, maxWidth: 250 }}>Parameter</th>
                      <th style={{ width: 300, minWidth: 300, maxWidth: 300 }}>Count</th>
                      <th style={{ width: 300, minWidth: 300, maxWidth: 300 }}>Marks</th>
                      <th style={{ width: 300, minWidth: 300, maxWidth: 300 }}>Upload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map((param: any) => (
                      <tr key={param.param_id}>
                        <td style={{ width: 250, minWidth: 250, maxWidth: 250 }}><p className="fw-5">{param.name}</p></td>
                        <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
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
                        <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
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
                        <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
  {param.proof_reqd ? (
    Number(counts[param.param_id] || 0) > 0 ? (
      // If count > 0, show either the uploaded link or the file-input
      uploadedFiles[param.param_id] ? (
        <a
          href={`${baseURL}${uploadedFiles[param.param_id]}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 18 }}
        >
          {SVGICON.app.pdf}
        </a>
      ) : (
        <input
          type="file"
          className="form-control"
          autoComplete="off"
          onChange={(e) => handleFileChange(e, param.param_id, param.name)}
        />
      )
    ) : (
      null
    )
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
          <div className="submit-button-wrapper">
            <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-1 justify-content-end">
              <button
                type="button"
                className="_btn outline"
                onClick={() => toast.success("Draft saved!")}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="_btn primary"
                onClick={handlePreviewClick}
              >
                Preview
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
      }
    </div>
  );
};

export default ApplyCitation;