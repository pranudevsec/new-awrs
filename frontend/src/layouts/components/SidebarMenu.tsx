import { NavLink } from "react-router-dom";
import { sidebarStructure } from "./structure";
import { useAppSelector } from "../../reduxToolkit/hooks";
import { SVGICON } from "../../constants/iconsList";
import { Chatbot } from "../../screens/Chatbot/Chatbot";


const commandExtraLabels = ["Scoreboard", "Winners", "Home", "Profile Settings"];
const headquarterExtraLabels = ["Dashboard", "Home", "Awards", "Scoreboard", "Profile Settings"];

type UserType = {
  user_role?: string;
  is_member?: boolean;
  cw2_type?: string;
};

const SidebarMenu = () => {
  const profile = useAppSelector((state) => state.admin.profile);
  const user = (profile?.user ?? {}) as UserType;
  const userRole = user.user_role ?? "";
  const isMember = user.is_member ?? false;
  const cw2_type = user.cw2_type?.toLowerCase() ?? "";

  const alwaysVisible = getAlwaysVisible(userRole);

  const dashboardItem = sidebarStructure.find(item => item.label === "Dashboard");

  let filteredStructure = filterSidebarStructure(userRole, alwaysVisible);

  if ((userRole === "command" || userRole === "headquarter") && dashboardItem) {
    filteredStructure = [dashboardItem, ...filteredStructure];
  }

  if (userRole === "unit") {
    filteredStructure.push(createSidebarItem("Submitted Forms", SVGICON.sidebar.raisedClarification, "/submitted-forms/list"));
  }

  if (["brigade", "division", "corps", "command"].includes(userRole)) {
    filteredStructure.push(createSidebarItem("All Applications", SVGICON.sidebar.allApplications, "/all-applications"));

    if (userRole !== "brigade") {
      filteredStructure.push(createSidebarItem("Withdraws", SVGICON.sidebar.withdraws, "/withdraw-quests"));
    }

    if (!isMember) {
      filteredStructure.push(
        createSidebarItem("History", SVGICON.sidebar.history, "/history"),
        createSidebarItem("Accepted Application", SVGICON.sidebar.profile, "/application/accepted")
      );
    }
  }

  if (userRole === "headquarter") {
    filteredStructure.push(createSidebarItem("All Applications", SVGICON.sidebar.allApplications, "/all-applications"));
    filteredStructure = filteredStructure.filter(item => item.label !== "Profile Settings");
  }

  if (userRole === "cw2" && ["mo", "ol"].includes(cw2_type)) {
    filteredStructure.push(createSidebarItem("History", SVGICON.sidebar.history, "/history"));
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
            {filteredStructure.map((item) => (
              <NavLink
                to={item.to}
                className="nav-items d-flex align-items-center fw-5 position-relative text-white py-2"
                key={item.to}
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
        <Chatbot />
      </div>
    </aside>
  );
};

const getAlwaysVisible = (userRole: string): string[] => {
  const visible: string[] = [];
  if (!["admin", "cw2", "headquarter"].includes(userRole)) {
    if (userRole !== "command") visible.push("Clarification Received", "Home", "Profile Settings");
    if (userRole !== "unit") visible.push("Clarification Raised");
  }
  return visible;
};

const filterSidebarStructure = (userRole: string, alwaysVisible: string[]) => {
  return sidebarStructure.filter(item => {
    if (item.label === "Dashboard") return false;
    if (alwaysVisible.includes(item.label)) return true;

    if (["command", "cw2"].includes(userRole)) {
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
};

const createSidebarItem = (label: string, icon: any, to: string) => ({
  label,
  icon,
  to,
});

export default SidebarMenu;
