import type {Session, SessionStatus} from '../types/session';

/**
 * SessionService - Business logic for workspace sessions
 * TODO: When integrating with API, these methods should become async and call API endpoints:
 * - moveSession -> PATCH /sessions/{id}/status
 * - toggleStartStop -> POST /sessions/{id}/start or /sessions/{id}/stop
 * - deleteSession -> DELETE /sessions/{id}
 * - filterSessions -> GET /workspaces/{id}/sessions?status={status}&query={query}
 * - getSessionsByWorkspace -> GET /workspaces/{id}/sessions
 */
export class SessionService {
    /**
     * Move session to a different status (active/archive/trash)
     * TODO: Make async and call API: PATCH /sessions/{id}/status
     */
    moveSession(sessionId: number, nextStatus: SessionStatus, sessions: Session[]): Session[] {
        return sessions.map((s) => (s.id === sessionId ? {...s, status: nextStatus} : s));
    }

    /**
     * Toggle start/stop state of a session
     * TODO: Make async and call API: POST /sessions/{id}/start or POST /sessions/{id}/stop
     */
    toggleStartStop(sessionId: number, sessions: Session[]): Session[] {
        return sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const nextStopped = !s.is_stopped;
            return {
                ...s,
                is_stopped: nextStopped,
                started_at: nextStopped ? null : s.started_at ?? new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        });
    }

    /**
     * Delete session permanently
     * TODO: Make async and call API: DELETE /sessions/{id}
     */
    deleteSession(sessionId: number, sessions: Session[]): Session[] {
        return sessions.filter((s) => s.id !== sessionId);
    }

    /**
     * Filter sessions by query and status
     */
    filterSessions(sessions: Session[], query: string, status: SessionStatus): Session[] {
        const q = query.trim().toLowerCase();
        return sessions
            .filter((s) => s.status === status)
            .filter((s) => {
                if (!q) return true;
                const passcode = s.passcode ?? '';
                return s.name.toLowerCase().includes(q) || passcode.toLowerCase().includes(q);
            })
            .sort((a, b) => {
                // First: running sessions (is_stopped=false) come first
                if (a.is_stopped !== b.is_stopped) {
                    return a.is_stopped ? 1 : -1;
                }
                // Then: sort by updated_at (newest first)
                return a.updated_at < b.updated_at ? 1 : -1;
            });
    }

    /**
     * Get sessions by workspace ID
     * TODO: Make async and call API: GET /workspaces/{workspaceId}/sessions
     */
    getSessionsByWorkspace(workspaceId: number, allSessions: Session[]): Session[] {
        return allSessions.filter((s) => s.workspace_id === workspaceId);
    }
}

export const sessionService = new SessionService();
