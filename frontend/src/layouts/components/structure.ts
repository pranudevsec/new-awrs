import { SVGICON } from "../../constants/iconsList";

export const sidebarStructure = [
  {
    label: "Home",
    icon: SVGICON.sidebar.applications,
    to: "/applications",
  },
  {
    label: "Dashboard",
    icon: SVGICON.sidebar.dashboard,
    to: "/dashboard",
  },
  {
    label: "Profile Settings",
    icon: SVGICON.sidebar.profile,
    to: "/profile-settings",
  },
  {
    label: "Clarification Received",
    icon: SVGICON.sidebar.clarification,
    to: "/clarification",
  },
  {
    label: "Clarification Raised",
    icon: SVGICON.sidebar.clarification,
    to: "/clarifications/raised-list",
  },
  {
    label: "Admin Settings",
    icon: SVGICON.sidebar.adminSettings,
    to: "/admin-settings",
  },
  {
    label: "Parameters",
    icon: SVGICON.sidebar.profile,
    to: "/parameters",
  },
  {
    label: "Accepted Application",
    icon: SVGICON.sidebar.profile,
    to: "/application/accepted",
  },
  {
    label: "Brigade Dashboard",
    icon: SVGICON.sidebar.dashboard,
    to: "/brigade-dashboard",
  },
  {
    label: "Division Dashboard",
    icon: SVGICON.sidebar.dashboard,
    to: "/division-dashboard",
  },
  {
    label: "Corps Dashboard",
    icon: SVGICON.sidebar.dashboard,
    to: "/corps-dashboard",
  },
  {
    label: "Command Dashboard",
    icon: SVGICON.sidebar.dashboard,
    to: "/command-dashboard",
  },
];
