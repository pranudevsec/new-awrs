const Pagination = () => {
    return (
        <div className="pagination-wrapper d-flex align-items-center justify-content-between">
            <div className="rows-per-page d-flex align-items-center gap-2">
                <p className="d-sm-inline d-none">Rows per page</p>
                <select name="" id="" className="form-select">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="25">25</option>
                </select>
            </div>
            <div className="main-pagination d-flex align-items-center gap-2">
                <span className="page-info d-sm-inline d-none">Page 1 of 1</span>
                <button className="page-btn disabled" disabled>
                    &laquo;
                </button>
                <button className="page-btn disabled" disabled>
                    &lsaquo;
                </button>
                <button className="page-btn">
                    &rsaquo;
                </button>
                <button className="page-btn">
                    &raquo;
                </button>
            </div>
        </div>
    );
};

export default Pagination;
