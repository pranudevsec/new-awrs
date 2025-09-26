import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../reduxToolkit/hooks";
import { fetchApplicationsGraph } from "../../../reduxToolkit/services/application/applicationService";
import FormSelect from "../../../components/form/FormSelect";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------- Robust HQ detector ----------
function isHQRole(roleRaw: unknown): boolean {
  const roleText = String(roleRaw ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // matches: hq, hqrs, headquarter, head quarter, headquarters (anywhere in the string)
  const hqRegex = /\b(hq|hqrs|head\s?quarter(s)?)\b/;
  return hqRegex.test(roleText);
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { name: string };
  }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #f1f3f5",
        padding: "10px 14px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        fontSize: "13px",
        fontWeight: 500,
      }}
    >
      <div style={{ color: "#868e96", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: "#212529", fontWeight: 600, fontSize: "15px" }}>
        {payload[0].value} applications
      </div>
    </div>
  );
};

interface GraphDataFormat {
  x: string[];
  y: number[];
}

interface UnitScoreChartProps {
  data?:any;
  yAxisDomain?:any;
  dataKey?: string;
  title?: string;
  barColor?: string;
  height?: number;
  showFilter?: boolean;
}

const groupByOptions = [
  { value: "arms_service", label: "Arms Service" },
  { value: "comd", label: "Command" },
  { value: "corps", label: "Corps" },
  { value: "div", label: "Division" },
  { value: "bde", label: "Brigade" },
];

const UnitScoreChart: React.FC<UnitScoreChartProps> = ({
  title = "Application Received",
  barColor = "#4f46e5",
  height = 260,
  showFilter = true
}) => {
  const dispatch = useAppDispatch();
  // ---- Read profile & gate to HQ only ----
  const profile = useAppSelector((state) => state.admin.profile);
  const roleRaw = profile?.user?.user_role;
  const isHQ = isHQRole(roleRaw);

  const { graphData, loading } = useAppSelector((state) => state.application);

  // Local state
  const [selectedGroupBy, setSelectedGroupBy] =
    useState<string>("arms_service");

  // Fetch only for HQ
  useEffect(() => {
    if (!isHQ) return;
    dispatch(
      fetchApplicationsGraph({
        page: 1,
        limit: 10,
        group_by: selectedGroupBy,
      }) as any
    );
  }, [dispatch, selectedGroupBy, isHQ]);

  // Transform data
  const chartData = useMemo(() => {
    const g = (graphData || {}) as GraphDataFormat;
    const xs = Array.isArray(g.x) ? g.x : [];
    const ys = Array.isArray(g.y) ? g.y : [];
    return xs.map((name, i) => ({ name, marks: Number(ys[i] ?? 0) }));
  }, [graphData]);

  const hasData = useMemo(
    () => chartData.length > 0 && chartData.some((d) => d.marks > 0),
    [chartData]
  );

  const maxMarks = useMemo(() => {
    const values = chartData.map((d) => d.marks);
    return Math.max(10, ...values);
  }, [chartData]);

  // ---- Hide entirely for non-HQ (no "restricted" card) ----
  if (!profile || !isHQ) return null;

  // ---- Authorized UI ----
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "20px 24px",
        border: "1px solid #f1f3f5",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            color: "#212529",
            margin: 0,
            fontWeight: 600,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontSize: "13px",
            color: "#868e96",
            fontWeight: 500,
          }}
        >
          {hasData ? `${chartData.length} units` : "No data"}
        </span>
      </div>

      {/* Filter */}
      {showFilter && (
        <div style={{ marginBottom: "20px" }}>
          <FormSelect
            label="Select Filter"
            name="groupByFilter"
            options={groupByOptions}
            value={
              groupByOptions.find((opt) => opt.value === selectedGroupBy) ??
              null
            }
            onChange={(opt) =>
              setSelectedGroupBy(opt?.value ?? "arms_service")
            }
            placeholder="Select Group By"
          />
        </div>
      )}

      {/* Chart / States */}
      <div
        style={{
          height,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#6c757d",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Loading…
          </div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 0, left: 0, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f3f5"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6c757d", fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                domain={[0, maxMarks]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6c757d", fontWeight: 500 }}
                dx={-6}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="marks"
                fill={barColor}
                barSize={36}
                radius={[6, 6, 0, 0]}
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))" }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#6c757d",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>
              📊
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "8px",
                color: "#495057",
              }}
            >
              No Data Available
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                textAlign: "center",
                maxWidth: "200px",
                lineHeight: 1.4,
              }}
            >
              No marks data found for the selected group
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      {hasData && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#6c757d",
              fontWeight: 500,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            This chart displys Application Received by{" "}
            {selectedGroupBy.replace(/_/g, " ")}. Higher bars indicate better
            performance.
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitScoreChart;
