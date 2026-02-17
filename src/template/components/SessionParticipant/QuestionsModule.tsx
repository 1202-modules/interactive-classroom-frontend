import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Label, Text, TextInput } from '@gravity-ui/uikit';
import { Heart } from '@gravity-ui/icons';
import type { QuestionMessageItem, QuestionsModuleSettings } from '@/types/questions';
import { getQuestionMessages, createQuestionMessage, likeQuestionMessage } from '@/api/questions';
import type { AxiosInstance } from 'axios';

interface QuestionsModuleProps {
    api: AxiosInstance;
    passcode: string;
    moduleId: number;
    authToken: string;
    participantId: number;
}

export function QuestionsModule({ api, passcode, moduleId, authToken, participantId }: QuestionsModuleProps) {
    const [messages, setMessages] = useState<QuestionMessageItem[]>([]);
    const [settings, setSettings] = useState<QuestionsModuleSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionText, setQuestionText] = useState('');
    const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
    const [likingIds, setLikingIds] = useState<Set<number>>(new Set());

    const fetchMessages = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getQuestionMessages(api, passcode, moduleId, authToken, {
                limit: 200,
                offset: 0,
            });
            setMessages(response.messages || []);
            setSettings(response.settings || null);
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data ||
                err?.message ||
                'Failed to load questions';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [api, passcode, moduleId, authToken]);

    useEffect(() => {
        fetchMessages();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    // Check cooldown
    useEffect(() => {
        if (cooldownUntil && cooldownUntil > Date.now()) {
            const timer = setTimeout(() => setCooldownUntil(null), cooldownUntil - Date.now());
            return () => clearTimeout(timer);
        }
    }, [cooldownUntil]);

    const handleSubmitQuestion = useCallback(async () => {
        const trimmed = questionText.trim();
        if (!trimmed || isSubmitting) return;
        if (settings && trimmed.length > settings.max_length) {
            setError(`Message exceeds maximum length (${settings.max_length} characters)`);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            await createQuestionMessage(api, passcode, moduleId, authToken, { content: trimmed });
            setQuestionText('');
            if (settings?.cooldown_enabled && settings?.cooldown_seconds) {
                setCooldownUntil(Date.now() + settings.cooldown_seconds * 1000);
            }
            await fetchMessages();
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data ||
                err?.message ||
                'Failed to submit question';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }, [questionText, api, passcode, moduleId, authToken, settings, isSubmitting, fetchMessages]);

    const handleSubmitReply = useCallback(
        async (parentId: number) => {
            const trimmed = replyText[parentId]?.trim();
            if (!trimmed || isSubmitting) return;
            if (settings && trimmed.length > settings.max_length) {
                setError(`Message exceeds maximum length (${settings.max_length} characters)`);
                return;
            }

            setIsSubmitting(true);
            setError(null);
            try {
                await createQuestionMessage(api, passcode, moduleId, authToken, {
                    content: trimmed,
                    parent_id: parentId,
                });
                setReplyText((prev) => ({ ...prev, [parentId]: '' }));
                if (settings?.cooldown_enabled && settings?.cooldown_seconds) {
                    setCooldownUntil(Date.now() + settings.cooldown_seconds * 1000);
                }
                await fetchMessages();
            } catch (err: any) {
                const message =
                    err?.response?.data?.detail ||
                    err?.response?.data ||
                    err?.message ||
                    'Failed to submit reply';
                setError(message);
            } finally {
                setIsSubmitting(false);
            }
        },
        [replyText, api, passcode, moduleId, authToken, settings, isSubmitting, fetchMessages],
    );

    const handleLike = useCallback(
        async (msgId: number) => {
            if (likingIds.has(msgId)) return;

            setLikingIds((prev) => new Set(prev).add(msgId));
            try {
                await likeQuestionMessage(api, passcode, moduleId, msgId, authToken);
                await fetchMessages();
            } catch (err: any) {
                // Silently fail - like errors shouldn't break the UI
                console.error('Like failed:', err);
            } finally {
                setLikingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(msgId);
                    return next;
                });
            }
        },
        [api, passcode, moduleId, authToken, likingIds, fetchMessages],
    );

    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => b.likes_count - a.likes_count);
    }, [messages]);

    const canCreateQuestion = useMemo(() => {
        if (!settings) return true;
        if (settings.max_questions_total === null) return true;
        const topLevelCount = messages.filter((m) => m.parent_id === null).length;
        return topLevelCount < settings.max_questions_total;
    }, [settings, messages]);

    const getDisplayName = (name: string | null) => name || 'Participant';

    if (isLoading) {
        return (
            <Card view="outlined" className="participant-page__card">
                <Text variant="header-2">Questions</Text>
                <Text variant="body-1" color="secondary">Loading questions...</Text>
            </Card>
        );
    }

    return (
        <Card view="outlined" className="participant-page__card">
            <div className="participant-page__card-head">
                <Text variant="header-2">Questions</Text>
            </div>

            {error && (
                <Text variant="body-2" color="danger">
                    {error}
                </Text>
            )}

            {canCreateQuestion && (
                <div className="participant-page__question-form">
                    <TextInput
                        placeholder="Ask a question"
                        size="l"
                        value={questionText}
                        onUpdate={setQuestionText}
                        disabled={isSubmitting || (cooldownUntil !== null && cooldownUntil > Date.now())}
                        maxLength={settings?.max_length}
                    />
                    <Button
                        view="action"
                        size="l"
                        onClick={handleSubmitQuestion}
                        disabled={isSubmitting || !questionText.trim() || (cooldownUntil !== null && cooldownUntil > Date.now())}
                    >
                        Send
                    </Button>
                </div>
            )}

            {cooldownUntil !== null && cooldownUntil > Date.now() && (
                <Text variant="body-2" color="secondary">
                    Please wait {Math.ceil((cooldownUntil - Date.now()) / 1000)} seconds before sending another message
                </Text>
            )}

            {!canCreateQuestion && (
                <Text variant="body-2" color="secondary">
                    Maximum number of questions reached
                </Text>
            )}

            <div className="participant-page__questions-list">
                {sortedMessages.length === 0 ? (
                    <div className="participant-page__questions-empty">
                        <Text variant="body-1" color="secondary">
                            Be the first to ask a question.
                        </Text>
                    </div>
                ) : (
                    sortedMessages.map((message) => (
                        <div key={message.id} className="participant-page__question-item">
                            <div className="participant-page__question-text">
                                <Text variant="body-2" color="secondary">
                                    {getDisplayName(message.author_display_name)}
                                </Text>
                                <Text variant="body-1">{message.content}</Text>
                                {message.is_answered && (
                                    <Label theme="success" size="s" style={{ marginTop: '4px' }}>
                                        Answered
                                    </Label>
                                )}
                            </div>
                            <div className="participant-page__question-actions">
                                {settings?.likes_enabled && (
                                    <Button
                                        view="flat"
                                        size="s"
                                        onClick={() => handleLike(message.id)}
                                        disabled={likingIds.has(message.id)}
                                    >
                                        <Heart />
                                        {message.likes_count}
                                    </Button>
                                )}
                            </div>

                            {/* Replies */}
                            {message.children && message.children.length > 0 && (
                                <div style={{ marginTop: '12px', paddingLeft: '16px', borderLeft: '2px solid var(--g-color-line-generic)' }}>
                                    {message.children.map((child) => (
                                        <div key={child.id} style={{ marginTop: '8px' }}>
                                            <Text variant="body-2" color="secondary">
                                                {getDisplayName(child.author_display_name)}
                                            </Text>
                                            <Text variant="body-2">{child.content}</Text>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply form */}
                            {settings?.allow_participant_answers && (
                                <div style={{ marginTop: '8px' }}>
                                    <div className="participant-page__question-form">
                                        <TextInput
                                            placeholder="Reply..."
                                            size="m"
                                            value={replyText[message.id] || ''}
                                            onUpdate={(value) => setReplyText((prev) => ({ ...prev, [message.id]: value }))}
                                            disabled={isSubmitting || (cooldownUntil !== null && cooldownUntil > Date.now())}
                                            maxLength={settings?.max_length}
                                        />
                                        <Button
                                            view="flat"
                                            size="m"
                                            onClick={() => handleSubmitReply(message.id)}
                                            disabled={
                                                isSubmitting ||
                                                !replyText[message.id]?.trim() ||
                                                (cooldownUntil !== null && cooldownUntil > Date.now())
                                            }
                                        >
                                            Reply
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
