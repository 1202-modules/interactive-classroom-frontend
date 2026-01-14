import {useAuth} from '@/hooks/useAuth';
import React from 'react';
import {Navigate, useLocation} from 'react-router-dom';

type ProtectedRouteProps = {
    children: React.ReactElement;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({children}) => {
    const {accessToken} = useAuth();
    const location = useLocation();

    if (!accessToken) {
        return <Navigate to="/auth/login" replace state={{from: location.pathname}} />;
    }

    return children;
};
