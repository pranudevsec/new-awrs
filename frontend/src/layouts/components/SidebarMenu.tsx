import { Link, NavLink } from "react-router-dom";
import { sidebarStructure } from "./structure";
import { useAppSelector } from "../../reduxToolkit/hooks";

const SidebarMenu = () => {
  const profile = useAppSelector((state) => state.admin.profile);
  const userRole = profile?.user?.user_role;
  //   const isAdmin = userRole === "admin";

  const alwaysVisible: string[] = [];

  // Clarification is visible only to users who are NOT admin AND NOT command
  if (userRole !== "admin" && userRole !== "command") {
    alwaysVisible.push("Clarifications to Resolve", "Home", "Profile Settings");
  }

  // Find dashboard item from structure
  const dashboardItem = sidebarStructure.find(item => item.label === "Dashboard");

  // Items specifically for command role
  const commandExtraLabels = ["Scoreboard", "Winners", "Home", "Profile Settings"];

  // Filter structure items according to role and alwaysVisible
  let filteredStructure = sidebarStructure.filter((item) => {
    if (item.label === "Dashboard") return false; // exclude Dashboard here for now

    if (alwaysVisible.includes(item.label)) {
      return true;
    }

    if (userRole === "command") {
      // Show only Scoreboard and Winners for command role (besides Dashboard added later)
      return commandExtraLabels.includes(item.label);
    }

    if (userRole === "admin") {
      return ["Admin Settings", "Parameters"].includes(item.label);
    }

    return false;
  });

  // If command user, show Dashboard on top
  if (userRole === "command" && dashboardItem) {
    filteredStructure = [dashboardItem, ...filteredStructure];
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