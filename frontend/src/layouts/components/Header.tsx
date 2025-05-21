import { useEffect, useRef, useState } from "react";
import SidebarMobileMenu from "../../offcanvas/SidebarMobileMenu";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../reduxToolkit/hooks";
import { signOut } from "../../reduxToolkit/slices/auth/authSlice";
import { SVGICON } from "../../constants/iconsList";

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // States
    const [open, setOpen] = useState(false);
    const [mobileMenuShow, setMobileMenu] = useState<boolean>(false);

    // Sign out function
    const handleSignOut = () => {
        dispatch(signOut());
        localStorage.removeItem("persist:admin");
        navigate("/");
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <header className="main-header position-sticky top-0">
                <div className="d-flex align-items-center justify-content-xl-end justify-content-between gap-4">
                    <button className="d-xl-none d-inline-flex align-items-center justify-content-center bg-transparent border-0"
                        onClick={() => setMobileMenu(true)}>
                        {SVGICON.header.togglemenu}
                    </button>
                    <div className="d-flex align-items-center gap-4">
                        <button className="nav-icon-btn d-inline-flex align-items-center justify-content-center bg-transparent border-0" >{SVGICON.header.notification}
                        </button>
                        <div className="position-relative" ref={dropdownRef}>
                            <button className="bg-transparent border-0" onClick={() => setOpen((prev) => !prev)}>
                                <img
                                    src="/media/avatar/profile-avatar.webp"
                                    alt="Profile"
                                    className="rounded-circle"
                                    width={40}
                                    height={40}
                                />
                            </button>
                            <div className={`profile-dropdown-menu ${open ? "show" : ""}`}>
                                <div className="profile-info d-flex align-items-center gap-3">
                                    <img
                                        src="/media/avatar/profile-avatar.webp"
                                        alt="Profile"
                                        className="rounded-circle"
                                        width={40}
                                        height={40}
                                    />
                                    <div>
                                        <h6 className="font-lexend fw-6">Albert Flores</h6>
                                        <p className="fw-4">flores@doe.io</p>
                                    </div>
                                </div>
                                <hr />
                                <div className="p-2">
                                    <Link to="/applications" className="dropdown-item">My Profile</Link>
                                    <Link to="/applications" className="dropdown-item">Account Settings</Link>
                                    <Link to="/applications" className="dropdown-item">Activity Log</Link>
                                </div>
                                <hr />
                                <div className="p-2">
                                    <button className="dropdown-item" onClick={handleSignOut}>Sign Out</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header >
            <SidebarMobileMenu show={mobileMenuShow} handleClose={() => setMobileMenu(false)} />
        </>
    )
}

export default Header