import {useCallback, useEffect, useState} from 'react';
import {Button, Card, Label, Text, TextInput} from '@gravity-ui/uikit';
import type {Participant, SessionModule} from '@/shared/types/sessionPage';
import type {QuestionMessageItem} from '@/shared/types/questions';
import {formatShortDate} from '@/shared/utils/date';
import {useApi} from '@/shared/hooks/useApi';
import {getQuestionMessagesLecturer, patchQuestionMessageLecturer} from '@/shared/api/questions';
import {patchParticipant} from '@/shared/api/sessionParticipants';
import {
    getTimerState,
    timerStart,
    timerPause,
    timerResume,
    timerReset,
    timerSet,
} from '@/shared/api/timer';

type SessionPreviewTabProps = {
    participants: Participant[];
    participantSearch: string;
    onParticipantSearchChange: (value: string) => void;
    filteredParticipants: Participant[];
    activeModule: SessionModule | undefined;
    sessionId: string;
    sessionPasscode?: string;
    onRefetchParticipants?: () => void;
};

function InspectModuleContent({
    activeModule,
    sessionId,
    sessionPasscode,
    onRefetchParticipants,
}: {
    activeModule: SessionModule;
    sessionId: string;
    sessionPasscode?: string;
    onRefetchParticipants?: () => void;
}) {
    const api = useApi();
    const [messages, setMessages] = useState<QuestionMessageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [pinningId, setPinningId] = useState<number | null>(null);
    const sessionIdNum = Number(sessionId);
    const moduleIdNum = Number(activeModule.id);

    const fetchMessages = useCallback(() => {
        if (activeModule.type !== 'questions' || !Number.isFinite(sessionIdNum) || !Number.isFinite(moduleIdNum)) {
            return;
        }
        setLoading(true);
        getQuestionMessagesLecturer(api, sessionIdNum, moduleIdNum)
            .then((res) => setMessages(res.messages ?? []))
            .catch(() => setMessages([]))
            .finally(() => setLoading(false));
    }, [api, activeModule.type, sessionIdNum, moduleIdNum]);

    useEffect(() => {
        if (activeModule.type !== 'questions') return;
        fetchMessages();
    }, [activeModule.type, activeModule.id, fetchMessages]);

    const handlePin = useCallback(
        (msgId: number) => {
            if (!Number.isFinite(sessionIdNum) || !Number.isFinite(moduleIdNum)) return;
            setPinningId(msgId);
            patchQuestionMessageLecturer(api, sessionIdNum, moduleIdNum, msgId, { pin: true })
                .then(() => fetchMessages())
                .finally(() => setPinningId(null));
        },
        [api, sessionIdNum, moduleIdNum, fetchMessages],
    );

    const [banningId, setBanningId] = useState<number | null>(null);
    const handleBan = useCallback(
        (participantId: number) => {
            if (!Number.isFinite(sessionIdNum)) return;
            setBanningId(participantId);
            patchParticipant(api, sessionIdNum, participantId, { is_banned: true })
                .then(() => {
                    fetchMessages();
                    onRefetchParticipants?.();
                })
                .finally(() => setBanningId(null));
        },
        [api, sessionIdNum, onRefetchParticipants, fetchMessages],
    );

    if (activeModule.type === 'questions') {
        return (
            <div className="session-page__inspect-questions">
                <div className="session-page__inspect-questions-header">
                    <Text variant="subheader-1">{activeModule.name}</Text>
                    <Button
                        view="flat"
                        size="s"
                        onClick={fetchMessages}
                        loading={loading}
                        title="Refresh list"
                    >
                        Refresh
                    </Button>
                </div>
                {loading ? (
                    <Text variant="body-2" color="secondary">Loading…</Text>
                ) : messages.length === 0 ? (
                    <Text variant="body-2" color="secondary">No questions yet.</Text>
                ) : (
                    <div className="session-page__inspect-messages-list">
                        {messages.map((msg) => (
                            <Card
                                key={msg.id}
                                view="outlined"
                                className="session-page__inspect-message-card"
                            >
                                <Text variant="body-2" className="session-page__inspect-message-content">
                                    {msg.content}
                                </Text>
                                <div className="session-page__inspect-message-meta">
                                    <Text variant="caption-2" color="secondary">
                                        {msg.parent_id ? 'Reply' : 'Question'} by{' '}
                                        {msg.author_display_name ?? 'Unknown'}
                                    </Text>
                                    {msg.parent_id && (
                                        <Text variant="caption-2" color="secondary">
                                            Reply to question #{msg.parent_id}
                                        </Text>
                                    )}
                                </div>
                                <div className="session-page__inspect-message-actions">
                                    <Button
                                        view="flat"
                                        size="xs"
                                        loading={banningId === msg.participant_id}
                                        onClick={() => handleBan(msg.participant_id)}
                                        title="Ban this participant for the session"
                                    >
                                        Ban
                                    </Button>
                                    {!msg.parent_id && (
                                        <Button
                                            view="flat"
                                            size="xs"
                                            loading={pinningId === msg.id}
                                            onClick={() => handlePin(msg.id)}
                                        >
                                            Pin to top
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (activeModule.type === 'timer') {
        return (
            <InspectTimer
                activeModule={activeModule}
                sessionId={sessionId}
                sessionPasscode={sessionPasscode}
            />
        );
    }

    return (
        <Text variant="body-2" color="secondary">
            {activeModule.name} ({activeModule.type}) — inspect UI for this module type coming soon.
        </Text>
    );
}

function InspectTimer({
    activeModule,
    sessionId,
    sessionPasscode,
}: {
    activeModule: SessionModule;
    sessionId: string;
    sessionPasscode?: string;
}) {
    const api = useApi();
    const sessionIdNum = Number(sessionId);
    const moduleIdNum = Number(activeModule.id);
    const [timerState, setTimerState] = useState<{
        is_paused: boolean;
        remaining_seconds: number | null;
        end_at: string | null;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [setValueInput, setSetValueInput] = useState('');

    const fetchState = useCallback(() => {
        if (activeModule.type !== 'timer' || !sessionPasscode || !Number.isFinite(moduleIdNum)) return;
        setLoading(true);
        getTimerState(api, sessionPasscode, moduleIdNum)
            .then((s) =>
                setTimerState({
                    is_paused: s.is_paused,
                    remaining_seconds: s.remaining_seconds ?? null,
                    end_at: s.end_at ?? null,
                }),
            )
            .catch(() => setTimerState(null))
            .finally(() => setLoading(false));
    }, [api, activeModule.type, sessionPasscode, moduleIdNum]);

    useEffect(() => {
        if (activeModule.type !== 'timer') return;
        fetchState();
        const t = setInterval(fetchState, 2000);
        return () => clearInterval(t);
    }, [activeModule.type, activeModule.id, fetchState]);

    const runAction = useCallback(
        (fn: () => Promise<unknown>) => {
            if (!Number.isFinite(sessionIdNum) || !Number.isFinite(moduleIdNum)) return;
            setActionLoading(true);
            fn()
                .then(() => fetchState())
                .finally(() => setActionLoading(false));
        },
        [sessionIdNum, moduleIdNum, fetchState],
    );

    const handleSetValue = useCallback(() => {
        const val = parseInt(setValueInput, 10);
        if (!Number.isFinite(val) || val < 0) return;
        runAction(() => timerSet(api, sessionIdNum, moduleIdNum, Math.min(val, 86400)));
        setSetValueInput('');
    }, [api, sessionIdNum, moduleIdNum, runAction, setValueInput]);

    return (
        <div className="session-page__inspect-timer">
            <Text variant="subheader-1">{activeModule.name}</Text>
            {loading && !timerState ? (
                <Text variant="body-2" color="secondary">Loading…</Text>
            ) : (
                <>
                    <div className="session-page__inspect-timer-state">
                        <Text variant="body-2">
                            Status: {timerState?.is_paused ? 'Paused' : 'Running'}
                        </Text>
                        <Text variant="body-2" color="secondary">
                            {timerState?.remaining_seconds != null
                                ? `${timerState.remaining_seconds}s`
                                : timerState?.end_at
                                  ? 'Running (see end_at)'
                                  : '—'}
                        </Text>
                    </div>
                    <div className="session-page__inspect-timer-actions">
                        <Button
                            view="outlined"
                            size="m"
                            disabled={actionLoading}
                            onClick={() => runAction(() => timerStart(api, sessionIdNum, moduleIdNum))}
                        >
                            Start
                        </Button>
                        <Button
                            view="outlined"
                            size="m"
                            disabled={actionLoading || timerState?.is_paused}
                            onClick={() =>
                                runAction(() =>
                                    timerPause(
                                        api,
                                        sessionIdNum,
                                        moduleIdNum,
                                        timerState?.remaining_seconds ?? 0,
                                    ),
                                )
                            }
                        >
                            Stop
                        </Button>
                        <Button
                            view="outlined"
                            size="m"
                            disabled={actionLoading || !timerState?.is_paused}
                            onClick={() => runAction(() => timerResume(api, sessionIdNum, moduleIdNum))}
                        >
                            Resume
                        </Button>
                        <Button
                            view="outlined"
                            size="m"
                            disabled={actionLoading}
                            onClick={() => runAction(() => timerReset(api, sessionIdNum, moduleIdNum))}
                        >
                            Reset
                        </Button>
                    </div>
                    <div className="session-page__inspect-timer-set">
                        <TextInput
                            size="m"
                            type="number"
                            value={setValueInput}
                            onUpdate={setSetValueInput}
                            placeholder="Seconds (0–86400)"
                        />
                        <Button
                            view="outlined"
                            size="m"
                            disabled={actionLoading}
                            onClick={handleSetValue}
                        >
                            Set value
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

export function SessionPreviewTab({
    participants,
    participantSearch,
    onParticipantSearchChange,
    filteredParticipants,
    activeModule,
    sessionId,
    sessionPasscode,
    onRefetchParticipants,
}: SessionPreviewTabProps) {
    return (
        <div className="session-page__inspect-panel">
            <div className="session-page__inspect-column session-page__inspect-column_participants">
                <Card view="outlined" className="session-page__participants-card">
                    <Text variant="subheader-1">Participants ({participants.length})</Text>
                    <TextInput
                        placeholder="Search participants..."
                        value={participantSearch}
                        onUpdate={onParticipantSearchChange}
                        size="l"
                        className="session-page__search"
                    />
                    <div className="session-page__participants-list">
                        {filteredParticipants.map((participant) => (
                            <Card
                                key={participant.id}
                                view="outlined"
                                className="session-page__participant-card"
                            >
                                <div className="session-page__participant-info">
                                    <Text variant="body-2">{participant.name}</Text>
                                    <div className="session-page__participant-meta">
                                        {participant.is_banned && (
                                            <Label theme="danger" size="xs">
                                                Banned
                                            </Label>
                                        )}
                                        <Label
                                            theme={participant.is_active ? 'success' : 'normal'}
                                            size="xs"
                                        >
                                            {participant.is_active ? 'Active' : 'Inactive'}
                                        </Label>
                                        <Label theme="utility" size="xs">
                                            {participant.auth_type}
                                        </Label>
                                        <Text variant="caption-2" color="secondary">
                                            Joined {formatShortDate(participant.joined_at)}
                                        </Text>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>
            </div>
            <div className="session-page__inspect-column session-page__inspect-column_module">
                <Card view="outlined" className="session-page__inspect-module-card">
                    <Text variant="subheader-1">Inspect Module</Text>
                    {!activeModule ? (
                        <Text variant="body-2" color="secondary">
                            No active module. Activate a module on the Session modules tab to
                            administer it here.
                        </Text>
                    ) : (
                        <InspectModuleContent
                            activeModule={activeModule}
                            sessionId={sessionId}
                            sessionPasscode={sessionPasscode}
                            onRefetchParticipants={onRefetchParticipants}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
}
