import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

const data = [
    { name: 'Pending', value: 40 },
    { name: 'Clarification', value: 30 },
    { name: 'Rejected', value: 30 },
];

const COLORS = [
    '#3e4b11', // dark green for Pending
    '#fdf4dc', // light yellow for Clarification
    '#6b2d20'  // deep brown-red for Rejected
];

const ApplicationStatus = () => {
    return (
        <div className="container application-status-chart p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Applications by Status</h5>
                <span className="text-muted">Jan–Jun 2025</span>
            </div>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            iconType="circle"
                            formatter={(value) => (
                                <span className="legend-text">{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ApplicationStatus;
