import { lazy, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import Login from "../screens/login/Login";
import ApplyCitation from "../screens/applications/modules/ApplyCitation";
import ApplyAppreciation from "../screens/applications/modules/ApplyAppreciation";

const Applications = lazy(() => import('../screens/applications/Applications'))

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

    { path: '/profile-settings', element: <Applications /> },
    { path: '/clarification', element: <Applications /> },
];
