/**
 * Utilities for storing and retrieving tokens from localStorage
 */

const PARTICIPANT_TOKEN_KEY = 'participant_token';
const GUEST_TOKEN_KEY = 'guest_token';

/**
 * Store participant token (for anonymous participants)
 */
export function setParticipantToken(token: string): void {
    localStorage.setItem(PARTICIPANT_TOKEN_KEY, token);
}

/**
 * Get participant token
 */
export function getParticipantToken(): string | null {
    return localStorage.getItem(PARTICIPANT_TOKEN_KEY);
}

/**
 * Remove participant token
 */
export function removeParticipantToken(): void {
    localStorage.removeItem(PARTICIPANT_TOKEN_KEY);
}

/**
 * Store guest token (for email_code mode)
 */
export function setGuestToken(token: string): void {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
}

/**
 * Get guest token
 */
export function getGuestToken(): string | null {
    return localStorage.getItem(GUEST_TOKEN_KEY);
}

/**
 * Remove guest token
 */
export function removeGuestToken(): void {
    localStorage.removeItem(GUEST_TOKEN_KEY);
}

/**
 * Clear all session-related tokens
 */
export function clearSessionTokens(): void {
    removeParticipantToken();
    removeGuestToken();
}
