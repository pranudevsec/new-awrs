import { Link } from "react-router-dom"

const Thanks = () => {
    return (
        <div className="thanks-section text-center">
            {/* <img src="/media/icons/confirm.gif" alt="Confirm" className="img-fluid mx-auto" /> */}
            <h1 className="font-kaushan mb-5 fw-6">Thanks! Application submitted <br /> on 22-05-2025</h1>
            <Link to="/" className="border-0 return-btn">Go Home</Link>
        </div>
    )
}

export default Thanks