const Pagination = () => {
    return (
        <div className="custom-pagination d-flex align-items-center gap-2">
            <span className="page-info">Page 1 of 2</span>

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

    )
}

export default Pagination