import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Loader from "../../../components/ui/loader/Loader";
import FormInput from "../../../components/form/FormInput";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { getConfig } from "../../../reduxToolkit/services/config/configService";
import { fetchParameters } from "../../../reduxToolkit/services/parameter/parameterService";
import { resetCitationState } from "../../../reduxToolkit/slices/citation/citationSlice";
import { createCitation } from "../../../reduxToolkit/services/citation/citationService";
import type { Parameter } from "../../../reduxToolkit/services/parameter/parameterInterface";
import Axios, { baseURL } from "../../../reduxToolkit/helper/axios";

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

const CitationReviewPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const profile: any = useAppSelector((state) => state.admin.profile);
  const { loading } = useAppSelector((state) => state.parameter);

  const initializedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // States
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [marks, setMarks] = useState<Record<number, number>>({});
  const [lastDate, setLastDate] = useState("");
  const [cyclePerios, setCyclePerios] = useState("");
  const [command, setCommand] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string[]>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(DRAFT_FILE_UPLOAD_KEY) ?? "{}");
      } catch {
        return {};
      }
    }
  );
  const [unitRemarks, setUnitRemarks] = useState(() => {
    return localStorage.getItem("applyCitationUnitRemarks") ?? "";
  });

  const filteredParameters = parameters.filter(
    (param: any) =>
      counts[param.param_id] !== undefined && counts[param.param_id] !== ""
  );
  const groupedParams = groupParametersByCategory(filteredParameters);
  useEffect(() => {
    localStorage.setItem("applyCitationUnitRemarks", unitRemarks);
  }, [unitRemarks]);

  useEffect(() => {
    if (!initializedRef.current) {
      const firstCategory = Object.keys(groupedParams)[0];
      if (firstCategory) {
        initializedRef.current = true;
      }
    }
  }, [groupedParams]);

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
      const response = await Axios.post(
        "/api/applications/upload-doc",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, param: any) => {
    const display = getParamDisplay(param);
    handleFileChange(e, param.param_id, display.main);
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    paramId: number,
    paramName: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    for (const file of files) {
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
        [paramId]: [...(uploadedFiles[paramId] ??[]), ...uploadedUrls],
      };
      setUploadedFiles(newUploads);
      localStorage.setItem(DRAFT_FILE_UPLOAD_KEY, JSON.stringify(newUploads));
      toast.success(`Uploaded ${uploadedUrls.length} file(s)`);
    } else {
      toast.error("No files uploaded");
    }
  };

  // Formik form
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      cyclePeriod: cyclePerios ?? "",
      lastDate: lastDate ?? "",
      command: command ?? "",
    },
    onSubmit: async (values) => {
      try {
        if (unitRemarks.length > 500) {
          toast.error("Maximum 500 characters allowed in Unit Remarks");
          return;
        }

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
              arms_service:param.arms_service,
              marks: Number((calculatedMarks).toFixed(2)),
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
            command: profile?.unit?.comd ?? "",
            arms_service: profile?.unit?.unit_type ?? "",
            matrix_unit: profile?.unit?.matrix_unit ?? "",
            location: profile?.unit?.location ?? "",
            brigade: profile?.unit?.bde ?? "",
            division: profile?.unit?.div ?? "",
            corps: profile?.unit?.corps ?? "",           
            parameters: formattedParameters,
            unitRemarks: unitRemarks,
            awards: profile?.unit?.awards,
            unit_type: profile?.unit?.unit_type
          },
        };

        const resultAction: any = await dispatch(createCitation(payload));
        const result = unwrapResult(resultAction);

        if (result.success) {
          formik.resetForm();
          dispatch(resetCitationState());
          const id = resultAction?.payload?.data?.citation_id;

          if (id) {
            navigate(`/applications/thanks?id=${id}`);
          } else {
            navigate("/applications/thanks");
          }
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
          dispatch(
            fetchParameters({ awardType: "citation", search: "", matrix_unit: profile?.unit?.matrix_unit ?? undefined,
              comd: profile?.unit?.comd ?? undefined,
              unit_type: profile?.unit?.unit_type ?? undefined,
              page: 1, limit: 5000 })
          ).unwrap(),
        ]);

        if (configRes?.success && configRes.data) {
          setCyclePerios(configRes.data.current_cycle_period);
          const formattedDate = configRes.data.deadline?.split("T")[0] ?? "";
          setLastDate(formattedDate);
          if (profile) {
            setCommand(profile?.unit?.comd);
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
    const draft = { counts, marks };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [counts, marks]);

  // Total Fields Filled
  const filledFields = Object.values(counts).filter(
    (value) => value !== ""
  ).length;

  let totalMarks = 0;
  let positiveMarks = 0;
  let negativeMarks = 0;

  for (const param of parameters) {
    const paramId: any = param.param_id;
    const markValue = marks[paramId];
    console.log(param)
    if (markValue !== undefined) {
      if (param.negative) {
        negativeMarks += markValue;
      } else {
        positiveMarks += markValue;
      }
    }
  }

  totalMarks = positiveMarks - negativeMarks;

  const renderParamRows = ({
    params,
    counts,
    marks,
    uploadedFiles,
    handleFileInputChange,
    getParamDisplay,
  }: any) => {
    let prevHeader: string | null = null;
    let prevSubheader: string | null = null;

    return params.reduce((rows: any[], param: any, idx: number) => {
      const display = getParamDisplay(param);
      const countValue = counts[param.param_id];
      const markValue = marks[param.param_id];

      if (countValue === undefined || countValue === "") return rows;

      const showHeader = display.header && display.header !== prevHeader;
      const showSubheader = display.subheader && display.subheader !== prevSubheader;

      if (showHeader) {
        rows.push(
          <tr key={`header-${display.header}-${idx}`}>
            <td colSpan={4} style={{ fontWeight: 600, color: "#555", background: "#f5f5f5" }}>
              {display.header}
            </td>
          </tr>
        );
      }

      if (showSubheader) {
        rows.push(
          <tr key={`subheader-${display.subheader}-${idx}`}>
            <td colSpan={4} style={{ color: "#1976d2", background: "#f8fafc", fontSize: 13 }}>
              {display.subheader}
            </td>
          </tr>
        );
      }

      prevHeader = display.header;
      prevSubheader = display.subheader;

      let displayMark: string | number = "--";

      if (markValue !== undefined) {
        displayMark = param.negative ? `-${Number(markValue).toFixed(2)}` : Number(markValue).toFixed(2);
      }

      rows.push(
        <tr key={param.param_id}>
          <td style={{ width: 300 }}>
            <p className="fw-5">{display.main}</p>
          </td>
          <td style={{ width: 200 }}>
            <p className="fw-5">{countValue ?? "--"}</p>
          </td>
          <td style={{ width: 200 }}>
            <p className="fw-5">{displayMark}</p>
          </td>
          <td style={{ width: 200 }}>
            {param.proof_reqd ? (
              <>
                {uploadedFiles[param.param_id]?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {uploadedFiles[param.param_id].map((fileUrl: string) => (
                      <a
                        key={fileUrl}
                        href={`${baseURL}${fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 14, wordBreak: "break-all" }}
                      >
                        {fileUrl.split("/").pop()}
                      </a>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  className="form-control mt-1"
                  multiple
                  onChange={(e) => handleFileInputChange(e, param)}
                />
              </>
            ) : (
              <span>Not required</span>
            )}
          </td>
        </tr>
      );

      return rows;
    }, []);
  };


  // Show loader
  if (loading) return <Loader />;

  return (
    <div className="apply-citation-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Citation For Review"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Apply For Citation", href: "/applications/citation" },
            {
              label: "Citation For Review",
              href: "/applications/citation-review",
            },
          ]}
        />
      </div>
      {Object.keys(groupedParams).length === 0 ? (
        <EmptyTable />
      ) : (
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
                  value={profile?.unit?.comd ?? "--"}
                  onChange={formik.handleChange}
                  readOnly
                />
              </div>
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            style={{
              height: "70vh",
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
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
                      <th style={{ width: 300, minWidth: 300, maxWidth: 300 , color: "white" }}>
                        Parameter
                      </th>
                      <th style={{ width: 200, minWidth: 200, maxWidth: 200 , color: "white" }}>
                        Count
                      </th>
                      <th style={{ width: 200, minWidth: 200, maxWidth: 200 , color: "white" }}>
                        Marks
                      </th>
                      <th style={{ width: 200, minWidth: 200, maxWidth: 200 , color: "white" }}>
                        Upload
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderParamRows({
                      params,
                      counts,
                      marks,
                      uploadedFiles,
                      handleFileInputChange,
                      getParamDisplay,
                    })}
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
            <div className="row text-center text-sm-start mb-3">
              {/* <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Total Params:</span>
                <div className="fw-bold">{totalParams}</div>
              </div> */}
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Filled Params:</span>
                <div className="fw-bold">{filledFields}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Positive Marks:</span>
                <div className="fw-bold text-primary">{positiveMarks.toFixed(2)}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Negative Marks:</span>
                <div className="fw-bold text-danger">{negativeMarks.toFixed(2)}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Total Marks:</span>
                <div className="fw-bold text-success">{totalMarks.toFixed(2)}</div>
              </div>
            </div>

            <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-2 justify-content-end">
              <button
                type="button"
                className="_btn outline"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
              <button type="submit" className="_btn primary">
                Submit
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CitationReviewPage;
