import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../reduxToolkit/hooks';
import SidebarMenu from './components/SidebarMenu';
import Header from './components/Header';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    const token = !!useAppSelector((state) => state.admin).admin?.token;

    if (!token) return <Navigate to="/authentication/sign-in" />;

    // const token = localStorage.getItem("token");

    // if (!token) return <Navigate to="/authentication/sign-in" />;

    return (
        <main className='d-flex vh-100'>
            {/* Sidebar menu */}
            <SidebarMenu />
            {/* Sidebar menu */}
            <div className='main-layout d-flex flex-column position-relative overflow-hidden'>
                {/* Header */}
                <Header />
                {/* /Header */}
                <div className="scroll-style-110 overflow-auto">
                    {children}
                </div>
            </div>
        </main>
    )
}

export default AuthLayout