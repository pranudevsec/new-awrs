import { Navigate } from "react-router-dom";
import { useAppSelector } from "../reduxToolkit/hooks";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const token = !!useAppSelector((state) => state.admin).admin?.token;
    const { profile } = useAppSelector((state) => state.admin);
    const userRole = profile?.user?.user_role;

    if (!token) {
        return <Navigate to="/authentication/sign-in" />;
    }

    if (!userRole || !allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
