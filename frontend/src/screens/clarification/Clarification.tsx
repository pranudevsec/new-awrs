import FormInput from "../../components/form/FormInput"

const Clarification = () => {
    return (
        <div className="apply-citation-section">
            <h3 className="breadcrumb-title font-lexend fw-6 mb-3">Clarification</h3>
            <div className="top-fields-area">
                <div className="row align-items-center justify-content-between row-gap-2">
                    <div className="col-md-4">
                        <FormInput
                            label="Award Type:"
                            name="awardType"
                            placeholder="Enter award type"
                            value=""
                        // onChange={formik.handleChange}
                        // onBlur={formik.handleBlur}
                        // errors={formik.errors.username}
                        // touched={formik.touched.username}
                        />
                    </div>
                    <div className="col-md-4">
                        <FormInput
                            label="Cycle Period:"
                            name="cyclePeriod"
                            placeholder="Enter cycle period"
                            value=""
                        // onChange={formik.handleChange}
                        // onBlur={formik.handleBlur}
                        // errors={formik.errors.username}
                        // touched={formik.touched.username}
                        />
                    </div>
                    <div className="col-md-4">
                        <FormInput
                            label="Last Date:"
                            name="lastDate"
                            placeholder="Enter last date"
                            value=""
                        // onChange={formik.handleChange}
                        // onBlur={formik.handleBlur}
                        // errors={formik.errors.username}
                        // touched={formik.touched.username}
                        />
                    </div>
                </div>
            </div>
            <div className="table-responsive">
                <table className="main-table w-100">
                    <thead>
                        <tr>
                            <th style={{ width: 200 }}>
                                <div className="d-flex align-items-start">Application Id</div>
                            </th>
                            <th style={{ width: 200 }}>
                                <div className="d-flex align-items-start">Parameter</div>
                            </th>
                            <th style={{ width: 300 }}>
                                <div className="d-flex align-items-start">Review</div>
                            </th>
                            <th style={{ width: 300 }}>
                                <div className="d-flex align-items-start">Your Comment</div>
                            </th>
                            <th style={{ width: 300 }}>
                                <div className="d-flex align-items-start">Upload Doc</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">#123456</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Enemy Kills</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <p className="fw-4">Please upload the correct document for parameter 4</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="text" className="form-control" placeholder="Enter comment" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">#123456</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 1</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-4">Please upload the correct document for parameter 4</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="text" className="form-control" placeholder="Enter comment" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">#123456</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 2</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-4">Please upload the correct document for parameter 4</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="text" className="form-control" placeholder="Enter comment" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">#123456</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 3</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-4">Please upload the correct document for parameter 4</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="text" className="form-control" placeholder="Enter comment" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">#123456</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 4</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-4">Please upload the correct document for parameter 4</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="text" className="form-control" placeholder="Enter comment" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">#123456</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 5</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-4">Please upload the correct document for parameter 4</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="text" className="form-control" placeholder="Enter comment" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">#123456</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-5">Parameter 6</p>
                            </td>
                            <td style={{ width: 200 }}>
                                <p className="fw-4">Please upload the correct document for parameter 4</p>
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="text" className="form-control" placeholder="Enter comment" autoComplete="off" />
                            </td>
                            <td style={{ width: 300 }}>
                                <input type="file" className="form-control" autoComplete="off" />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={5}>
                                <div className="d-flex justify-content-end">
                                    <button className="submit-btn border-0">Submit</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Clarification