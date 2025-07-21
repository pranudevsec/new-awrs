import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

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
            <p style={{ margin: 0, fontSize: 12 }}>{label}</p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 'bold' }}>: {payload[0].value} </p>
        </div>
    );
};

interface UnitScoreChartProps {
    data: { name: string; [key: string]: any }[];
    dataKey: string;
    title: string;
    yAxisDomain?: [number, number];
    barColor?: string;
    height?: number;
}

const UnitScoreChart: React.FC<UnitScoreChartProps> = ({
    data,
    dataKey,
    title,
    yAxisDomain = [0, 100],
    barColor = "var(--secondary-default)",
    height = 250,
}) => {
    return (
        <div className="unit-score-chart h-100">
            <h2 className="fw-6 mb-4">{title}</h2>
            <div style={{ height, overflowX: "auto" }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                    <BarChart data={data} margin={{ top: 20, right: 0, left: -25, bottom: 0 }} >
                        <CartesianGrid strokeDasharray="8" vertical={false} stroke='var(--gray-100)' />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis domain={yAxisDomain} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey={dataKey} fill={barColor} barSize={30} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UnitScoreChart;
