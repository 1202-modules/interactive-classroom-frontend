// src/hooks/useApi.ts
import { useAuth } from './useAuth';
import { api } from '../api/api';

export const useApi = () => {
  const { accessToken } = useAuth();

  api.interceptors.request.use((config) => {
    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  return api;
};
