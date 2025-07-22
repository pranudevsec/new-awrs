import { NavLink } from "react-router-dom";
import { sidebarStructure } from "./structure";
import { useEffect, useState } from "react";
import Axios from "../../reduxToolkit/helper/axios";
import { useAppDispatch, useAppSelector } from "../../reduxToolkit/hooks";
import { getClarifications, getSubordinateClarifications } from "../../reduxToolkit/services/clarification/clarificationService";
import { SVGICON } from "../../constants/iconsList";
import { Chatbot } from "../../screens/Chatbot/Chatbot";

const commandExtraLabels = ["Scoreboard", "Winners", "Home", "Profile Settings"];
const headquarterExtraLabels = ["Dashboard", "Home", "Awards", "Scoreboard", "Profile Settings"];
const extraDashboardLabels = ["Brigade Dashboard", "Division Dashboard", "Corps Dashboard", "Command Dashboard"];

type UserType = {
  user_role?: string;
  is_member?: boolean;
  cw2_type?: string;
};

const SidebarMenu = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.admin.profile);
  const user = (profile?.user ?? {}) as UserType;
  const userRole = user.user_role ?? "";
  const isMember = user.is_member ?? false;
  const cw2_type = user.cw2_type?.toLowerCase() ?? "";

  const [sidebarClarificationUnits, setSidebarClarificationUnits] = useState<any[]>([]);

  useEffect(() => {
    if (!userRole) return;
    const fetchUnits = async (url: string) => {
      const res = await Axios.get(url);
      if (res.data && Array.isArray(res.data.data)) {
        setSidebarClarificationUnits(res.data.data);
      }
    };
    if (userRole.trim() === "unit") {
      dispatch(getClarifications({ awardType: "", search: "", page: 1, limit: 1000 }));
      fetchUnits("/api/applications/units?limit=1000");
    } else {
      dispatch(getSubordinateClarifications({ awardType: "", search: "", page: 1, limit: 1000 }));
      fetchUnits("/api/applications/subordinates?limit=1000");
    }
  }, [dispatch, userRole]);

  const unitClarifications = useAppSelector((state) => state.clarification.unitClarifications);
  const totalReceivedClarifications = Array.isArray(unitClarifications)
    ? unitClarifications.filter(app =>
        app?.fds?.parameters?.some((p: any) => p.clarification_id)
      ).length
    : 0;

  const totalRaisedClarifications = Array.isArray(sidebarClarificationUnits)
    ? sidebarClarificationUnits.filter(unit => (unit.clarifications_count ?? 0) > 0).length
    : 0;

  const applicationsToReview = useAppSelector((state) => state.commandPanel.homeCounts?.applicationsToReview ?? 0);

  const alwaysVisible = getAlwaysVisible(userRole);

  // Dashboard items logic
  const dashboardLabelsMap: Record<string, string> = {
    brigade: "Brigade Dashboard",
    division: "Division Dashboard",
    corps: "Corps Dashboard",
    command: "Command Dashboard",
  };
  const dashboardLabel = dashboardLabelsMap[userRole];
  const dashboardItems = dashboardLabel
    ? sidebarStructure.filter(item => item.label === dashboardLabel)
    : [];

  let filteredStructure = filterSidebarStructure(userRole, alwaysVisible)
    .filter(item => !extraDashboardLabels.includes(item.label));

  if (["brigade", "division", "corps", "command"].includes(userRole)) {
    filteredStructure = filteredStructure.filter(item => item.label !== "Home");
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
    const dashboardItem = sidebarStructure.find(item => item.label === "Dashboard");
    if (dashboardItem) {
      filteredStructure = [dashboardItem, ...filteredStructure];
    }
  }

  if (userRole === "unit") {
    filteredStructure.push(createSidebarItem("Submitted Forms", SVGICON.sidebar.raisedClarification, "/submitted-forms/list"));
  }

  if (userRole === "cw2" && ["mo", "ol"].includes(cw2_type)) {
    filteredStructure.push(createSidebarItem("History", SVGICON.sidebar.history, "/history"));
  }

  // Helper to render sidebar item with badge
  const renderSidebarItemWithBadge = (item: any, badgeCount: number) => (
    <div key={item.to} style={{ position: "relative" }}>
      {badgeCount > 0 && (
        <div style={{
          position: "absolute",
          top: -8,
          right: 8,
          minWidth: 22,
          height: 22,
          padding: "0 6px",
          background: "#dc3545",
          color: "#fff",
          borderRadius: "50%",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        }}>
          {badgeCount}
        </div>
      )}
      <NavLink
        to={item.to}
        className="nav-items d-flex align-items-center fw-5 position-relative text-white py-2"
      >
        <div className="d-flex align-items-center text-truncate">
          <span className="nav-icon me-2 d-inline-flex align-items-center justify-content-center">
            {item.icon}
          </span>
          <span className="text-truncate">{item.label}</span>
        </div>
      </NavLink>
    </div>
  );

  return (
    <aside className="sidebar-menu flex-shrink-0 d-xl-block d-none bg-dark text-white p-3 px-0">
      <div className="d-flex flex-column justify-content-between align-items-center">
        <div className="d-flex flex-column justify-content-center align-items-center gap-2 mb-2">
          <h5 className="text-white" >Menu</h5>
          <div className="w-50" style={{ height: "4px", backgroundColor: "#dc3545", borderRadius: "50px" }}></div>
        </div>
        <div className="scroll-style-85">
          <div className="sidebar-wrapper mt-3 pb-3">
            {dashboardItems.map((item) => (
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
            {["brigade", "division", "corps", "command"].includes(userRole) && (
              renderSidebarItemWithBadge(
                {
                  label: "Applications to Review",
                  icon: SVGICON.sidebar.applications,
                  to: "/applications/list"
                },
                applicationsToReview
              )
            )}
            {filteredStructure.map((item) => {
              if (item.label === "Clarification Received") {
                return renderSidebarItemWithBadge(item, totalReceivedClarifications);
              }
              if (item.label === "Clarification Raised") {
                return renderSidebarItemWithBadge(item, totalRaisedClarifications);
              }
              return (
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
              );
            })}
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
    if (["brigade", "division", "corps"].includes(userRole)) {
      if (extraDashboardLabels.includes(item.label)) return true;
    }
    
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
