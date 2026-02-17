import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useApi } from './useApi';
import type { RootState } from '@/shared/store/store';
import type { UserPreferences } from '@/shared/types/userPreferences';

const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'light',
    timezone_mode: 'auto',
    timezone: 'UTC',
    sound_enabled: true,
    browser_notifications: true,
    notification_sound: 'default',
};

export function useUserPreferences() {
    const api = useApi();
    const accessToken = useSelector((state: RootState) => state.auth.accessToken);
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPreferences = useCallback(async () => {
        if (!accessToken) {
            setPreferences(DEFAULT_PREFERENCES);
            setLoading(false);
            return;
        }
        setError(null);
        try {
            const res = await api.get<{ preferences?: UserPreferences }>('/users/me', {
                params: { fields: 'id,preferences' },
            });
            const prefs = res.data?.preferences as UserPreferences | undefined;
            if (prefs && typeof prefs === 'object') {
                setPreferences((prev) => ({ ...DEFAULT_PREFERENCES, ...prev, ...prefs }));
            }
        } catch {
            setPreferences(DEFAULT_PREFERENCES);
        } finally {
            setLoading(false);
        }
    }, [api, accessToken]);

    const savePreferences = useCallback(
        async (updates: Partial<UserPreferences>): Promise<boolean> => {
            setError(null);
            try {
                await api.patch('/users/me/preferences', updates);
                setPreferences((prev) => ({ ...prev, ...updates }));
                return true;
            } catch (err: unknown) {
                const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
                setError(msg ?? 'Failed to save preferences');
                return false;
            }
        },
        [api]
    );

    useEffect(() => {
        loadPreferences();
    }, [loadPreferences]);

    return {
        preferences,
        loading,
        error,
        savePreferences,
        refresh: loadPreferences,
    };
}
