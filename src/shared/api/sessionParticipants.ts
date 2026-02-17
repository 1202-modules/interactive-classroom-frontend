import type {AxiosInstance} from 'axios';

import type {SessionParticipantsResponse} from '@/shared/types/sessionParticipants';

export async function getParticipantsByPasscode(
    apiClient: AxiosInstance,
    passcode: string,
    authToken: string,
): Promise<SessionParticipantsResponse> {
    const res = await apiClient.get<SessionParticipantsResponse>(
        `/sessions/by-passcode/${passcode}/participants`,
        {
            headers: {Authorization: `Bearer ${authToken}`},
        },
    );
    return res.data;
}

export async function getParticipantsBySessionId(
    apiClient: AxiosInstance,
    sessionId: number,
): Promise<SessionParticipantsResponse> {
    const res = await apiClient.get<SessionParticipantsResponse>(
        `/sessions/${sessionId}/participants`,
    );
    return res.data;
}
