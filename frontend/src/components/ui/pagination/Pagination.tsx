interface PaginationProps {
    meta: Meta;
    page: number;
    limit: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setLimit: React.Dispatch<React.SetStateAction<number>>;
}

const Pagination: React.FC<PaginationProps> = ({ meta, page, limit, setPage, setLimit }) => {

    if (!meta || typeof meta.totalPages !== 'number' || typeof meta.currentPage !== 'number') {
        return null;
    }

    const { totalPages, currentPage } = meta;

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    return (
        <div className="pagination-wrapper d-flex align-items-center justify-content-between mt-4">
            <div className="rows-per-page d-flex align-items-center gap-2">
                <p className="d-sm-inline d-none">Rows per page</p>
                <select
                    className="form-select"
                    value={limit}
                    onChange={handleLimitChange}
                >
                    {[5, 10, 15, 20, 25].map((num) => (
                        <option key={num} value={num}>
                            {num}
                        </option>
                    ))}
                </select>
            </div>
            <div className="main-pagination d-flex align-items-center gap-2">
                <span className="page-info d-sm-inline d-none">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                >
                    &laquo;
                </button>
                <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                    &lsaquo;
                </button>
                <button
                    className="page-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                >
                    &rsaquo;
                </button>
                <button
                    className="page-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage(totalPages)}
                >
                    &raquo;
                </button>
            </div>
        </div>
    );
};

export default Pagination;
