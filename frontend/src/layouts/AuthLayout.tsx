import { useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../reduxToolkit/hooks';
import { Chatbot } from '../screens/Chatbot/Chatbot';
import SidebarMenu from './components/SidebarMenu';
import Header from './components/Header';
import Topbar from './components/Topbar';
import Footer from './components/Footer';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    const token = !!useAppSelector((state) => state.admin).admin?.token;
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const handleToggleCollapse = useCallback((isCollapsed: boolean) => {
        setIsSidebarCollapsed(isCollapsed);
    }, []);

    if (!token) return <Navigate to="/authentication/sign-in" />;

    return (
        <div className="d-flex flex-column vh-100">
            {/* Topbar */}
            <Topbar />
            <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
                {/* Sidebar */}
                <div className="sidebar-container h-100 flex-column flex-shrink-0 d-xl-flex d-none" style={{
                    width: isSidebarCollapsed ? "60px" : "300px",
                    transition: "width 0.3s ease",
                }}>
                    <SidebarMenu onToggleCollapse={handleToggleCollapse} />
                </div>
                <div className="main-content-container position-relative flex-grow-1 overflow-y-auto overflow-x-hidden">
                    {/* Header */}
                    <Header />

                    {/* Page content */}
                    <div className="page-content flex-grow-1 overflow-x-hidden"
                        style={{
                            paddingLeft: "1rem",
                            paddingTop: "1rem",
                            paddingRight: "1rem",
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
            {/* Footer */}
            <Footer />
            {/* Chatbot */}
            <Chatbot />
        </div>
    );
};

export default AuthLayout;