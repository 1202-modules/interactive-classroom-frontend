import { useEffect, useMemo, useState, useCallback } from 'react';
import type { Session, SessionStatus } from '@/shared/types/session';
import { useApi } from '@/shared/hooks/useApi';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import { SESSION_FIELDS, fieldsToString } from '@/shared/api/fields';

export function useWorkspaceSessions(
    workspaceId: number,
    options?: { onSessionsChange?: () => void },
) {
    const api = useApi();
    const onSessionsChange = options?.onSessionsChange;
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionQuery, setSessionQuery] = useState('');
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>('active');
    const [displayedSessionStatus, setDisplayedSessionStatus] = useState<SessionStatus>('active');
    const [hasUserChangedStatus, setHasUserChangedStatus] = useState(false);
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingSessionId, setUpdatingSessionId] = useState<number | null>(null);

    const fetchSessions = useCallback(async (ensureSession?: Session) => {
        if (!workspaceId) return;
        setError(null);
        setIsSessionsLoading(true);
        try {
            const res = await api.get<{ sessions: Session[]; total: number }>(
                `/workspaces/${workspaceId}/sessions`,
                {
                    params: {
                        fields: fieldsToString(SESSION_FIELDS.LIST),
                        _: Date.now(), // cache-bust so list is fresh after create/return
                    },
                },
            );
            const fetchedSessions = res.data?.sessions || [];
            // If ensureSession is provided and not in fetched list, add it
            if (ensureSession && !fetchedSessions.some((s) => s.id === ensureSession.id)) {
                setSessions([ensureSession, ...fetchedSessions]);
            } else {
                setSessions(fetchedSessions);
            }
        } catch (err: unknown) {
            setError(
                parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to load sessions',
                ),
            );
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
            const passcodeMatch = (session.passcode || '').toLowerCase().includes(q);
            return nameMatch || passcodeMatch;
        });
    }, [sessions, displayedSessionStatus, sessionQuery]);

    const moveSession = async (sessionId: number, next: SessionStatus) => {
        if (!sessionId || updatingSessionId === sessionId) return;
        const previous = sessions;
        setUpdatingSessionId(sessionId);
        setSessions((prev) =>
            prev.map((s) =>
                s.id === sessionId
                    ? {
                          ...s,
                          status: next,
                          is_deleted: next === 'trash' ? true : false,
                      }
                    : s,
            ),
        );

        try {
            if (next === 'trash') {
                await api.delete(`/sessions/${sessionId}`);
                onSessionsChange?.();
                return;
            }

            const endpoint =
                next === 'archive'
                    ? `/sessions/${sessionId}/archive`
                    : `/sessions/${sessionId}/unarchive`;

            const res = await api.post<Partial<Session>>(endpoint, null, {
                params: {
                    fields: fieldsToString(SESSION_FIELDS.UPDATE),
                },
            });

            if (res.data) {
                setSessions((prev) =>
                    prev.map((s) =>
                        s.id === sessionId
                            ? { ...s, ...res.data, is_deleted: false }
                            : s,
                    ),
                );
            }
            onSessionsChange?.();
        } catch (err: unknown) {
            setError(
                parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to change session status',
                ),
            );
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

        const fields = fieldsToString(SESSION_FIELDS.UPDATE);

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
        } catch (err: unknown) {
            setError(
                parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to change session state',
                ),
            );
            setSessions(previous);
        } finally {
            setUpdatingSessionId(null);
        }
    };

    const restoreSession = async (sessionId: number) => {
        if (!sessionId || updatingSessionId === sessionId) return;
        const previous = sessions;
        setUpdatingSessionId(sessionId);
        setSessions((prev) =>
            prev.map((s) =>
                s.id === sessionId ? { ...s, is_deleted: false, status: 'active' } : s,
            ),
        );

        try {
            const res = await api.post<Partial<Session>>(`/sessions/${sessionId}/restore`, null, {
                params: {
                    fields: fieldsToString(SESSION_FIELDS.RESTORE),
                },
            });
            if (res.data) {
                setSessions((prev) =>
                    prev.map((s) =>
                        s.id === sessionId
                            ? {
                                  ...s,
                                  ...res.data,
                                  is_deleted: res.data.is_deleted ?? false,
                              }
                            : s,
                    ),
                );
            }
            onSessionsChange?.();
        } catch (err: unknown) {
            setError(
                parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to restore session',
                ),
            );
            setSessions(previous);
        } finally {
            setUpdatingSessionId(null);
        }
    };

    const deleteSessionPermanently = async (sessionId: number) => {
        if (!sessionId || updatingSessionId === sessionId) return;
        const previous = sessions;
        setUpdatingSessionId(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));

        try {
            await api.delete(`/sessions/${sessionId}/permanent`);
            onSessionsChange?.();
        } catch (err: unknown) {
            setError(
                parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to delete session permanently',
                ),
            );
            setSessions(previous);
        } finally {
            setUpdatingSessionId(null);
        }
    };

    const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);
    const closeDeleteDialog = () => setDeleteSessionId(null);
    const confirmDeletePermanently = async () => {
        if (deleteSessionId != null) {
            const targetId = deleteSessionId;
            setDeleteSessionId(null);
            await deleteSessionPermanently(targetId);
        }
    };

    const addSession = useCallback((session: Session) => {
        setSessions((prev) => {
            if (prev.some((s) => s.id === session.id)) return prev;
            return [session, ...prev];
        });
    }, []);

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
        restoreSession,
        deleteSessionPermanently,
        addSession,
        error,
        updatingSessionId,
        refetch: fetchSessions,
    };
}
