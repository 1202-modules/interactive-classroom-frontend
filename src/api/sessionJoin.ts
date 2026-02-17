/**
 * API functions for session join and guest authentication
 */
import type { AxiosInstance } from 'axios';
import type {
    SessionByPasscodeResponse,
    AnonymousJoinRequest,
    AnonymousJoinResponse,
    RegisteredJoinResponse,
    GuestJoinResponse,
    EmailCodeRequestRequest,
    EmailCodeRequestResponse,
    EmailCodeVerifyRequest,
    EmailCodeVerifyResponse,
} from '../types/sessionJoin';
import { getParticipantToken, getGuestToken } from '../utils/tokenStorage';

/**
 * Get session info by passcode
 */
export async function getSessionByPasscode(
    apiClient: AxiosInstance,
    passcode: string,
): Promise<SessionByPasscodeResponse> {
    const guestToken = getGuestToken();
    const headers: Record<string, string> = {};
    
    if (guestToken) {
        headers.Authorization = `Bearer ${guestToken}`;
    }
    
    const res = await apiClient.get<SessionByPasscodeResponse>(
        `/sessions/by-passcode/${passcode}`,
        { headers },
    );
    return res.data;
}

/**
 * Join session as anonymous participant
 */
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

/**
 * Join session as registered user
 */
export async function joinRegistered(
    apiClient: AxiosInstance,
    passcode: string,
): Promise<RegisteredJoinResponse> {
    const res = await apiClient.post<RegisteredJoinResponse>(
        `/sessions/by-passcode/${passcode}/join/registered`,
    );
    return res.data;
}

/**
 * Join session as guest (email_code mode)
 */
export async function joinGuest(
    apiClient: AxiosInstance,
    passcode: string,
): Promise<GuestJoinResponse> {
    const guestToken = getGuestToken();
    if (!guestToken) {
        throw new Error('Guest token is required');
    }
    
    const res = await apiClient.post<GuestJoinResponse>(
        `/sessions/by-passcode/${passcode}/join/guest`,
        {},
        {
            headers: {
                Authorization: `Bearer ${guestToken}`,
            },
        },
    );
    return res.data;
}

/**
 * Request email verification code
 */
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

/**
 * Verify email code and get guest token
 */
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

/**
 * Send heartbeat to mark participant as active
 */
export async function sendHeartbeat(
    apiClient: AxiosInstance,
    passcode: string,
    participantToken?: string | null,
): Promise<void> {
    const token = participantToken || getParticipantToken();
    const guestToken = getGuestToken();
    
    const config: { headers?: Record<string, string>; data?: { participant_token: string } } = {};
    
    if (guestToken) {
        // For registered/guest: use Authorization header
        config.headers = {
            Authorization: `Bearer ${guestToken}`,
        };
    } else if (token) {
        // For anonymous: can use either Authorization header or body
        config.headers = {
            Authorization: `Bearer ${token}`,
        };
    }
    
    await apiClient.post(`/sessions/by-passcode/${passcode}/heartbeat`, {}, config);
}
