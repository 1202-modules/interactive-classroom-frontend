import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Label, Text } from '@gravity-ui/uikit';
import { getTimerState } from '@/shared/api/timer';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import type { AxiosInstance } from 'axios';
import type { TimerStateResponse } from '@/shared/types/timer';
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
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const soundPlayedRef = useRef(false);
    const intervalRef = useRef<number | null>(null);

    const fetchTimerState = async () => {
        try {
            const timerState = await getTimerState(api, passcode, moduleId);
            setState(timerState);
            setError(null);

            // Calculate remaining seconds
            if (!timerState.is_paused && timerState.end_at) {
                const endTime = new Date(timerState.end_at).getTime();
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
                setRemainingSeconds(remaining);

                // Play sound when timer reaches 0 (only if module + user sound enabled)
                if (
                    remaining === 0 &&
                    timerState.sound_notification_enabled &&
                    getSoundEnabled() &&
                    !soundPlayedRef.current
                ) {
                    beep(0.5, 440);
                    soundPlayedRef.current = true;
                } else if (remaining > 0) {
                    soundPlayedRef.current = false;
                }
            } else if (timerState.is_paused && timerState.remaining_seconds !== null) {
                setRemainingSeconds(timerState.remaining_seconds);
            } else {
                setRemainingSeconds(null);
            }
        } catch (err: unknown) {
            const message = parseBackendError(
                (err as { response?: { data?: unknown } })?.response?.data,
                'Failed to load timer'
            );
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTimerState();
        // Poll every second for accurate countdown
        intervalRef.current = window.setInterval(fetchTimerState, 1000);

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [api, passcode, moduleId]);

    const displayTime = useMemo(() => {
        if (remainingSeconds === null) return '00:00';
        return formatDuration(remainingSeconds);
    }, [remainingSeconds]);

    const statusLabel = useMemo(() => {
        if (!state) return 'stopped';
        if (state.is_paused) return 'paused';
        if (remainingSeconds === 0) return 'finished';
        return 'running';
    }, [state, remainingSeconds]);

    if (isLoading) {
        return (
            <Card view="outlined" className="participant-page__card">
                <Text variant="header-2">Timer</Text>
                <Text variant="body-1" color="secondary">Loading timer...</Text>
            </Card>
        );
    }

    if (error) {
        return (
            <Card view="outlined" className="participant-page__card">
                <Text variant="header-2">Timer</Text>
                <Text variant="body-2" color="danger">{error}</Text>
            </Card>
        );
    }

    if (!state || remainingSeconds === null) {
        return (
            <Card view="outlined" className="participant-page__card">
                <div className="participant-page__card-head">
                    <Text variant="header-2">Timer</Text>
                    <Label theme="normal" size="m">
                        stopped
                    </Label>
                </div>
                <Text variant="body-1" color="secondary">Timer not started</Text>
            </Card>
        );
    }

    return (
        <Card view="outlined" className="participant-page__card">
            <div className="participant-page__card-head">
                <Text variant="header-2">Timer</Text>
                <Label
                    theme={statusLabel === 'finished' ? 'warning' : statusLabel === 'running' ? 'success' : 'normal'}
                    size="m"
                >
                    {statusLabel}
                </Label>
            </div>
            <Text variant="display-3" className="participant-page__timer">
                {displayTime}
            </Text>
            <Text variant="body-2" color="secondary">
                {statusLabel === 'finished'
                    ? 'Timer has finished'
                    : statusLabel === 'paused'
                      ? 'Timer is paused'
                      : 'Countdown to the end of the timer'}
            </Text>
        </Card>
    );
}
