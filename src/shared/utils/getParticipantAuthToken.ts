/**
 * Get the appropriate auth token for participant API calls.
 * Priority: guest_token > participant_token
 * Note: For registered users, accessToken should be passed separately (from useAuth hook)
 */
import { getGuestToken, getParticipantToken } from './tokenStorage';

export function getParticipantAuthToken(userAccessToken?: string | null): string | null {
    const guestToken = getGuestToken();
    if (guestToken) return guestToken;

    if (userAccessToken) return userAccessToken;

    const participantToken = getParticipantToken();
    return participantToken;
}
