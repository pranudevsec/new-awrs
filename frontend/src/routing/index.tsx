// import { lazy, type ReactElement } from "react";
// import Login from "../screens/login/Login";
// import { Navigate } from "react-router-dom";

// const Applications = lazy(() => import('../screens/applications/Applications'))

// interface RouteConfig {
//     path: string;
//     element: ReactElement;
// }

// export const publicRoutes: RouteConfig[] = [
//     { path: '/authentication/sign-in', element: <Login /> },
// ];

// export const authProtectedRoutes: RouteConfig[] = [
//     // Dashboard
//     { path: '/', element: <Applications /> },
//     { path: '/applications', element: <Navigate to="/" replace /> },
//     { path: '/profile-settings', element: <Applications /> },
//     { path: '/clarification', element: <Applications /> },
// ];

import { lazy, type ReactElement } from "react";
import Login from "../screens/login/Login";
import { Navigate } from "react-router-dom";

const Applications = lazy(() => import('../screens/applications/Applications'))

interface RouteConfig {
    path: string;
    element: ReactElement;
}

export const publicRoutes: RouteConfig[] = [
    { path: '/', element: <Login /> },
];

export const authProtectedRoutes: RouteConfig[] = [
    // Dashboard
    { path: '/applications', element: <Applications /> },
    { path: '/applications', element: <Navigate to="/" replace /> },
    { path: '/profile-settings', element: <Applications /> },
    { path: '/clarification', element: <Applications /> },
];
