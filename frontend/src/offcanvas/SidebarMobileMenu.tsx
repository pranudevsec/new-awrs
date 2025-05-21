import type { FC } from "react"
import Offcanvas from "react-bootstrap/Offcanvas";
import { Link, NavLink } from "react-router-dom";
import { sidebarStructure } from "../layouts/components/structure";

interface SidebarMobileMenuProps {
    show: boolean;
    handleClose: () => void;
}

const SidebarMobileMenu: FC<SidebarMobileMenuProps> = ({ show, handleClose }) => {
    return (
        <Offcanvas
            show={show}
            onHide={handleClose}
            placement={"start"}
            className="sidebar-menu-offcanvas"
        >
            <div className="offcanvas-header p-0">
                <Link to="/" className="logo-sidebar d-block">
                    <img src="/media/logo/logo-text.svg" alt="Logo" />
                </Link>
            </div>
            <div className="offcanvas-body p-0">
                <div className="sidebar-wrapper">
                    {sidebarStructure.map((item, index) => (
                        <NavLink to={item.to} className="nav-items d-flex align-items-center fw-5 position-relative" key={index} onClick={handleClose}>
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
        </Offcanvas>
    )
}

export default SidebarMobileMenu