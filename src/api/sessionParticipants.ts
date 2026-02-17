import type {AxiosInstance} from 'axios';

import type {SessionParticipantsResponse} from '@/types/sessionParticipants';

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

