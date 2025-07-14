import { NavLink } from "react-router-dom";
import { sidebarStructure } from "./structure";
import { useAppSelector } from "../../reduxToolkit/hooks";
import { SVGICON } from "../../constants/iconsList";
import { Chatbot } from "../../screens/Chatbot/Chatbot";

const SidebarMenu = () => {
  const profile = useAppSelector((state) => state.admin.profile);
  const userRole = profile?.user?.user_role;
  const isMember = profile?.user?.is_member ?? false;
  const alwaysVisible: string[] = [];
  const cw2_type = profile?.user?.cw2_type?.toLowerCase() ?? "";
  if (
    userRole !== "admin" &&
    userRole !== "cw2" &&
    userRole !== "headquarter"
  ) {
    if (userRole !== "command") {
      alwaysVisible.push("Clarification Received", "Home", "Profile Settings");
    }
    // Allow "Clarification Raised" for all except "unit"
    if (userRole !== "unit") {
      alwaysVisible.push("Clarification Raised");
    }
  }

  const dashboardItem = sidebarStructure.find(item => item.label === "Dashboard");

  const commandExtraLabels = ["Scoreboard", "Winners", "Home", "Profile Settings"];
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

    filteredStructure.push(allApplicationsItem);
    if (userRole !== "brigade") { filteredStructure.push(withdrawItem); }
    if (!isMember) { filteredStructure.push(historyItem); filteredStructure.push(acceptedApplicationItem); }
  }

  if (userRole === "headquarter") {
    filteredStructure.push(allApplicationsItem);
    filteredStructure = filteredStructure.filter(item => item.label !== "Profile Settings");
  }
  if (
    userRole === "cw2" &&
    (cw2_type === "mo" || cw2_type === "ol")
  ) {
    filteredStructure.push(historyItem);
  }

  return (
    <aside className="sidebar-menu flex-shrink-0 d-xl-block d-none bg-dark text-white p-3">
      <div className="d-flex flex-column justify-content-inbetween align-items-center">
        <div className="d-flex flex-column justify-content-center align-items-center gap-2 mb-2">
          <h5 className="text-white" >Menu</h5>
          <div className="w-50" style={{ height: "4px", backgroundColor: "#dc3545", borderRadius: "50px" }}></div>
        </div>
        <div className="scroll-style-85">
          <div className="sidebar-wrapper mt-3 pb-3">
            {filteredStructure.map((item, index) => (
              <NavLink
                to={item.to}
                className="nav-items d-flex align-items-center fw-5 position-relative text-white py-2"
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
        <Chatbot/>
      </div>
    </aside>
  );
};

export default SidebarMenu;
