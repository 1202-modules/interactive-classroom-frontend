/**
 * API functions for session join and guest authentication.
 *
 * Note: these endpoints live under /api/v1 (axios baseURL already includes it).
 */
import type {AxiosInstance} from 'axios';

import type {
    AnonymousJoinRequest,
    AnonymousJoinResponse,
    EmailCodeRequestRequest,
    EmailCodeRequestResponse,
    EmailCodeVerifyRequest,
    EmailCodeVerifyResponse,
    GuestJoinRequest,
    GuestJoinResponse,
    RegisteredJoinResponse,
    SessionByPasscodeResponse,
    ParticipantEntryMode,
} from '@/shared/types/sessionJoin';
import {getGuestToken, getParticipantToken} from '@/shared/utils/tokenStorage';

export async function getSessionByPasscode(
    apiClient: AxiosInstance,
    passcode: string,
): Promise<SessionByPasscodeResponse> {
    const guestToken = getGuestToken();
    const participantToken = getParticipantToken();
    const baseRes = await apiClient.get<SessionByPasscodeResponse>(
        `/sessions/by-passcode/${passcode}`,
    );
    const base = baseRes.data;
    const mode = base.participant_entry_mode;

    let authToken: string | null = null;
    if (mode === 'anonymous') {
        authToken = participantToken || null;
    } else if (mode === 'email_code') {
        authToken = guestToken || null;
    }

    if (!authToken) {
        return base;
    }

    try {
        const authRes = await apiClient.get<SessionByPasscodeResponse>(
            `/sessions/by-passcode/${passcode}`,
            { headers: { Authorization: `Bearer ${authToken}` } },
        );
        return authRes.data;
    } catch {
        return base;
    }
}

export async function joinAnonymous(
    apiClient: AxiosInstance,
    passcode: string,
    data?: AnonymousJoinRequest,
): Promise<AnonymousJoinResponse> {
    const res = await apiClient.post<AnonymousJoinResponse>(
        `/sessions/by-passcode/${passcode}/join/anonymous`,
        data || {},
    );
    return res.data;
}

export async function joinRegistered(
    apiClient: AxiosInstance,
    passcode: string,
): Promise<RegisteredJoinResponse> {
    // Uses Authorization header from axios defaults (user token)
    const res = await apiClient.post<RegisteredJoinResponse>(
        `/sessions/by-passcode/${passcode}/join/registered`,
    );
    return res.data;
}

export async function joinGuest(
    apiClient: AxiosInstance,
    passcode: string,
    data: GuestJoinRequest,
): Promise<GuestJoinResponse> {
    const guestToken = getGuestToken();
    if (!guestToken) throw new Error('Guest token is required');

    const res = await apiClient.post<GuestJoinResponse>(
        `/sessions/by-passcode/${passcode}/join/guest`,
        data,
        {
            headers: {Authorization: `Bearer ${guestToken}`},
        },
    );
    return res.data;
}

export async function requestEmailCode(
    apiClient: AxiosInstance,
    passcode: string,
    data: EmailCodeRequestRequest,
): Promise<EmailCodeRequestResponse> {
    const res = await apiClient.post<EmailCodeRequestResponse>(
        `/sessions/by-passcode/${passcode}/email-code/request`,
        data,
    );
    return res.data;
}

export async function verifyEmailCode(
    apiClient: AxiosInstance,
    passcode: string,
    data: EmailCodeVerifyRequest,
): Promise<EmailCodeVerifyResponse> {
    const res = await apiClient.post<EmailCodeVerifyResponse>(
        `/sessions/by-passcode/${passcode}/email-code/verify`,
        data,
    );
    return res.data;
}

export async function sendHeartbeat(
    apiClient: AxiosInstance,
    passcode: string,
    entryMode: ParticipantEntryMode,
    userAccessToken?: string | null,
): Promise<void> {
    const headers: Record<string, string> = {};

    if (entryMode === 'anonymous') {
        const participantToken = getParticipantToken();
        if (!participantToken) {
            throw new Error('Participant token is required');
        }
        headers.Authorization = `Bearer ${participantToken}`;
    } else if (entryMode === 'email_code') {
        const guestToken = getGuestToken();
        if (!guestToken) {
            throw new Error('Guest token is required');
        }
        headers.Authorization = `Bearer ${guestToken}`;
    } else {
        if (!userAccessToken) {
            throw new Error('User token is required');
        }
        headers.Authorization = `Bearer ${userAccessToken}`;
    }

    await apiClient.post(
        `/sessions/by-passcode/${passcode}/heartbeat`,
        {},
        {headers},
    );
}
