import { Link, NavLink } from "react-router-dom"
import { sidebarStructure } from "./structure"

const SidebarMenu = () => {
    return (
        <aside className="sidebar-menu flex-shrink-0 d-xl-block d-none">
            <div className="position-sticky top-0">
                <Link to="/" className="logo-sidebar d-block">
                    <img src="/media/logo/logo-text.svg" alt="Logo" />
                </Link>
            </div>
            <div className="scroll-style-85">
                <div className="sidebar-wrapper mt-3 pb-3">
                    {sidebarStructure.map((item, index) => (
                        <NavLink to={item.to} className="nav-items d-flex align-items-center fw-5 position-relative" key={index}>
                            <div className="d-flex align-items-center text-truncate">
                                <span className="nav-icon me-2 d-inline-flex align-items-center justify-content-center">
                                    {item.icon}
                                </span>
                                <span className="text-truncate">{item.label}</span>
                            </div>
                        </NavLink>
                    ))}
                </div>
            </div>
        </aside >
    )
}

export default SidebarMenu