import { useState } from 'react';
import { Button, Card, DropdownMenu, Icon, Text } from '@gravity-ui/uikit';
import {
    Archive,
    ArrowRotateLeft,
    EllipsisVertical,
    Play,
    Stop,
    TrashBin,
    Xmark,
} from '@gravity-ui/icons';
import type { Session, SessionStatus } from '@/shared/types/session';
import { formatShortDate } from '@/shared/utils/date';

interface SessionCardProps {
    session: Session;
    workspaceId: number;
    onNavigate: (workspaceId: number, sessionId: number) => void;
    onToggleStartStop: (sessionId: number) => void;
    onMoveSession: (sessionId: number, status: SessionStatus) => void;
    onRestore: (sessionId: number) => void;
    onDelete: (sessionId: number) => void;
    isUpdating?: boolean;
}

const INVITE_URL = (passcode: string) =>
    passcode ? `${window.location.origin}/s/${passcode}` : '';

export function SessionCard({
    session,
    workspaceId,
    onNavigate,
    onToggleStartStop,
    onMoveSession,
    onRestore,
    onDelete,
    isUpdating,
}: SessionCardProps) {
    const [passcodeCopied, setPasscodeCopied] = useState(false);
    const isLive = session.status === 'active' && !session.is_stopped;
    const isTrash = session.is_deleted === true;
    const isArchive = session.status === 'archive' && !isTrash;

    const menuItems = [
        [
            {
                text: session.is_stopped ? 'Start session' : 'Stop session',
                iconStart: <Icon data={session.is_stopped ? Play : Stop} size={16} />,
                action: () => onToggleStartStop(session.id),
                disabled: session.status !== 'active' || isTrash || isArchive || isUpdating,
            },
            isTrash
                ? {
                    text: 'Restore from trash',
                    iconStart: <Icon data={ArrowRotateLeft} size={16} />,
                    action: () => onRestore(session.id),
                    disabled: isUpdating,
                }
                : session.status === 'active'
                    ? {
                        text: 'Move to archive',
                        iconStart: <Icon data={Archive} size={16} />,
                        action: () => onMoveSession(session.id, 'archive'),
                        disabled: isUpdating,
                    }
                    : {
                        text: 'Restore from archive',
                        iconStart: <Icon data={ArrowRotateLeft} size={16} />,
                        action: () => onMoveSession(session.id, 'active'),
                        disabled: isUpdating,
                    },
            isTrash
                ? {
                    text: 'Delete permanently',
                    iconStart: <Icon data={Xmark} size={16} />,
                    theme: 'danger' as const,
                    action: () => onDelete(session.id),
                    disabled: isUpdating,
                }
                : {
                    text: 'Move to trash',
                    iconStart: <Icon data={TrashBin} size={16} />,
                    theme: 'danger' as const,
                    action: () => onMoveSession(session.id, 'trash'),
                    disabled: isUpdating,
                },
        ],
    ];

    return (
        <Card
            view="outlined"
            className={`workspace-session ${isTrash ? '' : 'workspace-session_clickable'} ${isLive ? 'workspace-session_live' : ''
                }`}
            style={{ cursor: isTrash ? 'default' : 'pointer' }}
        >
            <div
                className="workspace-session__main"
                onClick={(e) => {
                    e.stopPropagation();
                    if (isTrash) {
                        return;
                    }
                    const target = e.target as HTMLElement;
                    if (
                        target.closest('button') ||
                        target.closest('[role="menu"]') ||
                        target.closest('a')
                    ) {
                        return;
                    }
                    if (workspaceId && session.id) {
                        onNavigate(workspaceId, session.id);
                    }
                }}
            >
                <div className="workspace-session__title-row">
                    <Text variant="subheader-3" ellipsis className="workspace-session__title">
                        {session.name}
                    </Text>
                </div>

                <div className="workspace-session__details">
                    <div className="workspace-session__detail">
                        <Text variant="body-2" color="secondary">
                            Passcode:
                        </Text>
                        <button
                            type="button"
                            className="workspace-session__mono workspace-session__mono_clickable"
                            onClick={(e) => {
                                e.stopPropagation();
                                const url = INVITE_URL(session.passcode || '');
                                if (url) {
                                    navigator.clipboard.writeText(url);
                                    setPasscodeCopied(true);
                                    setTimeout(() => setPasscodeCopied(false), 2000);
                                }
                            }}
                            disabled={!session.passcode}
                            title={session.passcode ? 'Copy session link' : undefined}
                        >
                            {passcodeCopied ? 'Link copied!' : session.passcode || '—'}
                        </button>
                    </div>
                    <div className="workspace-session__detail">
                        <Text variant="body-2" color="secondary">
                            Participants:
                        </Text>
                        <Text variant="body-2">{session.participant_count}</Text>
                    </div>
                    <div className="workspace-session__detail">
                        <Text variant="body-2" color="secondary">
                            Last update:
                        </Text>
                        <Text variant="body-2">{formatShortDate(session.updated_at)}</Text>
                    </div>
                </div>
            </div>

            <div className="workspace-session__side" onClick={(e) => e.stopPropagation()}>
                <div className="workspace-session__live-group">
                    {isLive && (
                        <span className="workspace-session__live">
                            <span className="workspace-session__live-dot" aria-hidden />
                            <Text variant="body-2">Live</Text>
                        </span>
                    )}
                    {session.status === 'active' && !isTrash && (
                        <Button
                            view="flat"
                            size="s"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStartStop(session.id);
                            }}
                            title={session.is_stopped ? 'Start session' : 'Stop session'}
                            className={!session.is_stopped ? 'workspace-session__stop-button' : ''}
                            disabled={isUpdating}
                        >
                            <Icon data={session.is_stopped ? Play : Stop} size={16} />
                        </Button>
                    )}
                </div>
                <DropdownMenu
                    items={menuItems}
                    renderSwitcher={(props) => (
                        <Button {...props} view="flat" size="l" title="More options">
                            <Icon data={EllipsisVertical} size={16} />
                        </Button>
                    )}
                />
            </div>
        </Card>
    );
}
