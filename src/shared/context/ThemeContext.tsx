import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useUserPreferences } from '@/shared/hooks/useUserPreferences';
import type { RootState } from '@/shared/store/store';
import type { ThemePreference } from '@/shared/types/userPreferences';

type ResolvedTheme = 'light' | 'dark';

function resolveTheme(pref: ThemePreference): ResolvedTheme {
    if (pref === 'auto') {
        return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }
    return pref === 'dark' ? 'dark' : 'light';
}

function syncRootTheme(theme: ResolvedTheme) {
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove('g-root_theme_light', 'g-root_theme_dark');
    root.classList.add(`g-root_theme_${theme}`);
    body.classList.remove('g-root_theme_light', 'g-root_theme_dark');
    body.classList.add(`g-root_theme_${theme}`);
}

type ThemeContextValue = {
    theme: ResolvedTheme;
    themePreference: ThemePreference;
    setThemePreference: (p: ThemePreference) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
    const accessToken = useSelector((state: RootState) => state.auth.accessToken);
    const { preferences, savePreferences } = useUserPreferences();
    const themePref = (preferences?.theme as ThemePreference) ?? 'light';
    const [theme, setThemeState] = useState<ResolvedTheme>(() => resolveTheme(themePref));

    useEffect(() => {
        const resolved = resolveTheme(themePref);
        setThemeState(resolved);
        syncRootTheme(resolved);
    }, [themePref]);

    useEffect(() => {
        if (themePref !== 'auto') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const r = resolveTheme('auto');
            setThemeState(r);
            syncRootTheme(r);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [themePref]);

    const toggleTheme = useCallback(() => {
        const next = theme === 'light' ? 'dark' : 'light';
        setThemeState(next);
        syncRootTheme(next);
        if (accessToken) savePreferences({ theme: next });
    }, [theme, accessToken, savePreferences]);

    const setThemePreference = useCallback(
        (pref: ThemePreference) => {
            const resolved = resolveTheme(pref);
            setThemeState(resolved);
            syncRootTheme(resolved);
            if (accessToken) savePreferences({ theme: pref });
        },
        [accessToken, savePreferences]
    );

    const value = useMemo<ThemeContextValue>(
        () => ({ theme, themePreference: themePref, setThemePreference, toggleTheme }),
        [theme, themePref, setThemePreference, toggleTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
    const ctx = useContext(ThemeContext);
    return ctx;
}
