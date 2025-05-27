import { lazy, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import Login from "../screens/auth/Login";
import SignUp from "../screens/auth/SignUp";

import ApplicationsList from "../screens/applications/modules/ApplicationsList";
import ApplicationDetails from "../screens/applications/modules/ApplicationDetails";
import ClarificationList from "../screens/applications/modules/ClarificationList";
import ClarificationDetails from "../screens/applications/modules/ClarificationDetails";
import AdminSettings from "../screens/admin-settings/AdminSettings";
import ParametersList from "../screens/parameters/ParametersList";

const Applications = lazy(() => import("../screens/applications/Applications"));
const ApplyCitation = lazy(
  () => import("../screens/applications/modules/ApplyCitation")
);
const ApplyAppreciation = lazy(
  () => import("../screens/applications/modules/ApplyAppreciation")
);
const Thanks = lazy(() => import("../screens/applications/modules/Thanks"));
const ProfileSettings = lazy(
  () => import("../screens/profile-settings/ProfileSettings")
);
const Clarification = lazy(
  () => import("../screens/clarification/Clarification")
);
const UnitClarificationDetail = lazy(
  () => import("../screens/clarification/UnitClarificationDetail")
);
const ClarificationDetail = lazy(
  () => import("../screens/clarification/ClarificationDetail")
);
const CommandPanel = lazy(
  () => import("../screens/command-panel/CommandPanel")
);
const CommandPanelDetail = lazy(
  () => import("../screens/command-panel/CommandPanelDetail")
);
const Winners = lazy(() => import("../screens/winners/Winners"));

interface RouteConfig {
  path: string;
  element: ReactElement;
}

export const publicRoutes: RouteConfig[] = [
  { path: "/authentication/sign-in", element: <Login /> },
  { path: "/authentication/sign-up", element: <SignUp /> },
];

export const authProtectedRoutes: RouteConfig[] = [
  // Applications
  { path: "/", element: <Navigate to="/applications" replace /> },
  { path: "/applications", element: <Applications /> },
  { path: "/applications/citation", element: <ApplyCitation /> },
  { path: "/applications/appreciation", element: <ApplyAppreciation /> },
  { path: "/applications/list", element: <ApplicationsList /> },
  { path: "/applications/list/:id", element: <ApplicationDetails /> },
  { path: "/applications/clarification/list", element: <ClarificationList /> },
  { path: "/applications/clarification/list/:id", element: <ClarificationDetails /> },

  { path: "/applications/thanks", element: <Thanks /> },

  // Profile
  { path: "/profile-settings", element: <ProfileSettings /> },

  // Clarification
  { path: "/clarification", element: <Clarification /> },
  { path: "/clarification/unit/:id", element: <UnitClarificationDetail /> },
  { path: "/clarification/:id", element: <ClarificationDetail /> },

  // Command Panel
  { path: "/command-panel", element: <CommandPanel /> },
  { path: "/command-panel/:id", element: <CommandPanelDetail /> },
  { path: "/winners", element: <Winners /> },

  // Admin setting
  { path: "/admin-settings", element: <AdminSettings /> },

  // Admin setting
  { path: "/parameters", element: <ParametersList /> },
];
