import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../reduxToolkit/hooks';
import SidebarMenu from './components/SidebarMenu';
import Header from './components/Header';
import Topbar from './components/Topbar';
import Footer from './components/Footer';
import { Chatbot } from '../screens/Chatbot/Chatbot';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    const token = !!useAppSelector((state) => state.admin).admin?.token;

    if (!token) return <Navigate to="/authentication/sign-in" />;
    return (
        <div className="d-flex flex-column vh-100">
            {/* Topbar */}
            <Topbar />

            <div className="d-flex flex-grow-1" style={{ flex: 1, minHeight: 0 }}>
                {/* Sidebar */}
                <div style={{
                    width: 300,
                    minWidth: 300,
                    height: "100%",
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <SidebarMenu />
                </div>

                {/* Main content column */}
                <div className="d-flex flex-column flex-grow-1" style={{ position: "relative", overflow: "hidden" }}>
                    {/* Header */}
                    <Header />

                    {/* Page content */}
                    <div className="flex-grow-1 " style={{ paddingLeft: "1rem", paddingTop: "1rem",overflowX: "hidden",paddingRight: "1rem"}}>
                        {children}
                    </div>
                </div>
            </div>
            {/* Footer */}
            <Footer />

            {/* Chatbot floating window */}
            <Chatbot />
        </div>
    );
};

export default AuthLayout;