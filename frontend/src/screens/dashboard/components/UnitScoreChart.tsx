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
    unitScores: {
        name: string;
        score: number;
    }[];
}

const UnitScoreChart: React.FC<UnitScoreChartProps> = ({ unitScores }) => {
    return (
        <div className="unit-score-chart h-100">
            <h2 className="fw-6 mb-4">Top Units by Total Score</h2>
            <div style={{ height: 250, overflowX: "auto" }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                    <BarChart data={unitScores} margin={{ top: 20, right: 0, left: -25, bottom: 0 }} >
                        <CartesianGrid strokeDasharray="8" vertical={false} stroke='var(--gray-100)' />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="score" fill="var(--secondary-default)" barSize={30} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UnitScoreChart;
