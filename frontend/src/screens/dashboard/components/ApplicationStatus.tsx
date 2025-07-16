import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import type { DashboardStats } from '../../../reduxToolkit/services/command-panel/commandPanelInterface';

const COLORS = ['#FFE089', '#1A7262', '#7AD9D2', '#21438D'];

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const { name, value } = payload[0].payload;

    return (
        <div
            style={{
                backgroundColor: '#fff',
                border: '1px solid var(--muted)',
                padding: '10px 15px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: "flex",
                alignItems: "center"
            }}
        >
            <p style={{ margin: 0, fontSize: 12 }}>{name}</p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 'bold' }}>: {value}</p>
        </div>
    );
};

interface ProductDetailProps {
    dashboardStats: DashboardStats | null;
}

interface LegendFormatterProps {
    value: string;
}
const LegendFormatter: React.FC<LegendFormatterProps> = ({ value }) => (
    <span className="legend-text" style={{ fontSize: 14, fontWeight: 600 }}>
        {value}
    </span>
);

const ApplicationStatus: React.FC<ProductDetailProps> = ({ dashboardStats }) => {
    const data = [
        { name: 'Pending', value: dashboardStats?.totalPendingApplications || 0 },
        { name: 'Approved', value: dashboardStats?.approved || 0 },
        { name: 'Rejected', value: dashboardStats?.rejected || 0 },
    ];

    const renderLegendLabel = (value: string) => {
        return <LegendFormatter value={value} />;
    };

    return (
        <div className="application-status-chart h-100">
            <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
                <h2 className="fw-6">Top Units by Total Score</h2>
            </div>
            <div style={{ height: 250, overflowX: "auto" }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                    <PieChart margin={{ top: 20, right: 0, left: -25, bottom: 0 }} >
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={100}
                            paddingAngle={5}
                            cornerRadius={10}
                            dataKey="value"
                        >
                            {data.map((val, index) => (
                                <Cell key={`cell-${val}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            iconType="circle"
                            formatter={renderLegendLabel}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ApplicationStatus;
