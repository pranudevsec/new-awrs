import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { unwrapResult } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import EmptyTable from "../../../components/ui/empty-table/EmptyTable";
import Loader from "../../../components/ui/loader/Loader";
import { SVGICON } from "../../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { getConfig } from "../../../reduxToolkit/services/config/configService";
import { fetchParameters } from "../../../reduxToolkit/services/parameter/parameterService";
import { resetCitationState } from "../../../reduxToolkit/slices/citation/citationSlice";
import { createCitation } from "../../../reduxToolkit/services/citation/citationService";
import type { Parameter } from "../../../reduxToolkit/services/parameter/parameterInterface";

const DRAFT_STORAGE_KEY = "applyCitationDraft";

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
  const profile :any= useAppSelector((state) => state.admin.profile);
  const { loading } = useAppSelector((state) => state.parameter);

  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [marks, setMarks] = useState<Record<number, number>>({});
  const filteredParameters = parameters.filter((param: any) => counts[param.param_id] !== undefined && counts[param.param_id] !== "");
  const groupedParams = groupParametersByCategory(filteredParameters);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      const firstCategory = Object.keys(groupedParams)[0];
      if (firstCategory) {
        initializedRef.current = true;
      }
    }
  }, [groupedParams]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
        const requiredFields = [
          { key: "bde", name: "Brigade" },
          { key: "div", name: "Division" },
          { key: "corps", name: "Corps" },
          { key: "comd", name: "Command" },
          { key: "name", name: "Unit Name" },
        ];
    
        const missingFields = requiredFields.filter(
          (field) => !profile?.unit?.[field.key]
        );
    
        if (missingFields.length > 0) {
          const missingNames = missingFields.map((f) => f.name).join(", ");
          toast.error(`Please fill the following unit fields: ${missingNames}`);
            navigate("/profile-settings");
          return;
        }
   
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

        const payload = {
          date_init: "2024-04-01",
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

  // Total Fields Filled
  const filledFields = Object.values(counts).filter((value) => value !== "").length;

  // Total Marks
  const totalMarks = Object.values(marks).reduce((sum, val) => sum + val, 0);

  const negativeMarks = 0;

  // Total Parameters
  const totalParams = parameters.length;

  if (loading) return <Loader />

  return (
    <div className="apply-citation-section">
      <div className="d-flex flex-sm-row flex-column align-items-sm-center justify-content-between mb-4">
        <Breadcrumb
          title="Citation For Review"
          paths={[
            { label: "Home", href: "/applications" },
            { label: "Apply for Citation", href: "/applications/citation" },
            { label: "Citation For Review", href: "/applications/citation-review" },
          ]}
        />
      </div>
      {Object.keys(groupedParams).length === 0 ?
        <EmptyTable />
        :
        <form onSubmit={formik.handleSubmit}>
          <div
            ref={scrollContainerRef}
            style={{
              height: '70vh',
              overflowY: 'auto',
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
                      <th style={{ width: 300, minWidth: 300, maxWidth: 300 }}>Parameter</th>
                      <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>Count</th>
                      <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>Marks</th>
                      <th style={{ width: 200, minWidth: 200, maxWidth: 200 }}>Upload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map((param: any) => {
                      const countValue = counts[param.param_id];
                      const markValue = marks[param.param_id];

                      if (countValue === undefined || countValue === "") return null;

                      return (
                        <tr key={param.param_id}>
                          <td style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
                            <p className="fw-5">{param.name}</p>
                          </td>
                          <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                            <p className="fw-5">{countValue !== undefined && countValue !== ""
                              ? <span>{countValue}</span>
                              : <span>--</span>}</p>
                          </td>
                          <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                            <span><p className="fw-5">{markValue !== undefined ? markValue : "--"}</p></span>
                          </td>
                          <td style={{ width: 200, minWidth: 200, maxWidth: 200 }}>
                            {param.proof_reqd ? (
                              <a
                                href="https://file-examples.com/storage/fefdd7ab126835e7993bb1a/2017/10/file-sample_150kB.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 18 }}
                              >
                                {SVGICON.app.pdf}
                              </a>
                            ) : (
                              <span>Not required</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="submit-button-wrapper border-top pt-3 mt-3">
            <div className="row text-center text-sm-start mb-3">
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Total Params:</span>
                <div className="fw-bold">{totalParams}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Filled Params:</span>
                <div className="fw-bold">{filledFields}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Negative Marks:</span>
                <div className="fw-bold text-danger">{negativeMarks}</div>
              </div>
              <div className="col-6 col-sm-3">
                <span className="fw-medium text-muted">Total Marks:</span>
                <div className="fw-bold text-success">{totalMarks}</div>
              </div>
            </div>

            <div className="d-flex flex-sm-row flex-column gap-sm-3 gap-2 justify-content-end">
              <button type="submit" className="_btn primary">
                Submit
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  );
};

export default CitationReviewPage;
