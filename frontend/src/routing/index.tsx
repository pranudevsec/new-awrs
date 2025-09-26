import { lazy, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../reduxToolkit/hooks";

import Login from "../screens/auth/Login";
import SignUp from "../screens/auth/SignUp";
import FinalizedApprovedApplicationsList from "../screens/applications/modules/FinalizedApprovedApplicationsList";

const Applications = lazy(() => import("../screens/applications/Applications"));
const AcceptedApplicationsList = lazy(() => import("../screens/applications/modules/AcceptedApplicationsList"));
const ApplyCitation = lazy(() => import("../screens/applications/modules/ApplyCitation"));
const SubmittedFormDetail = lazy(() => import("../screens/applications/modules/SubmittedFormDetail"));
const CitationReviewPage = lazy(() => import("../screens/applications/modules/CitationReviewPage"));
const ApplyAppreciation = lazy(() => import("../screens/applications/modules/ApplyAppreciation"));
const AppreciationReviewPage = lazy(() => import("../screens/applications/modules/AppreciationReviewPage"));
const ApplicationsList = lazy(() => import("../screens/applications/modules/ApplicationsList"));
const ClarificationRaisedList = lazy(() => import("../screens/applications/modules/ClarificationRaisedList"));
const ApplicationDetails = lazy(() => import("../screens/applications/modules/ApplicationDetails"));
const ClarificationList = lazy(() => import("../screens/applications/modules/ClarificationList"));
const ClarificationDetails = lazy(() => import("../screens/applications/modules/ClarificationDetails"));
const Thanks = lazy(() => import("../screens/applications/modules/Thanks"));
// New application list components
const PendingApplicationsList = lazy(() => import("../screens/applications/modules/PendingApplicationsList"));
const RejectedApplicationsList = lazy(() => import("../screens/applications/modules/RejectedApplicationsList"));
const ApprovedApplicationsList = lazy(() => import("../screens/applications/modules/ApprovedApplicationsList"));
const AllApplicationsList = lazy(() => import("../screens/applications/modules/AllApplicationsList"));
const FinalizedApplicationsList = lazy(() => import("../screens/applications/modules/FinalizedApplicationsList"));
const ProfileSettings = lazy(() => import("../screens/profile-settings/ProfileSettings"));

const Clarification = lazy(() => import("../screens/clarification/Clarification"));
const UnitClarificationDetail = lazy(() => import("../screens/clarification/UnitClarificationDetail"));
const ClarificationDetail = lazy(() => import("../screens/clarification/ClarificationDetail"));

const CommandPanel = lazy(() => import("../screens/command-panel/CommandPanel"));
const CommandPanelDetail = lazy(() => import("../screens/command-panel/CommandPanelDetail"));

const Winners = lazy(() => import("../screens/winners/Winners"));

const AdminSettings = lazy(() => import("../screens/admin-settings/AdminSettings"));

const ParametersList = lazy(() => import("../screens/parameters/ParametersList"));
const AddParameters = lazy(() => import("../screens/parameters/AddParameters"));
const EditParameters = lazy(() => import("../screens/parameters/EditParameters"));

const Dashboard = lazy(() => import("../screens/dashboard/Dashboard"));
const BrigadeDashboard = lazy(() => import("../screens/dashboard/BrigadeDashboard"));
const DivisionDashboard = lazy(() => import("../screens/dashboard/DivisionDashboard"));
const CorpsDashboard = lazy(() => import("../screens/dashboard/CorpsDashboard"));
const CommandDashboard = lazy(() => import("../screens/dashboard/CommandDashboard"));

const History = lazy(() => import("../screens/history/History"));
const AllApplications = lazy(() => import("../screens/all-applications/AllApplications"));
const TrackApplications = lazy(() => import("../screens/tracking-applications/TrackApplications"));
const AllApplicationDetails = lazy(() => import("../screens/all-applications/AllApplicationDetails"));
const TrackApplicationDetails = lazy(() => import("../screens/tracking-applications/TrackApplicationDetails"));

const Withdraw = lazy(() => import("../screens/withdraw/Withdraw"));

interface RouteConfig {
  path: string;
  element: ReactElement;
}

export const publicRoutes: RouteConfig[] = [
  { path: "/authentication/sign-in", element: <Login /> },
  { path: "/authentication/sign-up", element: <SignUp /> },
];

// Custom default route element for role-based redirect
function RoleBasedDefaultRedirect() {
  const profile = useAppSelector((state) => state.admin.profile);
  const userRole = profile?.user?.user_role;
  if (userRole === "brigade") return <Navigate to="/brigade-dashboard" replace />;
  if (userRole === "division") return <Navigate to="/division-dashboard" replace />;
  if (userRole === "corps") return <Navigate to="/corps-dashboard" replace />;
  if (userRole === "command") return <Navigate to="/command-dashboard" replace />;
  return <Navigate to="/applications" replace />;
}

export const authProtectedRoutes: RouteConfig[] = [
  // Applications
  { path: "/", element: <RoleBasedDefaultRedirect /> },
  { path: "/applications", element: <Applications /> },
  { path: "/applications/citation", element: <ApplyCitation /> },
  { path: "/applications/citation-review", element: <CitationReviewPage /> },

  { path: "/applications/appreciation", element: <ApplyAppreciation /> },
  { path: "/applications/appreciation-review", element: <AppreciationReviewPage /> },

  { path: "/applications/list", element: <ApplicationsList /> },
  { path: "/application/accepted", element: <AcceptedApplicationsList /> },
  { path: "/submitted-forms/list", element: <ApplicationsList /> },
  { path: "/submitted-forms/list/:application_id", element: <SubmittedFormDetail /> },
  { path: "/applications/pending", element: <PendingApplicationsList /> },
  { path: "/applications/rejected", element: <RejectedApplicationsList /> },
  { path: "/applications/approved", element: <ApprovedApplicationsList /> },
  { path: "/applications/finalized", element: <FinalizedApplicationsList /> },
  { path: "/applications/finalized-approved", element: <FinalizedApprovedApplicationsList /> },
  { path: "/applications/all-applications", element: <AllApplicationsList /> },
  { path: "/applications/list/:application_id", element: <ApplicationDetails /> },
  { path: "/applications/clarification/list", element: <ClarificationList /> },
  { path: "/applications/clarification/list/:id", element: <ClarificationDetails /> },
  { path: "/applications/thanks", element: <Thanks /> },

  // Profile
  { path: "/profile-settings", element: <ProfileSettings /> },

  // Clarification
  { path: "/clarification", element: <Clarification /> },
  { path: "/clarification/unit/:application_id", element: <UnitClarificationDetail /> },
  { path: "/clarification/:id", element: <ClarificationDetail /> },
  { path: "/clarifications/raised-list", element: <ClarificationRaisedList /> },

  // Command Panel
  { path: "/command-panel", element: <CommandPanel /> },
  { path: "/command-panel/:application_id", element: <CommandPanelDetail /> },
  { path: "/winners", element: <Winners /> },

  // Admin setting
  { path: "/admin-settings", element: <AdminSettings /> },

  // Parameters
  { path: "/parameters", element: <ParametersList /> },
  { path: "/parameters/add", element: <AddParameters /> },
  { path: "/parameters/:id", element: <EditParameters /> },

  // Dashboard
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/brigade-dashboard", element: <BrigadeDashboard /> },
  { path: "/division-dashboard", element: <DivisionDashboard /> },
  { path: "/corps-dashboard", element: <CorpsDashboard /> },
  { path: "/command-dashboard", element: <CommandDashboard /> },

  // History
  { path: "/history", element: <History /> },

  // All Applications
  { path: "/all-applications", element: <AllApplications /> },
  { path: "/all-applications/:application_id", element: <AllApplicationDetails /> },

  // Tracking Applications
  { path: "/track-applications", element: <TrackApplications /> },
  { path: "/track-applications/:application_id", element: <TrackApplicationDetails /> },

  // Withdraw Requests Applications
  { path: "/withdraw-quests", element: <Withdraw /> },
];