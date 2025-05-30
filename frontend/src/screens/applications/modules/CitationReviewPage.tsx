import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../components/ui/breadcrumb/Breadcrumb";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import React, {  useState, useEffect } from "react";
import { getConfig } from "../../../reduxToolkit/services/config/configService";
import type { Parameter } from "../../../reduxToolkit/services/parameter/parameterInterface";
import { fetchParameters } from "../../../reduxToolkit/services/parameter/parameterService";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import { resetCitationState } from "../../../reduxToolkit/slices/citation/citationSlice";
import { createCitation } from "../../../reduxToolkit/services/citation/citationService";
import { unwrapResult } from "@reduxjs/toolkit";
import { SVGICON } from "../../../constants/iconsList";

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
  const profile = useAppSelector((state) => state.admin.profile);

  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [marks, setMarks] = useState<Record<number, number>>({});
  const filteredParameters = parameters.filter((param:any) => counts[param.param_id] !== undefined && counts[param.param_id] !== "");
const groupedParams = groupParametersByCategory(filteredParameters);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (!initializedRef.current) {
      const firstCategory = Object.keys(groupedParams)[0];
      if (firstCategory) {
        initializedRef.current = true; // mark as initialized
      }
    }
  }, [groupedParams]);
  
const scrollContainerRef = React.useRef<HTMLDivElement>(null);
const categoryRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

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
      }catch (err) {
        console.error("create failed", err);
      }
    },
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [configRes, paramsRes] = await Promise.all([
          dispatch(getConfig()).unwrap(),
          dispatch(fetchParameters({ awardType: "citation",search:"" })).unwrap(),
        ]);

        if (configRes?.success && configRes.data) {
          setCyclePerios(configRes.data.current_cycle_period);
          const formattedDate = configRes.data.deadline?.split("T")[0] || "";
          setLastDate(formattedDate);
          if(profile){
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
      <form onSubmit={formik.handleSubmit}>
<div
  ref={scrollContainerRef}
  style={{
    height: '80vh', // adjust height as needed
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
  {params.map((param: any) => {
    const countValue = counts[param.param_id];
    const markValue = marks[param.param_id];

    // Only show rows that have saved count or marks in localStorage
    if (countValue === undefined || countValue === "") return null;

    return (
      <tr key={param.param_id}>
        <td><p className="fw-5">{param.name}</p></td>
        <td>
          
            <p className="fw-5">{countValue !== undefined && countValue !== ""
            ? <span>{countValue}</span>
            : <span>--</span>}</p>
        </td>
        <td>
          <span><p className="fw-5">{markValue !== undefined ? markValue : "--"}</p></span>
        </td>
        <td>
          {param.proof_reqd ? (
            <td style={{ width: 100 }}>
            <a
              href="https://file-examples.com/storage/fefdd7ab126835e7993bb1a/2017/10/file-sample_150kB.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 18 }}
            >
              {SVGICON.app.pdf}
            </a>
          </td>
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
    </div>
  );
};

export default CitationReviewPage;
