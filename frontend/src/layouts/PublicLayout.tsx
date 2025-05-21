import { Fragment, type ReactNode } from 'react';
// import { useAppSelector } from '../reduxToolkit/hooks';
// import { Navigate } from 'react-router-dom';

const PublicLayout = ({ children }: { children: ReactNode }) => {
    // const token = !!useAppSelector((state) => state.admin).admin?.token;

    // if (token) return <Navigate to="/" />;

    return <Fragment>{children}</Fragment>;
};

export default PublicLayout;
