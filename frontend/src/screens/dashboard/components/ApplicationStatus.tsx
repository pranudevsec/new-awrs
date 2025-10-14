import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";
import type { DashboardStats } from "../../../reduxToolkit/services/command-panel/commandPanelInterface";
import { useAppSelector } from "../../../reduxToolkit/hooks";

const COLORS = ["#FFE089", "#1A7262", "#7AD9D2", "#21438D"];

function isHQRole(roleRaw: unknown): boolean {
  const roleText = String(roleRaw ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hqRegex = /\b(hq|hqrs|head\s?quarter(s)?)\b/;
  return hqRegex.test(roleText);
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
    };
  }>;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const { name, value } = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e9ecef",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        fontSize: "14px",
        fontWeight: 500,
      }}
    >
      <div style={{ color: "#6c757d", marginBottom: "4px" }}>{name}</div>
      <div style={{ color: "#495057", fontWeight: 600, fontSize: "16px" }}>
        {value} applications
      </div>
    </div>
  );
};

interface ProductDetailProps {
  dashboardStats: DashboardStats | null | any;
}

const ApplicationStatus: React.FC<ProductDetailProps> = ({ dashboardStats }) => {
  const profile = useAppSelector((state) => state.admin.profile);
  const roleRaw = profile?.user?.user_role;
  const isHQ = isHQRole(roleRaw);


  const rawPending = Number(dashboardStats?.totalPendingApplications ?? 0);
  const approved = Number(dashboardStats?.finalizedApproved ?? 0);
  const rejected = Number(dashboardStats?.rejected ?? 0);
  const totalReported = Number(dashboardStats?.clarificationRaised ?? 0);


  let pending = rawPending;
  const sumParts = rawPending + approved + rejected;
  if (totalReported > sumParts) {
    const diff = totalReported - sumParts;
    pending = Math.max(0, rawPending - diff);
  }

  const data = useMemo(
    () => [
      { name: "Pending", value: pending },
      { name: "Approved", value: approved },
      { name: "Rejected", value: rejected },
    ],
    [pending, approved, rejected]
  );

  const total = useMemo(
    () =>
      data.reduce(
        (sum, item) => sum + (Number.isFinite(item.value) ? item.value : 0),
        0
      ),
    [data]
  );


  if (!profile || !isHQ) return null;

  return (
    <div
      className="application-status-chart h-100"
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #e9ecef",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div className="d-flex flex-wrap gap-2 justify-content-between mb-4">
        <h2
          className="fw-6"
          style={{ fontSize: "20px", color: "#495057", margin: 0, fontWeight: 600 }}
        >
          Applications By Status
        </h2>
        <div style={{ fontSize: "14px", color: "#6c757d", fontWeight: 500 }}>
          Total: {totalReported}
        </div>
      </div>

      <div
        style={{
          height: 220,
          overflowX: "auto",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ResponsiveContainer width="80%" height="100%" minWidth={300}>
          <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={8}
              cornerRadius={8}
              dataKey="value"
            >
              {data.map((val, index) => (
                <Cell
                  key={`cell-${val.name}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
              <LabelList
                dataKey="value"
                position="outside"
                formatter={(value: number) =>
                  total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0%"
                }
                style={{ fontSize: "12px", fontWeight: 600, fill: "#495057" }}
              />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="d-flex justify-content-center mt-3">
        <div className="d-flex gap-4">
          {data.map((item, index) => (
            <div key={item.name} className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />
              <span style={{ fontSize: "14px", color: "#495057", fontWeight: 500 }}>
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;
