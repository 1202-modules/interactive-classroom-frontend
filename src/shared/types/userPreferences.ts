export type ThemePreference = 'light' | 'dark' | 'auto';
export type TimezoneMode = 'auto' | 'manual';

export type UserPreferences = {
    timezone?: string;
    timezone_mode?: TimezoneMode;
    theme?: ThemePreference;
    sound_enabled?: boolean;
    browser_notifications?: boolean;
    notification_sound?: string;
};
