const TopWinnersList = () => {
    const handleRowClick = (id: string) => {
        console.log("Row clicked:", id);
        // You can navigate or open modal here
    };

    return (
        <div className="top-winners-list mb-4">
            <div className="table-responsive">
                <table className="table-style-2 w-100">
                    <thead>
                        <tr>
                            <th style={{ width: 200 }}>Application Id</th>
                            <th style={{ width: 150 }}>Unit ID</th>
                            <th style={{ width: 180 }}>Submission Date</th>
                            <th style={{ width: 150 }}>Type</th>
                            <th style={{ width: 150 }}>Total Marks</th>
                            <th style={{ width: 150 }}>Command</th>
                            <th style={{ width: 200 }}>Arm / Service</th>
                            <th style={{ width: 200 }}>Role / Deployment</th>
                            <th style={{ width: 200 }}>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(6)].map((_, i) => {
                            const appId = `#12345${i + 1}`;
                            return (
                                <tr
                                    key={i}
                                    className="clickable-row"
                                    onClick={() => handleRowClick(appId)}
                                >
                                    <td>{appId}</td>
                                    <td>UNIT-{i + 1}</td>
                                    <td>2025-08-12</td>
                                    <td>Citation</td>
                                    <td>97</td>
                                    <td>Command-{i + 1}</td>
                                    <td>{unitTypeOptions[i % unitTypeOptions.length].label}</td>
                                    <td>{matrixUnitOptions[i % matrixUnitOptions.length].label}</td>
                                    <td>Location-{i + 1}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Options
export const unitTypeOptions = [
    { label: "AAD", value: "AAD" },
    { label: "ARMD/MECH INF", value: "ARMD/MECH INF" },
    { label: "ARMY AVN", value: "ARMY AVN" },
    { label: "ARMY DOG UNIT", value: "ARMY DOG UNIT" }
];

export const matrixUnitOptions = [
    { label: "CI/CT", value: "HINTERLAND" },
    { label: "LC", value: "LC" },
    { label: "AIOS", value: "AIOS" },
    { label: "LAC", value: "LAC" },
    { label: "HAA", value: "HAA" }
];

export default TopWinnersList;
