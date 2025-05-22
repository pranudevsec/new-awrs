import { lazy, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import Login from "../screens/login/Login";

const Applications = lazy(() => import('../screens/applications/Applications'))
const ApplyCitation = lazy(() => import('../screens/applications/modules/ApplyCitation'))
const ApplyAppreciation = lazy(() => import('../screens/applications/modules/ApplyAppreciation'))
const Thanks = lazy(() => import('../screens/applications/modules/Thanks'))
const ProfileSettings = lazy(() => import('../screens/profile-settings/ProfileSettings'))
const Clarification = lazy(() => import('../screens/clarification/Clarification'))

interface RouteConfig {
    path: string;
    element: ReactElement;
}

export const publicRoutes: RouteConfig[] = [
    { path: '/authentication/sign-in', element: <Login /> },
];

export const authProtectedRoutes: RouteConfig[] = [
    // Applications
    { path: '/', element: <Navigate to="/applications" replace /> },
    { path: '/applications', element: <Applications /> },
    { path: '/applications/citation', element: <ApplyCitation /> },
    { path: '/applications/appreciation', element: <ApplyAppreciation /> },
    { path: '/applications/thanks', element: <Thanks /> },

    // Profile
    { path: '/profile-settings', element: <ProfileSettings /> },

    // Clarification
    { path: '/clarification', element: <Clarification /> },
];
