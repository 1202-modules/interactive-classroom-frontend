import { KeyboardEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Icon, Label, Text, TextInput, Tooltip } from '@gravity-ui/uikit';
import * as GravityIcons from '@gravity-ui/icons';
import type { AxiosInstance } from 'axios';

import type { QuestionMessageItem, QuestionsModuleSettings } from '@/shared/types/questions';
import { createQuestionMessage, getQuestionMessages, likeQuestionMessage } from '@/shared/api/questions';
import { parseBackendError } from '@/shared/utils/parseBackendError';

interface QuestionsModuleProps {
    api: AxiosInstance;
    passcode: string;
    moduleId: number;
    authToken: string;
    participantId: number;
}

const ANON_TOOLTIP =
    'Send without public name. Session owner can still identify your account.';
const REGULAR_TOOLTIP = 'Send with your current display name visible to participants.';
const HeartIcon = (GravityIcons as Record<string, unknown>).Heart as unknown;
const PinFillIcon = (GravityIcons as Record<string, unknown>).PinFill as unknown;
const AnonymousReplyIcon =
    ((GravityIcons as Record<string, unknown>).EyeSlash ??
        (GravityIcons as Record<string, unknown>).Incognito ??
        (GravityIcons as Record<string, unknown>).Bubble ??
        (GravityIcons as Record<string, unknown>).Person) as unknown;
const SendReplyIcon =
    ((GravityIcons as Record<string, unknown>).PaperPlane ??
        (GravityIcons as Record<string, unknown>).ArrowRight) as unknown;

type CooldownErrorPayload = {
    detail?: string;
    retry_after?: number | string;
    retry_after_seconds?: number | string;
    cooldown_seconds?: number | string;
    cooldown_until?: number | string;
};

function parsePositiveSeconds(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.ceil(value);
    }
    if (typeof value === 'string') {
        const numeric = Number(value);
        if (Number.isFinite(numeric) && numeric > 0) {
            return Math.ceil(numeric);
        }
    }
    return null;
}

function parseRetryAfterHeader(value: unknown): number | null {
    const headerValue = Array.isArray(value) ? value[0] : value;
    const directSeconds = parsePositiveSeconds(headerValue);
    if (directSeconds !== null) {
        return directSeconds;
    }

    if (typeof headerValue === 'string') {
        const retryDateMs = Date.parse(headerValue);
        if (Number.isFinite(retryDateMs)) {
            const msLeft = retryDateMs - Date.now();
            if (msLeft > 0) {
                return Math.ceil(msLeft / 1000);
            }
        }
    }

    return null;
}

function parseCooldownUntil(value: unknown): number | null {
    const raw = parsePositiveSeconds(value);
    if (raw === null) {
        return null;
    }

    if (raw > 1_000_000_000_000) {
        const msLeft = raw - Date.now();
        return msLeft > 0 ? Math.ceil(msLeft / 1000) : null;
    }

    if (raw > 1_000_000_000) {
        const msLeft = raw * 1000 - Date.now();
        return msLeft > 0 ? Math.ceil(msLeft / 1000) : null;
    }

    return raw;
}

function extractCooldownSecondsFromError(err: unknown, fallbackSeconds: number | null): number | null {
    const response = (err as {
        response?: {
            status?: number;
            headers?: Record<string, unknown>;
            data?: unknown;
        };
    })?.response;

    if (response?.status !== 429) {
        return null;
    }

    const retryAfterFromHeader = parseRetryAfterHeader(
        response.headers?.['retry-after'] ?? response.headers?.['Retry-After'],
    );
    if (retryAfterFromHeader !== null) {
        return retryAfterFromHeader;
    }

    const data = (response.data || {}) as CooldownErrorPayload;
    const cooldownUntil = parseCooldownUntil(data.cooldown_until);
    if (cooldownUntil !== null) {
        return cooldownUntil;
    }
    const retryAfter =
        parsePositiveSeconds(data.retry_after) ??
        parsePositiveSeconds(data.retry_after_seconds) ??
        parsePositiveSeconds(data.cooldown_seconds);
    if (retryAfter !== null) {
        return retryAfter;
    }

    if (typeof data.detail === 'string') {
        const match = data.detail.match(/(\d+)\s*(?:seconds?|secs?|s|сек(?:унд[аы]?)?)/i);
        if (match?.[1]) {
            const parsed = parsePositiveSeconds(match[1]);
            if (parsed !== null) {
                return parsed;
            }
        }
    }

    return fallbackSeconds;
}

export function QuestionsModule({ api, passcode, moduleId, authToken, participantId }: QuestionsModuleProps) {
    const [messages, setMessages] = useState<QuestionMessageItem[]>([]);
    const [settings, setSettings] = useState<QuestionsModuleSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionText, setQuestionText] = useState('');
    const [replyText, setReplyText] = useState<Record<number, string>>({});
    const [openReplyId, setOpenReplyId] = useState<number | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
    const [lastKnownCooldownSeconds, setLastKnownCooldownSeconds] = useState<number | null>(null);
    const [likingIds, setLikingIds] = useState<Set<number>>(new Set());
    const initialLoadRef = useRef(true);
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const prevRectsRef = useRef<Map<number, DOMRect>>(new Map());
    const prevOrderRef = useRef<number[]>([]);
    const reorderAnimationsRef = useRef<Map<number, Animation>>(new Map());

    const fetchMessages = useCallback(async () => {
        try {
            const response = await getQuestionMessages(api, passcode, moduleId, authToken, {
                limit: 200,
                offset: 0,
            });
            const nextMessages = response.messages || [];
            setMessages(nextMessages);
            setSettings(response.settings || null);
            setLikingIds(
                new Set(
                    nextMessages
                        .filter((message) => message.liked_by_me)
                        .map((message) => message.id),
                ),
            );
            setError(null);
        } catch (err: unknown) {
            if (initialLoadRef.current) {
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to load questions',
                );
                setError(message);
            }
        } finally {
            if (initialLoadRef.current) {
                initialLoadRef.current = false;
                setIsLoading(false);
            }
        }
    }, [api, passcode, moduleId, authToken]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        if (!cooldownUntil || cooldownUntil <= Date.now()) {
            return;
        }
        const timer = setTimeout(() => setCooldownUntil(null), cooldownUntil - Date.now());
        return () => clearTimeout(timer);
    }, [cooldownUntil]);

    const canReply = settings?.allow_participant_answers ?? true;
    const canSendAnonymous = settings?.allow_anonymous ?? false;
    const maxLength = settings?.max_length ?? null;
    const questionLengthExceeded = maxLength !== null && questionText.length > maxLength;

    const canCreateQuestion = useMemo(() => {
        if (!settings) return true;
        if (settings.max_questions_total === null || settings.max_questions_total === undefined) return true;
        const topLevelCount = messages.filter((m) => m.parent_id === null).length;
        return topLevelCount < settings.max_questions_total;
    }, [settings, messages]);

    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => {
            const pinA = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
            const pinB = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
            if (pinA !== pinB) return pinB - pinA;
            if (a.likes_count !== b.likes_count) return b.likes_count - a.likes_count;
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
        });
    }, [messages]);

    useLayoutEffect(() => {
        const currentRects = new Map<number, DOMRect>();
        itemRefs.current.forEach((element, id) => {
            currentRects.set(id, element.getBoundingClientRect());
        });
        const currentOrder = sortedMessages.map((message) => message.id);
        const previousOrder = prevOrderRef.current;
        const hasOrderChanged =
            previousOrder.length > 0 &&
            (previousOrder.length !== currentOrder.length ||
                previousOrder.some((id, index) => id !== currentOrder[index]));

        if (hasOrderChanged && prevRectsRef.current.size > 0) {
            currentRects.forEach((currentRect, id) => {
                const previousRect = prevRectsRef.current.get(id);
                const element = itemRefs.current.get(id);
                if (!previousRect || !element) return;
                const deltaY = previousRect.top - currentRect.top;
                if (Math.abs(deltaY) < 1) return;

                const previousAnimation = reorderAnimationsRef.current.get(id);
                if (previousAnimation) {
                    previousAnimation.cancel();
                    reorderAnimationsRef.current.delete(id);
                }

                const animation = element.animate(
                    [
                        { transform: `translateY(${deltaY}px)` },
                        { transform: 'translate(0, 0)' },
                    ],
                    {
                        duration: 420,
                        easing: 'cubic-bezier(0.2, 0.85, 0.28, 1)',
                    },
                );
                reorderAnimationsRef.current.set(id, animation);
                animation.onfinish = () => {
                    reorderAnimationsRef.current.delete(id);
                };
                animation.oncancel = () => {
                    reorderAnimationsRef.current.delete(id);
                };
            });
        }

        prevRectsRef.current = currentRects;
        prevOrderRef.current = currentOrder;
    }, [sortedMessages]);

    useEffect(() => {
        return () => {
            reorderAnimationsRef.current.forEach((animation) => animation.cancel());
            reorderAnimationsRef.current.clear();
        };
    }, []);

    const isCooldown = cooldownUntil !== null && cooldownUntil > Date.now();

    const submitQuestion = useCallback(
        async (anonymous: boolean) => {
            const trimmed = questionText.trim();
            if (!trimmed || isSubmitting || isCooldown) return;
            if (settings && trimmed.length > settings.max_length) {
                setError(`Message exceeds maximum length (${settings.max_length} characters)`);
                return;
            }

            setIsSubmitting(true);
            setError(null);
            try {
                await createQuestionMessage(api, passcode, moduleId, authToken, {
                    content: trimmed,
                    is_anonymous: canSendAnonymous ? anonymous : false,
                });
                setQuestionText('');
                const cooldownSeconds =
                    settings?.cooldown_enabled && settings.cooldown_seconds
                        ? settings.cooldown_seconds
                        : lastKnownCooldownSeconds;
                if (cooldownSeconds && cooldownSeconds > 0) {
                    setCooldownUntil(Date.now() + cooldownSeconds * 1000);
                }
                await fetchMessages();
            } catch (err: unknown) {
                const fallbackSeconds = settings?.cooldown_seconds ?? lastKnownCooldownSeconds;
                const cooldownSeconds = extractCooldownSecondsFromError(err, fallbackSeconds ?? null);
                if (cooldownSeconds && cooldownSeconds > 0) {
                    setLastKnownCooldownSeconds(cooldownSeconds);
                    setCooldownUntil(Date.now() + cooldownSeconds * 1000);
                }
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to submit question',
                );
                setError(message);
            } finally {
                setIsSubmitting(false);
            }
        },
        [
            questionText,
            isSubmitting,
            isCooldown,
            settings,
            api,
            passcode,
            moduleId,
            authToken,
            canSendAnonymous,
            fetchMessages,
            lastKnownCooldownSeconds,
        ],
    );

    const handleSubmitReply = useCallback(
        async (parentId: number, anonymous: boolean = false) => {
            const trimmed = (replyText[parentId] || '').trim();
            if (!trimmed || isSubmitting || isCooldown) return;
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
                    is_anonymous: anonymous,
                });
                setReplyText((prev) => ({ ...prev, [parentId]: '' }));
                setOpenReplyId(null);
                setExpandedReplies((prev) => new Set(prev).add(parentId));
                const cooldownSeconds =
                    settings?.cooldown_enabled && settings.cooldown_seconds
                        ? settings.cooldown_seconds
                        : lastKnownCooldownSeconds;
                if (cooldownSeconds && cooldownSeconds > 0) {
                    setCooldownUntil(Date.now() + cooldownSeconds * 1000);
                }
                await fetchMessages();
            } catch (err: unknown) {
                const fallbackSeconds = settings?.cooldown_seconds ?? lastKnownCooldownSeconds;
                const cooldownSeconds = extractCooldownSecondsFromError(err, fallbackSeconds ?? null);
                if (cooldownSeconds && cooldownSeconds > 0) {
                    setLastKnownCooldownSeconds(cooldownSeconds);
                    setCooldownUntil(Date.now() + cooldownSeconds * 1000);
                }
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to submit reply',
                );
                setError(message);
            } finally {
                setIsSubmitting(false);
            }
        },
        [
            replyText,
            isSubmitting,
            isCooldown,
            settings,
            api,
            passcode,
            moduleId,
            authToken,
            fetchMessages,
            lastKnownCooldownSeconds,
        ],
    );

    const handleLike = useCallback(
        async (msgId: number) => {
            try {
                const response = await likeQuestionMessage(
                    api,
                    passcode,
                    moduleId,
                    msgId,
                    authToken,
                );
                setLikingIds((prev) => {
                    const next = new Set(prev);
                    if (response.liked_by_me) {
                        next.add(msgId);
                    } else {
                        next.delete(msgId);
                    }
                    return next;
                });
                setMessages((prev) =>
                    prev.map((message) =>
                        message.id === msgId
                            ? {
                                  ...message,
                                  likes_count: response.likes_count,
                                  liked_by_me: response.liked_by_me,
                              }
                            : message,
                    ),
                );
            } finally {
                // no-op
            }
        },
        [api, passcode, moduleId, authToken],
    );

    const toggleReplies = (messageId: number) => {
        setExpandedReplies((prev) => {
            const next = new Set(prev);
            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }
            return next;
        });
    };

    const getAuthorLabel = (name: string | null) => {
        const value = (name || '').trim();
        return value || 'Anonymous';
    };

    const handleQuestionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            void submitQuestion(false);
        }
    };

    const handleReplyKeyDown = (event: KeyboardEvent<HTMLInputElement>, messageId: number) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            void handleSubmitReply(messageId, false);
        }
    };
    const isReplyLengthExceeded = (messageId: number) =>
        maxLength !== null && (replyText[messageId] || '').length > maxLength;

    if (isLoading) {
        return (
            <Card view="outlined" className="participant-page__card participant-page__module-card">
                <Text variant="header-2">Module: Questions</Text>
                <Text variant="body-1" color="secondary">
                    Loading questions...
                </Text>
            </Card>
        );
    }

    return (
        <Card view="outlined" className="participant-page__card participant-page__module-card">
            <div className="participant-page__module-head">
                <Text variant="display-3">Questions</Text>
                <Text variant="body-1" color="secondary">
                    Here you can ask any questions you have.
                </Text>
            </div>

            {error && (
                <Text variant="body-2" color="danger">
                    {error}
                </Text>
            )}

            {canCreateQuestion ? (
                <div className="participant-page__question-compose">
                    <TextInput
                        value={questionText}
                        onUpdate={(value) => setQuestionText(value)}
                        placeholder="Ask a question"
                        size="l"
                        disabled={isSubmitting || isCooldown}
                        onKeyDown={handleQuestionKeyDown}
                    />
                    {canSendAnonymous && (
                        <Tooltip content={ANON_TOOLTIP}>
                            <Button
                                view="outlined"
                                size="l"
                                onClick={() => submitQuestion(true)}
                                disabled={isSubmitting || !questionText.trim() || isCooldown || questionLengthExceeded}
                            >
                                Send anonymously
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip content={REGULAR_TOOLTIP}>
                        <Button
                            view="action"
                            size="l"
                            onClick={() => submitQuestion(false)}
                            disabled={isSubmitting || !questionText.trim() || isCooldown || questionLengthExceeded}
                        >
                            Send
                        </Button>
                    </Tooltip>
                </div>
            ) : (
                <Text variant="body-1" color="secondary">
                    Maximum number of questions reached.
                </Text>
            )}

            {questionLengthExceeded && maxLength !== null && (
                <Text variant="body-2" color="danger">
                    Maximum length exceeded ({questionText.length}/{maxLength})
                </Text>
            )}

            {isCooldown && (
                <Text variant="body-2" color="secondary">
                    Please wait {Math.ceil((cooldownUntil! - Date.now()) / 1000)} seconds before sending another message.
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
                    sortedMessages.map((message) => {
                        const isReplyOpen = openReplyId === message.id;
                        const isRepliesExpanded = expandedReplies.has(message.id);
                        const canShowReplies = (message.children || []).length > 0;
                        const showEdgeReplyButton = canReply && (!canShowReplies || isRepliesExpanded);
                        const isPinned = Boolean(message.pinned_at);
                        const isOwnMessage = message.participant_id === participantId;

                        return (
                            <div
                                key={message.id}
                                ref={(el) => {
                                    if (el) {
                                        itemRefs.current.set(message.id, el);
                                    } else {
                                        itemRefs.current.delete(message.id);
                                    }
                                }}
                                className={`participant-page__question-item${isPinned ? ' participant-page__question-item_pinned' : ''}`}
                            >
                                <div className="participant-page__question-main">
                                    {settings?.likes_enabled && (
                                        <Button
                                            className={`participant-page__like-rail-btn${likingIds.has(message.id) ? ' participant-page__like-rail-btn_active' : ''}`}
                                            view="flat"
                                            size="xl"
                                            onClick={() => handleLike(message.id)}
                                        >
                                            <Icon data={HeartIcon as never} size={16} className="participant-page__like-icon" />
                                            <span className="participant-page__like-count">{message.likes_count}</span>
                                        </Button>
                                    )}

                                    <Text variant="body-1" className="participant-page__question-content">
                                        {message.content}
                                    </Text>
                                    <Text variant="body-2" color="secondary" className="participant-page__question-author">
                                        {getAuthorLabel(message.author_display_name)}{isOwnMessage ? ' (Yours)' : ''}
                                    </Text>

                                    {(isPinned || message.is_answered) && (
                                        <div className="participant-page__question-badges">
                                            {isPinned && (
                                                <span className="participant-page__pin-corner" aria-label="Pinned message">
                                                    <Icon data={PinFillIcon as never} size={13} />
                                                </span>
                                            )}
                                            {message.is_answered && (
                                                <Label theme="success" size="s" className="participant-page__answered-label">
                                                    Answered
                                                </Label>
                                            )}
                                        </div>
                                    )}

                                </div>

                                {showEdgeReplyButton && (
                                    <Button
                                        className="participant-page__reply-edge-btn"
                                        view="outlined"
                                        size="m"
                                        onClick={() => setOpenReplyId(isReplyOpen ? null : message.id)}
                                    >
                                        {isReplyOpen ? 'Cancel' : 'Reply'}
                                    </Button>
                                )}

                                {canShowReplies && (
                                    <div className="participant-page__replies-block">
                                        <Button view="flat" size="m" className="participant-page__replies-toggle" onClick={() => toggleReplies(message.id)}>
                                            {isRepliesExpanded ? 'Hide replies' : `Show replies (${message.children.length})`}
                                        </Button>
                                        {isRepliesExpanded && (
                                            <div className="participant-page__replies-list">
                                                {message.children.map((child) => {
                                                    const isOwnReply = child.participant_id === participantId;
                                                    return (
                                                        <div key={child.id} className="participant-page__reply-item">
                                                            <Text variant="body-2" className="participant-page__reply-content">
                                                                {child.content}
                                                            </Text>
                                                            <Text variant="body-1" color="secondary" className="participant-page__reply-author">
                                                                {getAuthorLabel(child.author_display_name)}{isOwnReply ? ' (Yours)' : ''}
                                                            </Text>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isReplyOpen && canReply && (
                                    <div className="participant-page__reply-form-wrap">
                                        <TextInput
                                            value={replyText[message.id] || ''}
                                            onUpdate={(value) => {
                                                setReplyText((prev) => ({ ...prev, [message.id]: value }));
                                            }}
                                            placeholder="Write your reply"
                                            size="l"
                                            disabled={isSubmitting || isCooldown}
                                            onKeyDown={(event) => handleReplyKeyDown(event, message.id)}
                                            className="participant-page__reply-input"
                                            endContent={
                                                <div className="participant-page__reply-input-actions">
                                                    <Button
                                                        view="flat"
                                                        size="l"
                                                        className="participant-page__reply-action-btn"
                                                        onClick={() => handleSubmitReply(message.id, true)}
                                                        disabled={isSubmitting || !(replyText[message.id] || '').trim() || isCooldown || isReplyLengthExceeded(message.id)}
                                                        title="Send anonymously"
                                                    >
                                                        <Icon data={AnonymousReplyIcon as never} size={18} />
                                                    </Button>
                                                    <Button
                                                        view="flat"
                                                        size="l"
                                                        className="participant-page__reply-action-btn"
                                                        onClick={() => handleSubmitReply(message.id, false)}
                                                        disabled={isSubmitting || !(replyText[message.id] || '').trim() || isCooldown || isReplyLengthExceeded(message.id)}
                                                        title="Send"
                                                    >
                                                        <Icon data={SendReplyIcon as never} size={18} />
                                                    </Button>
                                                </div>
                                            }
                                        />
                                        {isReplyLengthExceeded(message.id) && maxLength !== null && (
                                            <Text variant="body-2" color="danger">
                                                Maximum length exceeded ({(replyText[message.id] || '').length}/{maxLength})
                                            </Text>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
    );
}
