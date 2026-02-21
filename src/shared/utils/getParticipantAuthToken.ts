/**
 * Get the appropriate auth token for participant API calls.
 * Token is selected strictly by session entry mode.
 */
import { getGuestToken, getParticipantToken } from './tokenStorage';
import type { ParticipantEntryMode } from '@/shared/types/sessionJoin';

export function getParticipantAuthToken(
    entryMode: ParticipantEntryMode,
    userAccessToken?: string | null,
): string | null {
    if (entryMode === 'anonymous') {
        return getParticipantToken();
    }
    if (entryMode === 'email_code') {
        return getGuestToken();
    }
    return userAccessToken || null;
}
