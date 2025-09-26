import type { FC } from "react"
import { NavLink } from "react-router-dom";
import Offcanvas from "react-bootstrap/Offcanvas";
import { sidebarStructure } from "../layouts/components/structure";
import { SVGICON } from "../constants/iconsList";
import { useAppSelector } from "../reduxToolkit/hooks";

interface SidebarMobileMenuProps {
    show: boolean;
    handleClose: () => void;
}

const SidebarMobileMenu: FC<SidebarMobileMenuProps> = ({ show, handleClose }) => {
    const profile = useAppSelector((state) => state.admin.profile);
    const userRole = profile?.user?.user_role;
    const isMember = profile?.user?.is_member ?? false;
    const alwaysVisible: string[] = [];

    if (
        userRole !== "admin" &&
        userRole !== "command" &&
        userRole !== "cw2" &&
        userRole !== "headquarter"
    ) {
        alwaysVisible.push("Clarification Received", "Home", "Profile Settings");
        if (userRole !== "unit") alwaysVisible.push("Clarification Raised");
    }

    const dashboardItem = sidebarStructure.find(item => item.label === "Dashboard");

    const commandExtraLabels = ["Scoreboard", "Home", "Profile Settings"];
    const headquarterExtraLabels = ["Dashboard", "Home", "Awards", "Scoreboard", "Profile Settings"];

    let filteredStructure = sidebarStructure.filter((item) => {
        if (item.label === "Dashboard") return false;

        if (alwaysVisible.includes(item.label)) {
            return true;
        }

        if (userRole === "command" || userRole === "cw2") {
            return commandExtraLabels.includes(item.label);
        }

        if (userRole === "headquarter") {
            return headquarterExtraLabels.includes(item.label);
        }

        if (userRole === "admin") {
            return ["Admin Settings", "Parameters"].includes(item.label);
        }

        return false;
    });

    if ((userRole === "command" || userRole === "headquarter") && dashboardItem) {
        filteredStructure = [dashboardItem, ...filteredStructure];
    }

    if (userRole === "unit") {
        filteredStructure.push({
            label: "Submitted Forms",
            icon: SVGICON.sidebar.raisedClarification,
            to: "/submitted-forms/list",
        });
    }

    const acceptedApplicationItem = {
        label: "Accepted Application",
        icon: SVGICON.sidebar.profile,
        to: "/application/accepted",
    };

    const historyItem = {
        label: "History",
        icon: SVGICON.sidebar.history,
        to: "/history",
    };

    const withdrawItem = {
        label: "Withdraws",
        icon: SVGICON.sidebar.withdraws,
        to: "/withdraw-quests",
    };

    const allApplicationsItem = {
        label: "All Applications",
        icon: SVGICON.sidebar.allApplications,
        to: "/all-applications",
    };

    if (
        userRole === "brigade" ||
        userRole === "division" ||
        userRole === "corps" ||
        userRole === "command"
    ) {
        filteredStructure.push(acceptedApplicationItem);
        filteredStructure.push(allApplicationsItem);
        if (userRole !== "brigade") { filteredStructure.push(withdrawItem); }
        if (!isMember) { filteredStructure.push(historyItem); }
    }

    if (userRole === "headquarter") {
        filteredStructure.push(allApplicationsItem);
        filteredStructure = filteredStructure.filter(item => item.label !== "Profile Settings");
    }

    return (
        <Offcanvas
            show={show}
            onHide={handleClose}
            placement={"start"}
            className="sidebar-menu-offcanvas bg-dark"
        >
            <div className="offcanvas-body px-0">
                <div className="d-flex flex-column justify-content-center align-items-center gap-2 mb-4">
                    <h5 className="text-white" >Menu</h5>
                    <div className="w-50" style={{ height: "4px", backgroundColor: "#dc3545", borderRadius: "50px" }}></div>
                </div>
                <div className="sidebar-wrapper">
                    {filteredStructure.map((item) => (
                        <NavLink to={item.to} className="nav-items d-flex align-items-center fw-5 position-relative" key={item.to} onClick={handleClose}>
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
