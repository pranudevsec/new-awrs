const Applications = () => {
    return (
        <div className="application-section">
            <h3 className="breadcrumb-title font-lexend fw-6 mb-3">Applications</h3>
            <div className="card-contents">
                <div className="row row-gap-3">
                    <div className="col-lg-3 col-sm-6">
                        <div className="card border-0 d-flex align-items-center justify-content-center">
                            <div className="card-icon" >
                                <img src="/media/icons/medal.png" alt="Medal" width={100} />
                            </div>
                            <h5 className="fw-6 mt-4">Citation</h5>
                        </div>
                    </div>
                    <div className="col-lg-3 col-sm-6">
                        <div className="card border-0 d-flex align-items-center justify-content-center">
                            <div className="card-icon" >
                                <img src="/media/icons/thumb.png" alt="Thumb" width={100} />
                            </div>
                            <h5 className="fw-6 mt-4">Appreciation</h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Applications