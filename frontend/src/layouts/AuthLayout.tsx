import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../reduxToolkit/hooks';
import SidebarMenu from './components/SidebarMenu';
import Header from './components/Header';
import Topbar from './components/Topbar';
import Footer from './components/Footer';
import { useState,useCallback } from 'react';
import { Chatbot } from '../screens/Chatbot/Chatbot';

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

            <div className="d-flex flex-grow-1" style={{ flex: 1, minHeight: 0 }}>
                {/* Sidebar */}
                <div
                    className="sidebar-container"
                    style={{
                        height: "100%",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0, // Prevent shrinking
                        width: isSidebarCollapsed ? "60px" : "300px", // Dynamic width based on collapse state
                        transition: "width 0.3s ease", // Smooth transition for shrinking/expanding
                    }}
                >
                    <SidebarMenu onToggleCollapse={handleToggleCollapse} />
                </div>

                {/* Main content column */}
                <div
                    className="main-content-container"
                    style={{
                        flexGrow: 1, // Allow main content to take remaining space
                        position: "relative",
                        overflowY: "auto",
                        transition: "margin-left 0.3s ease", // Smooth transition for margin adjustment
                    }}
                >
                    {/* Header */}
                    <Header />

                    {/* Page content */}
                    <div
                        className="page-content"
                        style={{
                            flexGrow: 1,
                            paddingLeft: "1rem",
                            paddingTop: "1rem",
                            overflowX: "hidden",
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
            <Chatbot/>
        </div>
    );
};

export default AuthLayout;