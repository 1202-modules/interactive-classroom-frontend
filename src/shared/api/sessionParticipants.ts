import type {AxiosInstance} from 'axios';

import type {
    SessionParticipantItem,
    SessionParticipantsResponse,
    SessionParticipantSelfPatchRequest,
} from '@/shared/types/sessionParticipants';

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

export async function patchParticipant(
    apiClient: AxiosInstance,
    sessionId: number,
    participantId: number,
    body: { is_banned?: boolean },
): Promise<void> {
    await apiClient.patch(
        `/sessions/${sessionId}/participants/${participantId}`,
        body,
    );
}

export async function kickParticipant(
    apiClient: AxiosInstance,
    sessionId: number,
    participantId: number,
): Promise<void> {
    await apiClient.delete(`/sessions/${sessionId}/participants/${participantId}`);
}

export async function patchOwnParticipantByPasscode(
    apiClient: AxiosInstance,
    passcode: string,
    authToken: string,
    body: SessionParticipantSelfPatchRequest,
): Promise<SessionParticipantItem> {
    const res = await apiClient.patch<SessionParticipantItem>(
        `/sessions/by-passcode/${passcode}/participants/me`,
        body,
        {
            headers: { Authorization: `Bearer ${authToken}` },
        },
    );
    return res.data;
}
