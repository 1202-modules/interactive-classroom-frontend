const STORAGE_KEY = 'app_sound_enabled';

export function getSoundEnabled(): boolean {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === null) return true;
        return v === 'true';
    } catch {
        return true;
    }
}

export function setSoundEnabled(enabled: boolean): void {
    try {
        localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
        // ignore
    }
}
