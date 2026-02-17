// src/hooks/useAuth.ts
import {useSelector} from 'react-redux';
import type {RootState} from '@/shared/store/store';

export const useAuth = () => {
    return useSelector((state: RootState) => state.auth);
};
