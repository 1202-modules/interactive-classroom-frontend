import { useState, useEffect, useMemo } from 'react';
import type { Session, SessionStatus } from '../types/session';
import { mockSessions } from '../data/mockSessions';
import { sessionService } from '../services/sessionService';
// TODO: Replace with API call - import { getWorkspaceSessions } from '../api/sessions';

export function useWorkspaceSessions(workspaceId: number) {
  // TODO: Replace with API call - const [sessions, setSessions] = useState<Session[]>([]);
  // TODO: useEffect(() => { getWorkspaceSessions(workspaceId).then(setSessions); }, [workspaceId]);
  const [sessions, setSessions] = useState<Session[]>(() =>
    sessionService.getSessionsByWorkspace(workspaceId, mockSessions),
  );

  useEffect(() => {
    // TODO: Replace with API call - getWorkspaceSessions(workspaceId).then(setSessions);
    setSessions(sessionService.getSessionsByWorkspace(workspaceId, mockSessions));
  }, [workspaceId]);

  const [sessionQuery, setSessionQuery] = useState('');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('active');
  const [displayedSessionStatus, setDisplayedSessionStatus] = useState<SessionStatus>('active');
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  const startSessionFilterTransition = (nextStatus: SessionStatus) => {
    if (nextStatus === sessionStatus) return;
    setSessionStatus(nextStatus);
    setIsSessionsLoading(true);
    window.setTimeout(() => {
      setDisplayedSessionStatus(nextStatus);
      setIsSessionsLoading(false);
    }, 200);
  };

  const filteredSessions = useMemo(() => {
    return sessionService.filterSessions(sessions, sessionQuery, displayedSessionStatus);
  }, [sessions, displayedSessionStatus, sessionQuery]);

  const moveSession = (sessionId: number, next: SessionStatus) => {
    // TODO: Replace with API call - await moveSession(sessionId, next);
    setSessions((prev) => sessionService.moveSession(sessionId, next, prev));
  };

  const toggleStartStop = (sessionId: number) => {
    // TODO: Replace with API call - await toggleStartStop(sessionId);
    setSessions((prev) => sessionService.toggleStartStop(sessionId, prev));
  };

  const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);

  const deleteSession = (sessionId: number) => {
    // TODO: Replace with API call - await deleteSessionPermanently(sessionId);
    setSessions((prev) => sessionService.deleteSession(sessionId, prev));
    setDeleteSessionId(null);
  };

  const closeDeleteDialog = () => setDeleteSessionId(null);
  const confirmDeletePermanently = () => {
    if (deleteSessionId != null) {
      deleteSession(deleteSessionId);
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
  };
}

