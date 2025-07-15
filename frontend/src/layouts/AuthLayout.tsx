import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../reduxToolkit/hooks';
import SidebarMenu from './components/SidebarMenu';
import Header from './components/Header';
import Topbar from './components/Topbar';
import Footer from './components/Footer';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    const token = !!useAppSelector((state) => state.admin).admin?.token;

    if (!token) return <Navigate to="/authentication/sign-in" />;

    return (
        <>
            <Topbar />
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
            <Footer/>
        </>
    );
}



// const AuthLayout = ({ children }: { children: React.ReactNode }) => {
//     const token = !!useAppSelector((state) => state.admin).admin?.token;

//     if (!token) return <Navigate to="/authentication/sign-in" />;

//     return (
//         <div className="d-flex flex-column vh-100">
//             {/* Topbar */}
//             <Topbar />

//             <div className="d-flex flex-grow-1 overflow-hidden">
//                 {/* Sidebar */}
//                 <SidebarMenu />

//                 {/* Main content column */}
//                 <div className="d-flex flex-column flex-grow-1 position-relative overflow-hidden">
//                     {/* Header */}
//                     <Header />

//                     {/* Page content */}
//                     <div className="flex-grow-1 overflow-auto scroll-style-110">
//                         {children}
//                     </div>

//                     {/* Footer */}
//                     <Footer />
//                 </div>
//             </div>
//         </div>
//     );
// };

export default AuthLayout;