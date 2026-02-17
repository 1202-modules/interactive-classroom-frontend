import type { AxiosInstance } from 'axios';

import type { TimerStateResponse } from '@/types/timer';

export async function getTimerState(
    apiClient: AxiosInstance,
    passcode: string,
    moduleId: number,
): Promise<TimerStateResponse> {
    // No auth required for timer state
    const res = await apiClient.get<TimerStateResponse>(
        `/sessions/by-passcode/${passcode}/modules/timer/${moduleId}/state`,
    );
    return res.data;
}
