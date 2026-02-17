/**
 * Types for session join and guest authentication
 */

export type ParticipantEntryMode = 'anonymous' | 'registered' | 'sso' | 'email_code';

export interface SessionByPasscodeResponse {
    id: number;
    name: string;
    participant_entry_mode: ParticipantEntryMode;
    email_code_domains_whitelist?: string[];
    sso_organization_id?: number | null;
    guest_authenticated?: boolean | null;
    email?: string | null;
    display_name?: string | null;
}

export interface AnonymousJoinRequest {
    display_name?: string;
}

export interface AnonymousJoinResponse {
    participant_token: string;
    token_type: string;
    participant_id: number;
    session_id: number;
    display_name: string;
}

export interface RegisteredJoinResponse {
    participant_id: number;
    session_id: number;
    display_name: string;
}

export interface GuestJoinResponse {
    participant_id: number;
    session_id: number;
    display_name: string;
}

export interface EmailCodeRequestRequest {
    email: string;
}

export interface EmailCodeRequestResponse {
    verification_code_sent: boolean;
    code?: string; // Only when SMTP is disabled
}

export interface EmailCodeVerifyRequest {
    email: string;
    code: string;
    display_name?: string;
}

export interface EmailCodeVerifyResponse {
    access_token: string;
    token_type: string;
    email: string;
    display_name: string;
}
