import { SVGICON } from "../../../constants/iconsList"

const EmptyTable = () => {
    return (
        <div className="py-5 text-center">
            {SVGICON.app.noData}
        </div>
    )
}

export default EmptyTable