import { SVGICON } from "../../../constants/iconsList"

const EmptyTable = () => {
    return (
        <div className="py-5 text-center">
            <div className="d-flex align-items-center justify-content-center">
                {SVGICON.app.noData}
            </div>
            <p className="fw-5 mt-4">No Data Found</p>
        </div>
    )
}

export default EmptyTable