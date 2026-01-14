// src/hooks/useAuthInit.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { setCredentials, logout } from '@/store/authSlice';
import { api } from '@/api/api';

export const useAuthInit = () => {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    const init = async () => {
      if (accessToken) return;

      try {
        const res = await api.post('/auth/refresh'); // cookie уйдёт автоматически
        const { access_token, user_id, email } = res.data as {
          access_token: string;
          token_type: string;
          user_id: number;
          email: string;
        };

        dispatch(
          setCredentials({
            accessToken: access_token,
            userId: user_id,
            email,
          }),
        );
      } catch {
        // refresh не валиден — просто считаем юзера неавторизованным
        dispatch(logout());
      }
    };

    init();
  }, [accessToken, dispatch]);
};
