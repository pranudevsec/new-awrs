const ApplyAppreciation = () => {
    return (
        <div className="apply-citation-section">
            <h3 className="breadcrumb-title font-lexend fw-6 mb-3">Apply for Appreciation</h3>
            <div className="top-fields-area">
                <div className="row align-items-center justify-content-between row-gap-2">
                    <div className="col-md-4">
                        <label
                            htmlFor="awardType"
                            className="form-label mb-1"
                        >
                            Award Type:
                        </label>
                        <input
                            type="text"
                            className={`form-control`}
                            id="awardType"
                            name="awardType"
                            placeholder="Enter award type"
                            autoComplete="off"
                        />
                    </div>
                    <div className="col-md-4">
                        <label
                            htmlFor="cyclePeriod"
                            className="form-label mb-1"
                        >
                            Cycle Period:
                        </label>
                        <input
                            type="text"
                            className={`form-control`}
                            id="cyclePeriod"
                            name="cyclePeriod"
                            placeholder="Enter award type"
                            autoComplete="off"
                        />
                    </div>
                    <div className="col-md-4">
                        <label
                            htmlFor="lastDate"
                            className="form-label mb-1"
                        >
                            Last date:
                        </label>
                        <input
                            type="text"
                            className={`form-control`}
                            id="lastDate"
                            name="lastDate"
                            placeholder="Enter award type"
                            autoComplete="off"
                        />
                    </div>
                </div>
            </div>
            <div className="table-responsive">
                <table className="main-table w-100">
                    <thead>
                        <tr>
                            <th style={{ width: 200 }}>
                                <div className="d-flex align-items-start">Parameter</div>
                            </th>
                            <th style={{ width: 300 }}>
                                <div className="d-flex align-items-start">Count</div>
                            </th>
                            <th style={{ width: 300 }}>
                                <div className="d-flex align-items-start">Marks</div>
                            </th>
                            <th style={{ width: 300 }}>
                                <div className="d-flex align-items-start">Upload</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Enemy Kills</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 2</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 3</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 4</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 5</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 6</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="number" className="form-control" placeholder="Enter count" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <div className="input-with-tooltip">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter marks"
                                        autoComplete="off"
                                    />
                                    <div className="tooltip-icon">
                                        <i className="info-circle">i</i>
                                        <span className="tooltip-text">1 Kill 4 marks and max 20 marks</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ApplyAppreciation