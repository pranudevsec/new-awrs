import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import { Tabs, Tab } from "react-bootstrap";
import { unwrapResult } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import FormInput from "../../../components/form/FormInput";
import Loader from "../../../components/ui/loader/Loader";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { getConfig } from "../../../reduxToolkit/services/config/configService";
import { fetchParameters } from "../../../reduxToolkit/services/parameter/parameterService";
import { resetCitationState } from "../../../reduxToolkit/slices/citation/citationSlice";
import { createCitation, deleteCitation, fetchCitationById, updateCitation } from "../../../reduxToolkit/services/citation/citationService";
import type { Parameter } from "../../../reduxToolkit/services/parameter/parameterInterface";
import Axios, { baseURL } from "../../../reduxToolkit/helper/axios";
import { checkUnitProfileFields } from "../../../reduxToolkit/services/utils/utilities";


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
  const isDraftRef = useRef(false);
  const { draftData } = useAppSelector((state) => state.citation);
  const { profile } = useAppSelector((state) => state.admin);

  const { loading } = useAppSelector((state) => state.parameter);

  const initializedRef = useRef(false);
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") ?? "";

  // States
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [marks, setMarks] = useState<Record<number, number>>({});
  const [lastDate, setLastDate] = useState("");
  const [cyclePerios, setCyclePerios] = useState("");
  const [command, setCommand] = useState("");
  const groupedParams = groupParametersByCategory(parameters);
  const [activeTab, setActiveTab] = useState(Object.keys(groupedParams)[0] || "");
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_FILE_UPLOAD_KEY) ?? "{}");
    } catch {
      return {};
    }
  });
  const [unitRemarks, setUnitRemarks] = useState(() => {
    return localStorage.getItem("applyCitationUnitRemarks") ?? "";
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchCitationById(Number(id)));
    } else {
      restoreDraftFromLocalStorage();
    }

    return () => {
      dispatch(resetCitationState());
    };
  }, [id]);

  // 🔹 Helper to restore draft from localStorage
  const restoreDraftFromLocalStorage = () => {
    restoreCountsAndMarks();
    restoreUploadedFiles();
  };

  // 🔹 Restore counts/marks
  const restoreCountsAndMarks = () => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft);
      if (parsed.counts) setCounts(parsed.counts);
      if (parsed.marks) setMarks(parsed.marks);
    } catch (err) {
      console.error("Failed to parse draft counts/marks", err);
    }
  };

  // 🔹 Restore uploaded files
  const restoreUploadedFiles = () => {
    const savedUploads = localStorage.getItem(DRAFT_FILE_UPLOAD_KEY);
    if (!savedUploads) return;

    try {
      const parsedUploads = JSON.parse(savedUploads);
      setUploadedFiles(parsedUploads);
    } catch (err) {
      console.error("Failed to parse uploaded file draft", err);
    }
  };


  useEffect(() => {
    localStorage.setItem("applyCitationUnitRemarks", unitRemarks);
  }, [unitRemarks]);

  // Populate from API data
  useEffect(() => {
    if (id && draftData?.citation_fds?.parameters && parameters?.length > 0) {
      const newCounts: Record<number, string> = {};
      const newMarks: Record<number, number> = {};
      const newUploads: Record<number, string[]> = {};

      // Map by param.id (from API) to param.param_id (from parameters)
      const idToParamIdMap = parameters.reduce((acc: Record<string, number>, param: any) => {
        acc[String(param.id ?? param.param_id)] = param.param_id;
        return acc;
      }, {});

      draftData.citation_fds.parameters.forEach((param: any) => {
        const paramId = idToParamIdMap[String(param.id)];
        if (paramId !== undefined) {
          newCounts[paramId] = String(param.count ?? "");
          newMarks[paramId] = param.marks ?? 0;

          if (param.upload) {
            if (Array.isArray(param.upload)) {
              newUploads[paramId] = param.upload;
            } else if (typeof param.upload === "string") {
              if (param.upload.includes(",")) {
                newUploads[paramId] = param.upload.split(",").map((u: any) => u.trim());
              } else {
                newUploads[paramId] = [param.upload.trim()];
              }
            }
          }
        }
      });

      setCounts(newCounts);
      setMarks(newMarks);
      setUploadedFiles(newUploads);

      // Set unit remarks if present
      if (typeof draftData.citation_fds.unitRemarks === "string") {
        setUnitRemarks(draftData.citation_fds.unitRemarks);
      }
    }
  }, [draftData, parameters]);

  useEffect(() => {
    if (
      id &&
      draftData?.citation_fds?.parameters &&
      Object.keys(uploadedFiles).length === 0 // Only set if not already set
    ) {
      const uploads: Record<number, string[]> = {};
      draftData.citation_fds.parameters.forEach((param: any, index: number) => {
        if (param.upload) {
          if (Array.isArray(param.upload)) {
            uploads[param.param_id ?? index] = param.upload;
          } else if (typeof param.upload === "string") {
            if (param.upload.includes(",")) {
              uploads[param.param_id ?? index] = param.upload.split(",").map((u: any) => u.trim());
            } else {
              uploads[param.param_id ?? index] = [param.upload.trim()];
            }
          }
        }
      });
      setUploadedFiles(uploads);
    }
  }, [id, draftData]);

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
    const input = e.target;
    const files = input.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
        toast.error(`Incorrect file type: ${file.name}. Only PDF, JPG, PNG allowed.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB`);
        continue;
      }
      const uploadedUrl = await uploadFileToServer(file, paramName);
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      const newUploads = {
        ...uploadedFiles,
        [paramId]: [...(uploadedFiles[paramId] || []), ...uploadedUrls]
      };
      setUploadedFiles(newUploads);
      localStorage.setItem(DRAFT_FILE_UPLOAD_KEY, JSON.stringify(newUploads));
      toast.success(`Uploaded ${uploadedUrls.length} file(s)`);
    } else {
      input.value = "";
    }
  };
  const handleRemoveUploadedFile = (paramId: number, index: number) => {
    const updatedFiles = { ...uploadedFiles };

    if (!updatedFiles[paramId]) return;

    // Remove file at index
    updatedFiles[paramId] = updatedFiles[paramId].filter((_, idx) => idx !== index);

    // If no files left, remove the paramId key
    if (updatedFiles[paramId].length === 0) {
      delete updatedFiles[paramId];
    }

    setUploadedFiles(updatedFiles);
    localStorage.setItem(DRAFT_FILE_UPLOAD_KEY, JSON.stringify(updatedFiles));
    toast.success("File removed");
  };

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

        const formattedParameters = parameters
          .map((param: any) => {
            const display = getParamDisplay(param);
            const count = Number(counts[param.param_id] ?? 0);
            const calculatedMarks = marks[param.param_id] ?? 0;
            const uploadPaths = uploadedFiles[param.param_id] ?? [];
            return {
              id: param.param_id,
              name: display.main,
              count,
              marks: calculatedMarks,
              upload: uploadPaths,
              negative: param.negative,
            };
          })
          .filter((param) => param.count > 0 || param.marks != 0);

        const payload = {
          date_init: new Date().toISOString().split("T")[0],
          citation_fds: {
            award_type: "citation",
            cycle_period: values.cyclePeriod,
            last_date: values.lastDate,
            command: values.command,
            parameters: formattedParameters,
            unitRemarks: unitRemarks,
            awards: profile?.unit?.awards,
          },
          isDraft: isDraftRef.current,
        };

        let resultAction;
        if (id) {
          // Update if `id` exists
          resultAction = await dispatch(updateCitation({ id: Number(id), ...payload }));
        } else {
          // Otherwise, create new
          resultAction = await dispatch(createCitation(payload));
        }

        const result = unwrapResult(resultAction);

        if (result.success) {
          formik.resetForm();
          dispatch(resetCitationState());

          if (isDraftRef.current) {
            toast.success("Draft saved!");
            isDraftRef.current = false;
          } else {
            navigate("/applications/thanks");
          }
        } else {
          toast.error("Failed to submit citation.");
        }
      } catch (err) {
        console.error("Submit failed:", err);
        toast.error("An error occurred while submitting.");
      }
    }

  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        if(checkUnitProfileFields(profile) === false) {
          toast.error("Please complete your profile details before applying for a citation.");
          navigate("/profile-settings");
          return; 
        }
        const [configRes, paramsRes] = await Promise.all([
          dispatch(getConfig()).unwrap(),
          dispatch(fetchParameters({
            awardType: "citation",
            search: "",
            matrix_unit: profile?.unit?.matrix_unit ?? undefined,
            comd: profile?.unit?.comd ?? undefined,
            // matrix_unit: "",
            // comd: "",
            unit_type: profile?.unit?.unit_type ?? undefined,
            page: 1,
            limit: 5000
          })).unwrap(),
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
          const revParams = [...paramsRes.data].reverse();
          setParameters(revParams);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    if(!id){
        const draft = { counts, marks };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
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

  const handlePreviewClick = () => {
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
      const fileUploaded = uploadedFiles[param.param_id];

      return requiresUpload && !fileUploaded;
    });

    if (missingUploads.length > 0) {
      toast.error("Please upload all necessary files before previewing.");
      return;
    }

    if (unitRemarks.length > 500) {
      toast.error("Maximum 500 characters allowed in Unit Remarks");
      return;
    }
    localStorage.setItem("applyCitationUnitRemarks", unitRemarks);
    localStorage.setItem(DRAFT_FILE_UPLOAD_KEY, JSON.stringify(uploadedFiles));
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ counts, marks }));

    // If all good, navigate
    navigate('/applications/citation-review');
  };

  const getParamDisplay = (param: any) => {
    if (param.name != "no") {
      return {
        main: param.name,
        header: param.subcategory ?? null,
        subheader: param.subsubcategory ?? null,
      };
    } else if (param.subsubcategory) {
      return {
        main: param.subsubcategory,
        header: param.subcategory ?? null,
        subheader: null,
      };
    } else if (param.subcategory) {
      return {
        main: param.subcategory,
        header: null,
        subheader: null,
      };
    } else {
      return {
        main: param.category,
        header: null,
        subheader: null,
      };
    }
  };

  const handleDeleteDraft = async () => {
    if (id) {
      try {
        await dispatch(deleteCitation(Number(id))).unwrap();
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(DRAFT_FILE_UPLOAD_KEY);
        localStorage.removeItem("applyCitationUnitRemarks");
        setCounts({});
        setMarks({});
        setUploadedFiles({});
        navigate("/submitted-forms/list");
      } catch (error) {
        toast.error("Failed to delete draft");
      }
    } else {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(DRAFT_FILE_UPLOAD_KEY);
      localStorage.removeItem("applyCitationUnitRemarks");
      setCounts({});
      setMarks({});
      setUploadedFiles({});
    }
  };

  // Show loader
  if (loading) return <Loader />

  return (
    <div className="apply-citation-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Apply For Citation"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Apply For Citation", href: "/applications/citation" },
          ]}
        />
      </div>

      {Object.keys(groupedParams).length === 0 ?
        <EmptyTable /> :
        <form onSubmit={formik.handleSubmit}>
          <div className="table-filter-area mb-4">
            <div className="row">
              <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
                <FormInput
                  label="Award Type"
                  name="awardType"
                  value="Citation"
                  readOnly
                />
              </div>
              {/* <div className="col-lg-3 col-sm-4 mb-sm-0 mb-2">
                <FormInput
                  label="Cycle Period"
                  name="cyclePeriod"
                  value={formik.values.cyclePeriod}
                  onChange={formik.handleChange}
                  readOnly
                />
              </div> */}
              {/* <div className="col-lg-3 col-sm-4">
                <FormInput
                  label="Last Date"
                  name="lastDate"
                  type="date"
                  value={formik.values.lastDate}
                  onChange={formik.handleChange}
                  readOnly
                />
              </div> */}
              <div className="col-lg-3 col-sm-4">
                <FormInput
                  label="Command"
                  name="command"
                  value={profile?.unit?.comd ?? "--"}
                  onChange={formik.handleChange}
                  readOnly
                />
              </div>
            </div>
          </div>
          <div className="position-sticky top-0 bg-white pb-3 mb-3" style={{ zIndex: 10, borderBottom: '1px solid #dee2e6' }}>
            <Tabs
              activeKey={activeTab}
              onSelect={handleTabSelect}
              id="category-tabs"
              className="custom-tabs d-flex gap-2 flex-nowrap overflow-x-auto text-nowrap "
            >
              {Object.keys(groupedParams).map((category) => (
                <Tab
                  eventKey={category}
                  title={
                    <span
                      className="form-label mb-1"
                    >
                      {category.toUpperCase()}
                    </span>
                  }
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
                    <tr style={{ backgroundColor: "#007bff" }}>
                      <th style={{ width: 250, minWidth: 250, maxWidth: 250, fontSize: "17" ,color:"white"}}>Parameter</th>
                      <th style={{ width: 300, minWidth: 300, maxWidth: 300, fontSize: "17" ,color:"white"}}>Count</th>
                      <th style={{ width: 300, minWidth: 300, maxWidth: 300, fontSize: "17" ,color:"white"}}>Marks</th>
                      <th style={{ width: 300, minWidth: 300, maxWidth: 300, fontSize: "17" ,color:"white"}}>Upload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let prevHeader: string | null = null;
                      let prevSubheader: string | null = null;
                      const rows: any = [];
                      params.forEach((param: any, idx: number) => {
                        const display = getParamDisplay(param);
                        const showHeader = display.header && display.header !== prevHeader;
                        const showSubheader = display.subheader && display.subheader !== prevSubheader;

                        if (showHeader) {
                          rows.push(
                            <tr key={`header-${display.header}-${idx}`}>
                              <td colSpan={4} style={{ fontWeight: 500, fontSize: 15, backgroundColor: "#ebeae8", lineHeight: "1" }}>
                                {display.header}
                              </td>
                            </tr>
                          );
                        }
                        if (showSubheader) {
                          rows.push(
                            <tr key={`subheader-${display.subheader}-${idx}`}>
                              <td colSpan={4} style={{ color: display.header ? "black" : "#888", fontSize: 15, fontWeight: 700 }}>
                                {display.subheader}
                              </td>
                            </tr>
                          );
                        }

                        prevHeader = display.header;
                        prevSubheader = display.subheader;

                        const rawMarkValue = marks[param.param_id];
                        let markInputValue: number;

                        if (param.negative) {
                          if (rawMarkValue === 0 || rawMarkValue === undefined) {
                            markInputValue = 0;
                          } else {
                            markInputValue = -Math.abs(rawMarkValue);
                          }
                        } else {
                          markInputValue = rawMarkValue ?? 0;
                        }

                        rows.push(
                          <tr key={param.param_id}>
                            <td style={{ width: 250, minWidth: 250, maxWidth: 250, verticalAlign: "top" }}>
                              <p className="fw-5 mb-0">{display.main}</p>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300, verticalAlign: "top" }}>
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
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300, verticalAlign: "top" }}>
                              <div className="input-with-tooltip">
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Marks"
                                  value={markInputValue.toFixed(3)}
                                  readOnly
                                />
                                <div className="tooltip-icon">
                                  <i className="info-circle">i</i>
                                  <span className="tooltip-text">
                                    {`1 count = ${(param.per_unit_mark)} marks, description: ${param.description}`}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td style={{ width: 300, minWidth: 300, maxWidth: 300, verticalAlign: "top" }}>
                              {param.proof_reqd ? (
                                <>
                                  {uploadedFiles[param.param_id]?.length > 0 && (
                                    <div className="mb-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {uploadedFiles[param.param_id].map((fileUrl, idx) => (
                                        <div
                                          key={`${param.param_id}-${fileUrl}`}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '0.5rem',
                                            fontSize: 14,
                                            wordBreak: 'break-all',
                                            background: '#f1f5f9',
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                          }}
                                        >
                                          <a
                                            href={`${baseURL}${fileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ flex: 1, color: '#1d4ed8', textDecoration: 'underline' }}
                                          >
                                            {fileUrl.split("/").pop()}
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveUploadedFile(param.param_id, idx)}
                                            style={{
                                              background: 'transparent',
                                              border: 'none',
                                              color: '#dc2626',
                                              cursor: 'pointer',
                                              fontSize: 16,
                                            }}
                                            title="Remove file"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    className="form-control"
                                    placeholder="not more than 5 MB"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                    onChange={(e) => {
                                      const display = getParamDisplay(param);
                                      handleFileChange(e, param.param_id, display.main);
                                    }}
                                  />
                                  <span style={{ fontSize: 12, color: 'red' }}>*File not more than 5 MB. Only PDF, JPG, PNG allowed.</span>
                                </>
                              ) : (
                                <span>Not required</span>
                              )}

                            </td>
                          </tr>
                        );
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            ))}
            <div className="w-100">
              <FormInput
                label="Unit Remarks"
                as="textarea"
                name="unitRemarks"
                placeholder="Enter remarks (max 500 characters)"
                value={unitRemarks}
                onChange={(e) => setUnitRemarks(e.target.value)}
              />
              {unitRemarks.length > 500 && (
                <p className="error-text">Maximum 500 characters allowed</p>
              )}
            </div>
          </div>
          <div className="submit-button-wrapper">
            <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-1 justify-content-end">
              <button
                type="button"
                className="_btn outline"
                onClick={() => {
                  isDraftRef.current = true;
                  formik.handleSubmit();
                }}
              >
                {id ? "Save Draft" : "Save as Draft"}
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
                {id ? "Delete Draft" : "Discard"}
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  );
};

export default ApplyCitation;