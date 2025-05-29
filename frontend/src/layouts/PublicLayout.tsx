import { Fragment, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../reduxToolkit/hooks';

const PublicLayout = ({ children }: { children: ReactNode }) => {
    const token = !!useAppSelector((state) => state.admin).admin?.token;

    if (token) return <Navigate to="/" />;

    return <Fragment>{children}</Fragment>;
};

export default PublicLayout;
