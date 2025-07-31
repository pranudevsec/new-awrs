import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SVGICON } from "../../constants/iconsList";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { getProfile } from "../../reduxToolkit/services/auth/authService";
import { signOut } from "../../reduxToolkit/slices/auth/authSlice";
import SidebarMobileMenu from "../../offcanvas/SidebarMobileMenu";

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.admin.profile);

    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // States
    const [open, setOpen] = useState(false);
    const [mobileMenuShow, setMobileMenuShow] = useState<boolean>(false);

    const handleSignOut = () => {
        dispatch(signOut());
        localStorage.removeItem("persist:admin");
        navigate("/authentication/sign-in");
        window.location.reload();
    }

    useEffect(() => {
        if (!profile) dispatch(getProfile());
    }, [profile]);

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
                <div className="d-flex align-items-center justify-content-xl-end justify-content-between ">
                    <button className="d-xl-none d-inline-flex align-items-center justify-content-center bg-transparent border-0 text-white"
                        onClick={() => setMobileMenuShow(true)}>
                        {SVGICON.header.togglemenu}
                    </button>
                    <div className="d-flex align-items-center gap-sm-4 gap-3 text-white" style={{
                        background: '#c1121f',
                    }}>
                        <div className="position-relative" ref={dropdownRef}>
                            <button className="profile-info border-0 bg-transparent d-flex align-items-center gap-sm-3 gap-2" onClick={() => setOpen((prev) => !prev)}>
                                <img
                                    src="/media/avatar/profile-avatar.webp"
                                    alt="Profile"
                                    className="rounded-circle"
                                    width={40}
                                    height={40}
                                />
                                <div>
                                    <h6 className="font-lexend fw-6">{profile?.user?.name ?? 'User'}</h6>
                                    <p className="fw-4">{profile?.user?.username ?? ''}</p>
                                </div>
                                <div className="text-white">
                                    {SVGICON.header.downArrow}
                                </div>
                            </button>
                            <div className={`profile-dropdown-menu ${open ? "show" : ""}`}>
                                <div className="p-2">
                                    <button className="dropdown-item" onClick={handleSignOut}>Sign Out</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header >
            <SidebarMobileMenu show={mobileMenuShow} handleClose={() => setMobileMenuShow(false)} />
        </>
    )
}

export default Header