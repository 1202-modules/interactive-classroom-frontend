// src/hooks/useApi.ts
import {useEffect} from 'react';
import {useAuth} from './useAuth';
import {api} from '../api/api';

// Returns a shared axios instance with an Authorization header wired to the current token.
export const useApi = () => {
    const {accessToken} = useAuth();

    useEffect(() => {
        if (accessToken) {
            api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        } else {
            delete api.defaults.headers.common.Authorization;
        }
    }, [accessToken]);

    return api;
};
