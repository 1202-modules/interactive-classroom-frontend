import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Text } from '@gravity-ui/uikit';
import type { AxiosInstance } from 'axios';

import { getTimerState } from '@/shared/api/timer';
import type { TimerStateResponse } from '@/shared/types/timer';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import { beep } from '@/shared/utils/beep';
import { getSoundEnabled } from '@/shared/utils/soundPreferences';

interface TimerModuleProps {
    api: AxiosInstance;
    passcode: string;
    moduleId: number;
}

const formatDuration = (seconds: number): string => {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const remaining = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

export function TimerModule({ api, passcode, moduleId }: TimerModuleProps) {
    const [state, setState] = useState<TimerStateResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState<number>(Date.now());
    const initialLoadRef = useRef(true);
    const soundPlayedRef = useRef(false);

    useEffect(() => {
        const tick = window.setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(tick);
    }, []);

    useEffect(() => {
        const fetchTimerState = async () => {
            try {
                const timerState = await getTimerState(api, passcode, moduleId);
                setState(timerState);
                setError(null);
            } catch (err: unknown) {
                if (initialLoadRef.current) {
                    const message = parseBackendError(
                        (err as { response?: { data?: unknown } })?.response?.data,
                        'Failed to load timer',
                    );
                    setError(message);
                }
            } finally {
                if (initialLoadRef.current) {
                    initialLoadRef.current = false;
                    setIsLoading(false);
                }
            }
        };

        fetchTimerState();
        const interval = window.setInterval(fetchTimerState, 3000);
        return () => clearInterval(interval);
    }, [api, passcode, moduleId]);

    const remainingSeconds = useMemo(() => {
        if (!state) return null;
        if (state.is_paused) return state.remaining_seconds;
        if (!state.end_at) return null;
        const endMs = new Date(state.end_at).getTime();
        return Math.max(0, Math.floor((endMs - now) / 1000));
    }, [state, now]);

    useEffect(() => {
        if (
            remainingSeconds === 0 &&
            state?.sound_notification_enabled &&
            getSoundEnabled() &&
            !soundPlayedRef.current
        ) {
            beep(0.5, 440);
            soundPlayedRef.current = true;
        }
        if (remainingSeconds !== 0) {
            soundPlayedRef.current = false;
        }
    }, [remainingSeconds, state?.sound_notification_enabled]);

    if (isLoading) {
        return (
            <Card view="outlined" className="participant-page__card participant-page__module-card participant-page__timer-stage">
                <Text variant="header-2">Module: Timer</Text>
                <Text variant="body-1" color="secondary">
                    Loading timer...
                </Text>
            </Card>
        );
    }

    if (error) {
        return (
            <Card view="outlined" className="participant-page__card participant-page__module-card participant-page__timer-stage">
                <Text variant="header-2">Module: Timer</Text>
                <Text variant="body-2" color="danger">
                    {error}
                </Text>
            </Card>
        );
    }

    if (remainingSeconds === null) {
        return (
            <Card view="outlined" className="participant-page__card participant-page__module-card participant-page__timer-stage">
                <Text variant="header-2">Module: Timer</Text>
                <Text variant="body-1" color="secondary">
                    Timer is not started yet.
                </Text>
            </Card>
        );
    }

    return (
        <Card view="outlined" className="participant-page__card participant-page__module-card participant-page__timer-stage">
            <Text className="participant-page__timer-hero">{formatDuration(remainingSeconds)}</Text>
        </Card>
    );
}
