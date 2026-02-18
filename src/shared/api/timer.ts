import type { AxiosInstance } from 'axios';

import type { TimerStateResponse } from '@/shared/types/timer';

export async function getTimerState(
    apiClient: AxiosInstance,
    passcode: string,
    moduleId: number,
): Promise<TimerStateResponse> {
    const res = await apiClient.get<TimerStateResponse>(
        `/sessions/by-passcode/${passcode}/modules/timer/${moduleId}/state`,
    );
    return res.data;
}

/** Lecturer: start / pause / resume / reset / set timer (session id + auth). */
export async function timerStart(
    apiClient: AxiosInstance,
    sessionId: number,
    moduleId: number,
): Promise<TimerStateResponse> {
    const res = await apiClient.post<TimerStateResponse>(
        `/sessions/${sessionId}/modules/${moduleId}/timer/start`,
    );
    return res.data;
}

export async function timerPause(
    apiClient: AxiosInstance,
    sessionId: number,
    moduleId: number,
    remainingSeconds: number,
): Promise<TimerStateResponse> {
    const res = await apiClient.post<TimerStateResponse>(
        `/sessions/${sessionId}/modules/${moduleId}/timer/pause`,
        { remaining_seconds: remainingSeconds },
    );
    return res.data;
}

export async function timerResume(
    apiClient: AxiosInstance,
    sessionId: number,
    moduleId: number,
): Promise<TimerStateResponse> {
    const res = await apiClient.post<TimerStateResponse>(
        `/sessions/${sessionId}/modules/${moduleId}/timer/resume`,
    );
    return res.data;
}

export async function timerReset(
    apiClient: AxiosInstance,
    sessionId: number,
    moduleId: number,
): Promise<TimerStateResponse> {
    const res = await apiClient.post<TimerStateResponse>(
        `/sessions/${sessionId}/modules/${moduleId}/timer/reset`,
    );
    return res.data;
}

export async function timerSet(
    apiClient: AxiosInstance,
    sessionId: number,
    moduleId: number,
    remainingSeconds: number,
): Promise<TimerStateResponse> {
    const res = await apiClient.post<TimerStateResponse>(
        `/sessions/${sessionId}/modules/${moduleId}/timer/set`,
        { remaining_seconds: remainingSeconds },
    );
    return res.data;
}
