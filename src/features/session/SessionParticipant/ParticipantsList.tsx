import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, Card, Text, TextInput } from '@gravity-ui/uikit';
import type { AxiosInstance } from 'axios';

import { getParticipantsByPasscode, patchOwnParticipantByPasscode } from '@/shared/api/sessionParticipants';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import type { SessionParticipantItem } from '@/shared/types/sessionParticipants';
import type { ParticipantEntryMode } from '@/shared/types/sessionJoin';

interface ParticipantsListProps {
    api: AxiosInstance;
    passcode: string;
    authToken: string;
    participantId: number;
    entryMode: ParticipantEntryMode;
}

function buildInitials(value: string): string {
    const parts = value
        .trim()
        .split(/\s+/u)
        .filter(Boolean);
    const symbolPattern = /[\p{L}\p{N}]/u;
    const pickSymbol = (input: string): string =>
        Array.from(input).find((char) => symbolPattern.test(char)) || '';

    const first = pickSymbol(parts[0] || '');
    let second = pickSymbol(parts[1] || '');

    if (!second) {
        const symbols = Array.from(value).filter((char) => symbolPattern.test(char));
        if (symbols.length > 1) {
            second = symbols[1];
        }
    }

    const result = `${first}${second}`.trim();
    return result ? result.toLocaleUpperCase() : 'P';
}

function getParticipantLabel(participant: SessionParticipantItem): string {
    if (participant.participant_type === 'guest_email') {
        return participant.guest_email ? `Email guest · ${participant.guest_email}` : 'Email guest';
    }
    if (participant.participant_type === 'user') return 'Registered user';
    if (participant.participant_type === 'anonymous') return 'Anonymous';
    return participant.participant_type;
}

export function ParticipantsList({ api, passcode, authToken, participantId, entryMode }: ParticipantsListProps) {
    const [participants, setParticipants] = useState<SessionParticipantItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nameDraft, setNameDraft] = useState('');
    const [isNameDirty, setIsNameDirty] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const initialLoadRef = useRef(true);

    const fetchParticipants = useCallback(async () => {
        try {
            const response = await getParticipantsByPasscode(api, passcode, authToken);
            setParticipants(response.participants || []);
            setError(null);
        } catch (err: unknown) {
            if (initialLoadRef.current) {
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to load participants',
                );
                setError(message);
            }
        } finally {
            if (initialLoadRef.current) {
                initialLoadRef.current = false;
                setIsLoading(false);
            }
        }
    }, [api, passcode, authToken]);

    useEffect(() => {
        fetchParticipants();
        const interval = setInterval(fetchParticipants, 3000);
        return () => clearInterval(interval);
    }, [fetchParticipants]);

    const selfParticipant = useMemo(
        () => participants.find((participant) => participant.id === participantId) || null,
        [participants, participantId],
    );

    const canEditDisplayName =
        (entryMode === 'anonymous' || entryMode === 'email_code') && selfParticipant !== null;

    useEffect(() => {
        if (!selfParticipant || isNameDirty) return;
        setNameDraft((selfParticipant.display_name || '').trim());
    }, [selfParticipant, isNameDirty]);

    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => {
            const left = (a.display_name || '').toLowerCase();
            const right = (b.display_name || '').toLowerCase();
            return left.localeCompare(right);
        });
    }, [participants]);

    const handleSaveDisplayName = useCallback(async () => {
        const value = nameDraft.trim();
        if (!value || !canEditDisplayName || !selfParticipant) return;
        setIsSavingName(true);
        setNameError(null);
        try {
            const updated = await patchOwnParticipantByPasscode(api, passcode, authToken, {
                display_name: value,
            });
            setParticipants((prev) =>
                prev.map((participant) =>
                    participant.id === updated.id
                        ? { ...participant, display_name: updated.display_name }
                        : participant,
                ),
            );
            setIsNameDirty(false);
        } catch (err: unknown) {
            const message = parseBackendError(
                (err as { response?: { data?: unknown } })?.response?.data,
                'Failed to update display name',
            );
            setNameError(message);
        } finally {
            setIsSavingName(false);
        }
    }, [nameDraft, canEditDisplayName, selfParticipant, api, passcode, authToken]);

    if (isLoading) {
        return (
            <Card view="outlined" className="participant-page__card participant-page__module-card">
                <Text variant="header-2">Participants</Text>
                <Text variant="body-1" color="secondary">
                    Loading...
                </Text>
            </Card>
        );
    }

    if (error) {
        return (
            <Card view="outlined" className="participant-page__card participant-page__module-card">
                <Text variant="header-2">Participants</Text>
                <Text variant="body-2" color="danger">
                    {error}
                </Text>
            </Card>
        );
    }

    return (
        <Card view="outlined" className="participant-page__card participant-page__module-card">
            <div className="participant-page__module-head">
                <Text variant="display-3">Participants</Text>
                <Text variant="body-1" color="secondary">
                    {sortedParticipants.length} joined
                </Text>
            </div>

            {canEditDisplayName && (
                <div className="participant-page__self-name-edit">
                    <Text variant="body-2" color="secondary">Your display name</Text>
                    <div className="participant-page__self-name-edit-row">
                        <TextInput
                            value={nameDraft}
                            onUpdate={(value) => {
                                setNameDraft(value);
                                setIsNameDirty(true);
                            }}
                            size="l"
                            placeholder="Enter your name"
                            disabled={isSavingName}
                        />
                        <Button
                            view="action"
                            size="l"
                            onClick={handleSaveDisplayName}
                            disabled={!nameDraft.trim() || !isNameDirty || isSavingName}
                            loading={isSavingName}
                        >
                            Save
                        </Button>
                    </div>
                    {nameError && (
                        <Text variant="body-2" color="danger">{nameError}</Text>
                    )}
                </div>
            )}

            {sortedParticipants.length === 0 ? (
                <div className="participant-page__questions-empty">
                    <Text variant="body-1" color="secondary">
                        No participants yet.
                    </Text>
                </div>
            ) : (
                <div className="participant-page__participants-grid">
                    {sortedParticipants.map((participant) => {
                        const title = participant.display_name || 'Anonymous';
                        return (
                            <div key={participant.id} className="participant-page__participant-item">
                                <Avatar text={buildInitials(title)} size="m" />
                                <div className="participant-page__participant-meta">
                                    <Text variant="body-2">{title}</Text>
                                    <Text variant="body-1" color="secondary">
                                        {getParticipantLabel(participant)}
                                    </Text>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
