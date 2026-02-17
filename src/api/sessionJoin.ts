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
    GuestJoinResponse,
    RegisteredJoinResponse,
    SessionByPasscodeResponse,
} from '@/types/sessionJoin';
import {getGuestToken, getParticipantToken} from '@/utils/tokenStorage';

export async function getSessionByPasscode(
    apiClient: AxiosInstance,
    passcode: string,
): Promise<SessionByPasscodeResponse> {
    const guestToken = getGuestToken();
    const headers: Record<string, string> = {};

    // Only guest token is supported by this public endpoint (for autologin in email_code mode)
    if (guestToken) {
        headers.Authorization = `Bearer ${guestToken}`;
    }

    const res = await apiClient.get<SessionByPasscodeResponse>(`/sessions/by-passcode/${passcode}`, {
        headers,
    });
    return res.data;
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

export async function joinGuest(apiClient: AxiosInstance, passcode: string): Promise<GuestJoinResponse> {
    const guestToken = getGuestToken();
    if (!guestToken) throw new Error('Guest token is required');

    const res = await apiClient.post<GuestJoinResponse>(
        `/sessions/by-passcode/${passcode}/join/guest`,
        {},
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
    participantTokenOverride?: string | null,
): Promise<void> {
    const guestToken = getGuestToken();
    const participantToken = participantTokenOverride ?? getParticipantToken();

    // For registered users we rely on axios default Authorization header (user token)
    const headers: Record<string, string> = {};
    if (guestToken) headers.Authorization = `Bearer ${guestToken}`;
    else if (participantToken) headers.Authorization = `Bearer ${participantToken}`;

    await apiClient.post(
        `/sessions/by-passcode/${passcode}/heartbeat`,
        {},
        Object.keys(headers).length ? {headers} : undefined,
    );
}
