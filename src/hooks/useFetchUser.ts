import { AppDispatch } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from './useApi';
import { useEffect } from 'react';
import { setUser, setUserError, setUserLoading } from '@/store/userSlice';
import { logout } from '@/store/authSlice';
import type { RootState } from '@/store/store';

export const useFetchUser = () => {
    const dispatch = useDispatch<AppDispatch>();
    const api = useApi();
    const accessToken = useSelector((state: RootState) => state.auth.accessToken);
    const user = useSelector((state: RootState) => state.user.data);

    useEffect(() => {
        // нет токена или юзер уже загружен — ничего не делаем
        if (!accessToken || user) return;

        const fetchUser = async () => {
            try {
                dispatch(setUserLoading(true));
                const res = await api.get('/users/me'); // /api/v1/users/me если нужно
                dispatch(setUser(res.data));
                dispatch(setUserError(null));
            } catch (e: any) {
                const status = e?.response?.status;
                if (status === 401 || status === 403) {
                    dispatch(logout());
                    dispatch(setUser(null));
                }
                dispatch(setUserError('User loading failed'));
            } finally {
                dispatch(setUserLoading(false));
            }
        };

        fetchUser();
    }, [api, accessToken, user, dispatch]);
};
