import { Card, Skeleton, Text } from '@gravity-ui/uikit';
import { SessionCard } from './SessionCard/SessionCard';
import { SessionFilters } from './SessionFilters/SessionFilters';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { useWorkspaceSessions } from '@/shared/hooks/useWorkspaceSessions';

interface WorkspaceSessionsTabProps {
    workspaceId: number;
    workspaceSessions: ReturnType<typeof useWorkspaceSessions>;
    onCreateSession: () => void;
    onNavigate: (workspaceId: number, sessionId: number) => void;
}

export function WorkspaceSessionsTab({
    workspaceId,
    workspaceSessions,
    onCreateSession,
    onNavigate,
}: WorkspaceSessionsTabProps) {
    return (
        <div className="workspace-page__section">
            <SessionFilters
                query={workspaceSessions.sessionQuery}
                onQueryChange={workspaceSessions.setSessionQuery}
                status={workspaceSessions.sessionStatus}
                onStatusChange={workspaceSessions.startSessionFilterTransition}
                onCreateSession={onCreateSession}
            />

            <div
                className="workspace-page__list"
                aria-busy={workspaceSessions.isSessionsLoading || undefined}
            >
                {workspaceSessions.isSessionsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} view="outlined" className="workspace-session">
                            <div className="workspace-session__main">
                                <div className="workspace-session__name">
                                    <Skeleton
                                        style={{ width: '55%', height: 18, borderRadius: 6 }}
                                    />
                                </div>
                                <div className="workspace-session__sub">
                                    <Skeleton
                                        style={{ width: 120, height: 14, borderRadius: 6 }}
                                    />
                                </div>
                            </div>
                            <div className="workspace-session__side">
                                <Skeleton
                                    style={{ width: 90, height: 18, borderRadius: 9 }}
                                />
                                <Skeleton
                                    style={{ width: 36, height: 36, borderRadius: 10 }}
                                />
                            </div>
                        </Card>
                    ))
                ) : workspaceSessions.filteredSessions.length === 0 ? (
                    <Card view="outlined" className="workspace-page__empty">
                        <Text variant="body-1" color="secondary">
                            No sessions here yet. Try changing the filter or creating a new
                            session.
                        </Text>
                    </Card>
                ) : (
                    workspaceSessions.filteredSessions.map((s) => (
                        <SessionCard
                            key={s.id}
                            session={s}
                            workspaceId={workspaceId}
                            onNavigate={onNavigate}
                            onToggleStartStop={workspaceSessions.toggleStartStop}
                            onMoveSession={workspaceSessions.moveSession}
                            onRestore={workspaceSessions.restoreSession}
                            onDelete={workspaceSessions.setDeleteSessionId}
                            isUpdating={workspaceSessions.updatingSessionId === s.id}
                        />
                    ))
                )}
            </div>

            <ConfirmDialog
                open={workspaceSessions.deleteSessionId != null}
                title="Delete permanently?"
                message="This action cannot be undone."
                cancelText="Cancel"
                confirmText="Delete permanently"
                onCancel={workspaceSessions.closeDeleteDialog}
                onConfirm={workspaceSessions.confirmDeletePermanently}
            />
        </div>
    );
}
