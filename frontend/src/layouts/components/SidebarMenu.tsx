import { Link, NavLink } from "react-router-dom";
import { sidebarStructure } from "./structure";
import { useAppSelector } from "../../reduxToolkit/hooks";
import { SVGICON } from "../../constants/iconsList";

const SidebarMenu = () => {
  const profile = useAppSelector((state) => state.admin.profile);
  const userRole = profile?.user?.user_role;

  const alwaysVisible: string[] = [];

  if (
    userRole !== "admin" &&
    userRole !== "command" &&
    userRole !== "cw2" &&
    userRole !== "headquarter"
  ) {
    alwaysVisible.push("Clarification Received", "Home", "Profile Settings");

    if (userRole !== "unit") {
      alwaysVisible.push("Clarification Raised");
    }
  }

  const dashboardItem = sidebarStructure.find(item => item.label === "Dashboard");

  const commandExtraLabels = ["Scoreboard", "Winners", "Home", "Profile Settings"];
  const headquarterExtraLabels = ["Dashboard", "Home", "Awards", "Scoreboard", "Profile Settings"];

  let filteredStructure = sidebarStructure.filter((item) => {
    if (item.label === "Dashboard") return false; // Dashboard added manually

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

  if (
    userRole === "brigade" ||
    userRole === "division" ||
    userRole === "corps" ||
    userRole === "command"
  ) {
    filteredStructure.push(acceptedApplicationItem);
  }

  const historyItem = {
    label: "History",
    icon: SVGICON.sidebar.history,
    to: "/history",
  };

  if (userRole === "unit") {
    filteredStructure.push(historyItem);
  }

  return (
    <aside className="sidebar-menu flex-shrink-0 d-xl-block d-none">
      <div className="position-sticky top-0">
        <Link to="/" className="logo-sidebar d-block">
          <img src="/media/logo/logo-text.svg" alt="Logo" />
        </Link>
      </div>
      <div className="scroll-style-85">
        <div className="sidebar-wrapper mt-3 pb-3">
          {filteredStructure.map((item, index) => (
            <NavLink
              to={item.to}
              className="nav-items d-flex align-items-center fw-5 position-relative"
              key={index}
            >
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
    </aside>
  );
};

export default SidebarMenu;
