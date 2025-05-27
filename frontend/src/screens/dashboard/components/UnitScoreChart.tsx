import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList,
} from 'recharts';

const data = [
    { name: 'Artillery', score: 95 },
    { name: 'Engineers', score: 82 },
    { name: 'Signa', score: 74 },
    { name: 'Infairy', score: 65 },
];

const UnitScoreChart = () => {
    return (
        <div className="unit-score-chart">
            <h2 className="fw-6 mb-4">Top Units by Total Score</h2>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="var(--secondary-default)" barSize={40}>
                            <LabelList dataKey="score" position="top" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UnitScoreChart;
