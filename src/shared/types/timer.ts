export interface TimerStateResponse {
    is_paused: boolean;
    end_at: string | null;
    remaining_seconds: number | null;
    sound_notification_enabled: boolean;
}

