import {useCallback, useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent} from 'react';
import {useParams} from 'react-router-dom';
import {Button, Card, Icon, Label, Text, TextInput} from '@gravity-ui/uikit';
import * as GravityIcons from '@gravity-ui/icons';
import {QRCodeSVG} from 'qrcode.react';

import type {SessionInfo, SessionModule, SessionModuleApi} from '@/shared/types/sessionPage';
import type {QuestionMessageItem} from '@/shared/types/questions';
import type {TimerStateResponse} from '@/shared/types/timer';
import {getModuleIcon} from '@/shared/utils/sessionModuleUtils';
import {useApi} from '@/shared/hooks/useApi';
import {SESSION_FIELDS, SESSION_MODULE_FIELDS, fieldsToString} from '@/shared/api/fields';
import {getQuestionMessagesLecturer, patchQuestionMessageLecturer} from '@/shared/api/questions';
import {
    getTimerState,
    timerPause,
    timerReset,
    timerResume,
    timerSet,
    timerStart,
} from '@/shared/api/timer';
import './PresentationPage.css';

const ArrowsExpandIcon = (GravityIcons as Record<string, unknown>).ArrowsExpand as never;
const ArrowsRotateLeftIcon = (GravityIcons as Record<string, unknown>).ArrowsRotateLeft as never;
const PlayIcon = (GravityIcons as Record<string, unknown>).Play as never;
const PauseIcon = (GravityIcons as Record<string, unknown>).Pause as never;
const RotateIcon = (GravityIcons as Record<string, unknown>).ArrowsRotateLeft as never;
const PinFillIcon =
    ((GravityIcons as Record<string, unknown>).PinFill ??
        (GravityIcons as Record<string, unknown>).PushPin) as never;

type PresentationQuestionsProps = {
    api: ReturnType<typeof useApi>;
    sessionId: number;
    moduleId: number;
};

type PresentationTimerProps = {
    api: ReturnType<typeof useApi>;
    sessionId: number;
    moduleId: number;
    passcode: string;
    moduleConfig: Record<string, unknown>;
};

const mapSessionModule = (module: SessionModuleApi, index: number): SessionModule => ({
    id: String(module.id),
    module_id: 0,
    order: index,
    is_active: module.is_active,
    name: module.name ?? 'Untitled module',
    type: module.module_type,
    config: module.settings ?? {},
});

const moduleTypeLabel = (type: string) => type.charAt(0).toUpperCase() + type.slice(1);

const sortQuestionMessages = (messages: QuestionMessageItem[]) =>
    [...messages].sort((a, b) => {
        const pinA = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
        const pinB = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
        if (pinA !== pinB) return pinB - pinA;
        if (a.likes_count !== b.likes_count) return b.likes_count - a.likes_count;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
    });

const getAllMessages = (messages: QuestionMessageItem[]): QuestionMessageItem[] => {
    const flat: QuestionMessageItem[] = [];
    const walk = (items: QuestionMessageItem[]) => {
        items.forEach((item) => {
            flat.push(item);
            if (item.children?.length) {
                walk(item.children);
            }
        });
    };
    walk(messages);
    return flat;
};

const formatTimer = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getTimerConfiguredSeconds = (config: Record<string, unknown>) => {
    const value = config.duration_seconds ?? config.duration_sec;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 300;
    return Math.max(0, Math.min(86400, Math.floor(parsed)));
};

function PresentationQuestions({api, sessionId, moduleId}: PresentationQuestionsProps) {
    const [messages, setMessages] = useState<QuestionMessageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);
    const [pinLoadingId, setPinLoadingId] = useState<number | null>(null);

    const fetchMessages = useCallback(async () => {
        setLoading((prev) => prev || messages.length === 0);
        try {
            const res = await getQuestionMessagesLecturer(api, sessionId, moduleId);
            setMessages(sortQuestionMessages(res.messages ?? []));
        } catch {
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, [api, sessionId, moduleId, messages.length]);

    useEffect(() => {
        fetchMessages();
        const t = window.setInterval(fetchMessages, 2500);
        return () => window.clearInterval(t);
    }, [fetchMessages]);

    const allMessages = useMemo(() => getAllMessages(messages), [messages]);
    const expandedMessage =
        expandedMessageId == null
            ? null
            : allMessages.find((message) => message.id === expandedMessageId) ?? null;

    const togglePinExpand = useCallback(
        async (messageId: number) => {
            const isExpanded = expandedMessageId === messageId;
            const previousId = expandedMessageId;
            setPinLoadingId(messageId);
            try {
                if (isExpanded) {
                    await patchQuestionMessageLecturer(api, sessionId, moduleId, messageId, {
                        unpin: true,
                    });
                    setExpandedMessageId(null);
                } else {
                    if (previousId != null && previousId !== messageId) {
                        await patchQuestionMessageLecturer(api, sessionId, moduleId, previousId, {
                            unpin: true,
                        });
                    }
                    await patchQuestionMessageLecturer(api, sessionId, moduleId, messageId, {
                        pin: true,
                    });
                    setExpandedMessageId(messageId);
                }
                await fetchMessages();
            } finally {
                setPinLoadingId(null);
            }
        },
        [api, sessionId, moduleId, fetchMessages, expandedMessageId],
    );

    useEffect(() => {
        if (expandedMessageId == null) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.code !== 'Space') return;
            event.preventDefault();
            void togglePinExpand(expandedMessageId);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [expandedMessageId, togglePinExpand]);

    const renderMessageCard = (message: QuestionMessageItem, depth = 0) => {
        const isPinned = Boolean(message.pinned_at);
        return (
            <div key={message.id} className="presentation-page__question-thread">
                <Card
                    view="filled"
                    className={`presentation-page__question-card${isPinned ? ' presentation-page__question-card_pinned' : ''}`}
                >
                    <button
                        type="button"
                        className="presentation-page__question-card-button"
                        disabled={pinLoadingId != null}
                        onClick={() => void togglePinExpand(message.id)}
                    >
                        <div className="presentation-page__question-main">
                            <Text variant="subheader-2" className="presentation-page__question-content">
                                {message.content}
                            </Text>
                            <div className="presentation-page__question-meta">
                                <Text variant="body-1" color="secondary">
                                    {message.parent_id ? 'Reply by ' : 'Question by '}
                                    {message.author_display_name ?? 'Anonymous'}
                                </Text>
                                {!message.parent_id && (
                                    <Label theme="unknown" size="s">
                                        {message.likes_count} likes
                                    </Label>
                                )}
                            </div>
                        </div>
                        {depth === 0 && isPinned && (
                            <span className="presentation-page__question-pin-mark" aria-label="Pinned">
                                <Icon data={PinFillIcon} size={16} />
                            </span>
                        )}
                    </button>
                </Card>
                {message.children?.length > 0 && (
                    <div className="presentation-page__question-children">
                        {sortQuestionMessages(message.children).map((child) =>
                            renderMessageCard(child, depth + 1),
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="presentation-page__questions-wrap">
            {loading && messages.length === 0 ? (
                <Text variant="body-2" color="secondary">Loading questions…</Text>
            ) : messages.length === 0 ? (
                <Text variant="body-2" color="secondary">No questions yet</Text>
            ) : (
                <div className="presentation-page__questions-list">
                    {messages.map((message) => renderMessageCard(message))}
                </div>
            )}

            {expandedMessage && (
                <button
                    type="button"
                    className="presentation-page__question-overlay"
                    onClick={() => void togglePinExpand(expandedMessage.id)}
                >
                    <Card view="filled" className="presentation-page__question-overlay-card">
                        <div className="presentation-page__question-overlay-content-wrap">
                            <Text variant="display-1" className="presentation-page__question-overlay-content">
                                {expandedMessage.content}
                            </Text>
                            <Text variant="header-1" color="secondary">
                                {expandedMessage.parent_id ? 'Reply by ' : 'Question by '}
                                {expandedMessage.author_display_name ?? 'Anonymous'}
                            </Text>
                        </div>
                    </Card>
                </button>
            )}
        </div>
    );
}

function PresentationTimer({api, sessionId, moduleId, passcode, moduleConfig}: PresentationTimerProps) {
    const configuredSeconds = useMemo(() => getTimerConfiguredSeconds(moduleConfig), [moduleConfig]);
    const [timerState, setTimerState] = useState<TimerStateResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editMinutes, setEditMinutes] = useState('0');
    const [editSeconds, setEditSeconds] = useState('0');
    const [now, setNow] = useState<number>(Date.now());
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    useEffect(() => {
        const tick = window.setInterval(() => setNow(Date.now()), 250);
        return () => window.clearInterval(tick);
    }, []);

    const fetchState = useCallback(async () => {
        if (!passcode) return;
        if (!initialLoadDone) {
            setLoading(true);
        }
        try {
            const state = await getTimerState(api, passcode, moduleId);
            setTimerState(state);
        } catch {
            setTimerState(null);
        } finally {
            if (!initialLoadDone) {
                setInitialLoadDone(true);
                setLoading(false);
            }
        }
    }, [api, moduleId, passcode, initialLoadDone]);

    useEffect(() => {
        fetchState();
        const t = window.setInterval(fetchState, 2000);
        return () => window.clearInterval(t);
    }, [fetchState]);

    const remainingSeconds = useMemo(() => {
        if (!timerState) return configuredSeconds;
        if (timerState.is_paused) {
            return timerState.remaining_seconds ?? configuredSeconds;
        }
        if (!timerState.end_at) return configuredSeconds;
        const endMs = new Date(timerState.end_at).getTime();
        return Math.max(0, Math.floor((endMs - now) / 1000));
    }, [timerState, configuredSeconds, now]);

    const runAction = useCallback(
        async (request: () => Promise<TimerStateResponse>) => {
            setActionLoading(true);
            try {
                await request();
                await fetchState();
            } finally {
                setActionLoading(false);
            }
        },
        [fetchState],
    );

    const handleStart = () => {
        if (timerState?.is_paused && timerState.remaining_seconds != null) {
            void runAction(() => timerResume(api, sessionId, moduleId));
            return;
        }
        void runAction(() => timerStart(api, sessionId, moduleId));
    };

    const handlePause = () => {
        void runAction(() => timerPause(api, sessionId, moduleId, remainingSeconds));
    };

    const handleReset = () => {
        setIsEditing(false);
        void runAction(() => timerReset(api, sessionId, moduleId));
    };

    const startEdit = () => {
        if (loading || actionLoading) return;
        setEditMinutes(String(Math.floor(remainingSeconds / 60)));
        setEditSeconds(String(remainingSeconds % 60));
        setIsEditing(true);
    };

    const applyEdit = () => {
        const mins = Math.max(0, Number.parseInt(editMinutes || '0', 10) || 0);
        const secsRaw = Math.max(0, Number.parseInt(editSeconds || '0', 10) || 0);
        const secs = Math.min(59, secsRaw);
        const total = Math.min(86400, mins * 60 + secs);
        setIsEditing(false);
        void runAction(() => timerSet(api, sessionId, moduleId, total));
    };

    const handleEditKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyEdit();
        }
    };

    return (
        <div className="presentation-page__timer-wrap">
            <button
                type="button"
                className="presentation-page__timer-touch"
                onClick={startEdit}
                disabled={loading || actionLoading}
            >
                <Text variant="display-4" className="presentation-page__timer-value">
                    {formatTimer(remainingSeconds)}
                </Text>
            </button>
            {isEditing && (
                <div className="presentation-page__timer-editor">
                    <TextInput
                        size="l"
                        type="number"
                        value={editMinutes}
                        onUpdate={setEditMinutes}
                        onKeyDown={handleEditKeyDown}
                        placeholder="MM"
                    />
                    <span className="presentation-page__timer-editor-separator">:</span>
                    <TextInput
                        size="l"
                        type="number"
                        value={editSeconds}
                        onUpdate={setEditSeconds}
                        onKeyDown={handleEditKeyDown}
                        placeholder="SS"
                    />
                    <Button view="action" size="l" onClick={applyEdit}>
                        Apply
                    </Button>
                </div>
            )}
            <div className="presentation-page__timer-actions">
                <Button
                    view="action"
                    size="xl"
                    className="presentation-page__timer-action presentation-page__timer-action_start"
                    disabled={actionLoading}
                    onClick={handleStart}
                    title="Start"
                >
                    <Icon data={PlayIcon} size={20} />
                </Button>
                <Button
                    view="outlined"
                    size="xl"
                    className="presentation-page__timer-action"
                    disabled={actionLoading || timerState?.is_paused}
                    onClick={handlePause}
                    title="Pause"
                >
                    <Icon data={PauseIcon} size={20} />
                </Button>
                <Button
                    view="outlined"
                    size="xl"
                    className="presentation-page__timer-action"
                    disabled={actionLoading}
                    onClick={handleReset}
                    title="Reset"
                >
                    <Icon data={RotateIcon} size={20} />
                </Button>
            </div>
        </div>
    );
}

export default function PresentationPage() {
    const {sessionId} = useParams();
    const api = useApi();
    const sessionIdNumber = Number(sessionId);
    const isSessionIdValid = Number.isFinite(sessionIdNumber);
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const [sessionModules, setSessionModules] = useState<SessionModule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const fetchSessionInfo = useCallback(async () => {
        if (!isSessionIdValid) return;
        setIsLoading(true);
        try {
            const res = await api.get<SessionInfo>(`/sessions/${sessionIdNumber}`, {
                params: {fields: fieldsToString(SESSION_FIELDS.PRESENTATION)},
            });
            setSessionInfo(res.data);
        } catch (err) {
            setSessionInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, [api, isSessionIdValid, sessionIdNumber]);

    const fetchSessionModules = useCallback(async () => {
        if (!isSessionIdValid) return;
        try {
            const res = await api.get<SessionModuleApi[]>(
                `/sessions/${sessionIdNumber}/modules`,
                {
                    params: {fields: fieldsToString(SESSION_MODULE_FIELDS.LIST)},
                },
            );
            setSessionModules((res.data || []).map(mapSessionModule));
        } catch (err) {
            setSessionModules([]);
        }
    }, [api, isSessionIdValid, sessionIdNumber]);

    useEffect(() => {
        fetchSessionInfo();
    }, [fetchSessionInfo]);

    useEffect(() => {
        fetchSessionModules();
    }, [fetchSessionModules]);

    useEffect(() => {
        document.body.classList.add('presentation-mode');
        return () => {
            document.body.classList.remove('presentation-mode');
        };
    }, []);

    useEffect(() => {
        if (!isSessionIdValid) return;
        const intervalId = window.setInterval(() => {
            fetchSessionModules();
        }, 5000);
        return () => window.clearInterval(intervalId);
    }, [fetchSessionModules, isSessionIdValid]);

    const passcode = sessionInfo?.passcode ?? '';
    const qrCodeUrl = passcode ? `${window.location.origin}/s/${passcode}` : '';
    const activeModule = sessionModules.find((m) => m.is_active);
    const moduleType = activeModule ? moduleTypeLabel(activeModule.type) : '';
    const moduleTypeLabels = useMemo(
        () => sessionModules.map((module) => ({id: module.id, type: moduleTypeLabel(module.type)})),
        [sessionModules],
    );


    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div className="presentation-page">
            {/* Control buttons (hidden in fullscreen) */}
            {!isFullscreen && (
                <div className="presentation-page__controls">
                    <Button view="flat" size="s" onClick={handleRefresh}>
                        <Icon data={ArrowsRotateLeftIcon} size={16} />
                        Refresh
                    </Button>
                    <Button view="flat" size="s" onClick={handleToggleFullscreen}>
                        <Icon data={ArrowsExpandIcon} size={16} />
                        Fullscreen
                    </Button>
                </div>
            )}

            {/* No active module: Full screen QR code */}
            {!activeModule && (
                <div className="presentation-page__qr-fullscreen">
                    <div className="presentation-page__qr-container">
                        <Text variant="display-3" className="presentation-page__title">
                            {isLoading ? 'Loading…' : sessionInfo?.name || 'Session'}
                        </Text>
                        <div className="presentation-page__qr-code-large">
                            {qrCodeUrl ? (
                                <QRCodeSVG value={qrCodeUrl} size={400} level="M" />
                            ) : (
                                <div className="presentation-page__qr-placeholder" />
                            )}
                        </div>
                        <div className="presentation-page__passcode-container">
                            <Text variant="header-1" color="secondary">
                                Join at: {window.location.origin}/s/
                            </Text>
                            <Text variant="display-2" className="presentation-page__passcode">
                                {passcode || '—'}
                            </Text>
                        </div>
                        <Text variant="subheader-1" color="secondary">
                            Scan QR code or enter passcode to join
                        </Text>
                    </div>
                </div>
            )}

            {/* With active module: 3/4 module + 1/4 sidebar */}
            {activeModule && (
                <div className="presentation-page__with-module">
                    {/* LEFT 3/4: Active Module */}
                    <div className="presentation-page__module-area">
                        <div className="presentation-page__module-content">
                            <Icon
                                data={getModuleIcon(activeModule.type)}
                                size={80}
                                className="presentation-page__module-icon"
                            />
                            <Text variant="display-2">{moduleType}</Text>

                            {/* Module-specific content preview */}
                            {activeModule.type === 'questions' && (
                                <PresentationQuestions
                                    api={api}
                                    sessionId={sessionIdNumber}
                                    moduleId={Number(activeModule.id)}
                                />
                            )}

                            {activeModule.type === 'poll' &&
                                activeModule.config.type === 'poll' && (
                                    <div className="presentation-page__module-details">
                                        <Text variant="header-2">
                                            {String((activeModule.config as { question?: unknown }).question ?? '')}
                                        </Text>
                                        <div className="presentation-page__wordcloud-placeholder">
                                            <Text variant="display-1" style={{opacity: 0.3}}>
                                                ☁️ Word Cloud
                                            </Text>
                                            <Text variant="body-2" color="secondary">
                                                Results will appear here as students respond
                                            </Text>
                                        </div>
                                    </div>
                                )}

                            {activeModule.type === 'quiz' &&
                                activeModule.config.type === 'quiz' && (
                                    <div className="presentation-page__module-details">
                                        <Text variant="header-2">
                                            {String((activeModule.config as { question?: unknown }).question ?? '')}
                                        </Text>
                                        <div className="presentation-page__quiz-options">
                                            {((activeModule.config as { options?: Array<{ text: string; correct: boolean }> }).options ?? []).map(
                                                (
                                                    option: {text: string; correct: boolean},
                                                    idx: number,
                                                ) => (
                                                    <div
                                                        key={idx}
                                                        className={`presentation-page__quiz-option ${
                                                            option.correct
                                                                ? 'presentation-page__quiz-option_correct'
                                                                : ''
                                                        }`}
                                                    >
                                                        <Text variant="subheader-1">
                                                            {String.fromCharCode(65 + idx)}.{' '}
                                                            {option.text}
                                                        </Text>
                                                        <div className="presentation-page__quiz-bar">
                                                            <div
                                                                className="presentation-page__quiz-bar-fill"
                                                                style={{
                                                                    width: `${
                                                                        Math.random() * 80 + 10
                                                                    }%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {activeModule.type === 'timer' && (
                                <PresentationTimer
                                    api={api}
                                    sessionId={sessionIdNumber}
                                    moduleId={Number(activeModule.id)}
                                    passcode={passcode}
                                    moduleConfig={activeModule.config}
                                />
                            )}
                        </div>
                    </div>

                    {/* RIGHT 1/4: QR */}
                    <div className="presentation-page__sidebar">
                        {/* Small QR Code */}
                        <div className="presentation-page__qr-small">
                            <Text variant="display-2">Join Session</Text>
                            <Text variant="header-1" color="secondary">
                                {passcode || '—'}
                            </Text>
                            <div className="presentation-page__qr-code-small">
                                {qrCodeUrl ? (
                                    <QRCodeSVG value={qrCodeUrl} size={1000} level="M" />
                                ) : (
                                    <div className="presentation-page__qr-placeholder" />
                                )}
                            </div>
                        </div>
                        <div className="presentation-page__module-list">
                            <Text variant="subheader-2">Modules</Text>
                            <div className="presentation-page__module-list-items">
                                {moduleTypeLabels.map((module) => (
                                    <Label
                                        key={module.id}
                                        theme={activeModule?.id === module.id ? 'success' : 'unknown'}
                                        size="m"
                                    >
                                        {module.type}
                                    </Label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
