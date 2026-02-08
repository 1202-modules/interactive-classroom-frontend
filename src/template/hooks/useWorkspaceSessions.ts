import { useEffect, useMemo, useState, useCallback } from 'react';
import type { Session, SessionStatus } from '../types/session';
import { useApi } from '@/hooks/useApi';

export function useWorkspaceSessions(workspaceId: number) {
    const api = useApi();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionQuery, setSessionQuery] = useState('');
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>('active');
    const [displayedSessionStatus, setDisplayedSessionStatus] = useState<SessionStatus>('active');
    const [hasUserChangedStatus, setHasUserChangedStatus] = useState(false);
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingSessionId, setUpdatingSessionId] = useState<number | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!workspaceId) return;
        setError(null);
        setIsSessionsLoading(true);
        try {
            const res = await api.get<{ sessions: Session[]; total: number }>(
                `/workspaces/${workspaceId}/sessions`,
                {
                    params: {
                        fields:
                            'id,workspace_id,name,description,status,is_stopped,passcode,participant_count,stopped_participant_count,start_datetime,end_datetime,created_at,updated_at,is_deleted',
                    },
                },
            );
            setSessions(res.data?.sessions || []);
        } catch (err: any) {
            const detail = err?.response?.data?.detail || err?.response?.data;
            const message = typeof detail === 'string' ? detail : 'Failed to load sessions';
            setError(message);
        } finally {
            setIsSessionsLoading(false);
        }
    }, [api, workspaceId]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const startSessionFilterTransition = (nextStatus: SessionStatus) => {
        if (nextStatus === sessionStatus) return;
        setHasUserChangedStatus(true);
        setSessionStatus(nextStatus);
        setDisplayedSessionStatus(nextStatus);
    };

    useEffect(() => {
        if (hasUserChangedStatus) return;
        if (sessionStatus !== 'active') return;
        if (sessions.length === 0) return;

        const hasActive = sessions.some((s) => s.status === 'active' && !s.is_deleted);
        if (hasActive) return;

        const nextStatus: SessionStatus = sessions.some(
            (s) => s.status === 'archive' && !s.is_deleted,
        )
            ? 'archive'
            : 'trash';
        setSessionStatus(nextStatus);
        setDisplayedSessionStatus(nextStatus);
    }, [sessions, sessionStatus, hasUserChangedStatus]);

    const filteredSessions = useMemo(() => {
        return sessions.filter((session) => {
            // status filter
            if (displayedSessionStatus === 'trash') {
                if (!session.is_deleted) return false;
            } else {
                if (session.is_deleted) return false;
                if (displayedSessionStatus === 'active' && session.status !== 'active') return false;
                if (displayedSessionStatus === 'archive' && session.status !== 'archive') return false;
            }

            if (!sessionQuery.trim()) return true;
            const q = sessionQuery.toLowerCase();
            const nameMatch = session.name.toLowerCase().includes(q);
            const descMatch = (session.description || '').toLowerCase().includes(q);
            return nameMatch || descMatch;
        });
    }, [sessions, displayedSessionStatus, sessionQuery]);

    const moveSession = async (sessionId: number, next: SessionStatus) => {
        if (!sessionId || updatingSessionId === sessionId) return;
        const previous = sessions;
        setUpdatingSessionId(sessionId);
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: next } : s)));

        try {
            if (next === 'trash') {
                await api.delete(`/sessions/${sessionId}`);
                return;
            }

            const endpoint =
                next === 'archive'
                    ? `/sessions/${sessionId}/archive`
                    : `/sessions/${sessionId}/unarchive`;

            const res = await api.post<Partial<Session>>(endpoint, null, {
                params: {
                    fields:
                        'id,name,status,is_stopped,passcode,participant_count,stopped_participant_count,start_datetime,end_datetime,updated_at',
                },
            });

            if (res.data) {
                setSessions((prev) =>
                    prev.map((s) => (s.id === sessionId ? { ...s, ...res.data } : s)),
                );
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail || err?.response?.data;
            const message =
                typeof detail === 'string' ? detail : 'Failed to change session status';
            setError(message);
            setSessions(previous);
        } finally {
            setUpdatingSessionId(null);
        }
    };

    const toggleStartStop = async (sessionId: number) => {
        const target = sessions.find((s) => s.id === sessionId);
        if (!target || updatingSessionId === sessionId) return;

        const previous = sessions;
        const nextStopped = !target.is_stopped;
        setUpdatingSessionId(sessionId);
        setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, is_stopped: nextStopped } : s)),
        );

        const fields =
            'id,name,status,is_stopped,passcode,participant_count,stopped_participant_count,start_datetime,end_datetime,updated_at';

        const endpoint = nextStopped
            ? `/sessions/${sessionId}/stop`
            : `/sessions/${sessionId}/start`;

        const params = nextStopped
            ? { participant_count: target.participant_count ?? 0, fields }
            : { fields };

        try {
            const res = await api.post<Partial<Session>>(endpoint, null, { params });
            if (res.data) {
                setSessions((prev) =>
                    prev.map((s) => (s.id === sessionId ? { ...s, ...res.data } : s)),
                );
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail || err?.response?.data;
            const message = typeof detail === 'string' ? detail : 'Failed to change session state';
            setError(message);
            setSessions(previous);
        } finally {
            setUpdatingSessionId(null);
        }
    };

    const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);
    const closeDeleteDialog = () => setDeleteSessionId(null);
    const confirmDeletePermanently = () => {
        if (deleteSessionId != null) {
            setSessions((prev) => prev.filter((s) => s.id !== deleteSessionId));
            setDeleteSessionId(null);
        }
    };

    return {
        sessions,
        sessionQuery,
        setSessionQuery,
        sessionStatus,
        displayedSessionStatus,
        isSessionsLoading,
        startSessionFilterTransition,
        filteredSessions,
        deleteSessionId,
        setDeleteSessionId,
        closeDeleteDialog,
        confirmDeletePermanently,
        moveSession,
        toggleStartStop,
        error,
        updatingSessionId,
        refetch: fetchSessions,
    };
}
