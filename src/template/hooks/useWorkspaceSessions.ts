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
                        include_deleted: true,
                        fields:
                            'id,workspace_id,name,description,status,is_stopped,passcode,participant_count,stopped_participant_count,start_datetime,end_datetime,created_at,updated_at',
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
        setIsSessionsLoading(true);
        window.setTimeout(() => {
            setDisplayedSessionStatus(nextStatus);
            setIsSessionsLoading(false);
        }, 200);
    };

    useEffect(() => {
        if (hasUserChangedStatus) return;
        if (sessionStatus !== 'active') return;
        if (sessions.length === 0) return;

        const hasActive = sessions.some((s) => s.status === 'active');
        if (hasActive) return;

        const nextStatus: SessionStatus = sessions.some((s) => s.status === 'archive')
            ? 'archive'
            : 'trash';
        setSessionStatus(nextStatus);
        setDisplayedSessionStatus(nextStatus);
    }, [sessions, sessionStatus, hasUserChangedStatus]);

    const filteredSessions = useMemo(() => {
        return sessions.filter((session) => {
            // status filter
            if (displayedSessionStatus === 'active' && session.status !== 'active') return false;
            if (displayedSessionStatus === 'archive' && session.status !== 'archive') return false;
            if (displayedSessionStatus === 'trash' && session.status !== 'trash') return false;

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
