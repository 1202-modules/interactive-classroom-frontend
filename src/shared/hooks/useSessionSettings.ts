import {useCallback, useEffect, useMemo, useState} from 'react';
import type {WeekDay} from '@/shared/types/workspace';
import type {SessionInfo} from '@/shared/types/sessionPage';
import {generateTimeOptions} from '@/shared/utils/timeOptions';
import {weekDays} from '@/shared/utils/weekDays';
import {useApi} from '@/shared/hooks/useApi';
import {parseBackendError} from '@/shared/utils/parseBackendError';

function buildSessionSettingsPayload(state: {
    defaultSessionDuration: string;
    customSessionDuration: string;
    maxParticipants: string;
    customMaxParticipants: string;
    participantEntryMode: string;
    ssoOrganizationId: number | null;
    emailCodeDomainsWhitelist: string[];
    parseIntSafe: (value: string, fallback?: number) => number;
    clamp: (value: number, min: number, max: number) => number;
}): Record<string, unknown> {
    const getDefaultSessionDuration = () => {
        if (state.defaultSessionDuration === 'custom') {
            return state.clamp(
                state.parseIntSafe(state.customSessionDuration, 60),
                1,
                420,
            );
        }
        return Number(state.defaultSessionDuration);
    };
    const getMaxParticipants = () => {
        if (state.maxParticipants === 'custom') {
            return state.clamp(
                state.parseIntSafe(state.customMaxParticipants, 100),
                1,
                500,
            );
        }
        return Number(state.maxParticipants);
    };
    const payload: Record<string, unknown> = {
        default_session_duration_min: getDefaultSessionDuration(),
        max_participants: getMaxParticipants(),
        participant_entry_mode: state.participantEntryMode,
    };
    if (state.participantEntryMode === 'sso' && state.ssoOrganizationId !== null) {
        payload.sso_organization_id = state.ssoOrganizationId;
    }
    if (state.participantEntryMode === 'email_code') {
        payload.email_code_domains_whitelist = state.emailCodeDomainsWhitelist;
    }
    return payload;
}

export function useSessionSettings(
    sessionId: number,
    sessionInfo: SessionInfo | null,
    options?: { onSaved?: () => void },
) {
    const api = useApi();
    const onSaved = options?.onSaved;

    const [sessionName, setSessionName] = useState('');
    const [sessionDescription, setSessionDescription] = useState('');

    const [defaultSessionDuration, setDefaultSessionDuration] = useState<
        '30' | '60' | '90' | '120' | '240' | 'custom'
    >('90');
    const [customSessionDuration, setCustomSessionDuration] = useState('75');
    const [maxParticipants, setMaxParticipants] = useState<
        '10' | '50' | '100' | '200' | '400' | 'custom'
    >('100');
    const [customMaxParticipants, setCustomMaxParticipants] = useState('150');
    const [enableChat, setEnableChat] = useState(true);
    const [enableModeration, setEnableModeration] = useState(false);
    const [autoExpireDays, setAutoExpireDays] = useState('30');
    const [autoExpireEnabled, setAutoExpireEnabled] = useState(true);
    const [participantEntryMode, setParticipantEntryMode] = useState<
        'anonymous' | 'registered' | 'sso' | 'email_code'
    >('anonymous');
    const [ssoOrganizationId, setSsoOrganizationId] = useState<number | null>(null);
    const [emailCodeDomainsWhitelist, setEmailCodeDomainsWhitelist] = useState<string[]>([]);
    const [autostartEnabled, setAutostartEnabled] = useState(false);
    const [autostartSchedule, setAutostartSchedule] = useState<
        Record<WeekDay, {enabled: boolean; start: string; end: string}>
    >({
        mon: {enabled: false, start: '09:00', end: '10:30'},
        tue: {enabled: false, start: '09:00', end: '10:30'},
        wed: {enabled: false, start: '09:00', end: '10:30'},
        thu: {enabled: false, start: '09:00', end: '10:30'},
        fri: {enabled: false, start: '09:00', end: '10:30'},
        sat: {enabled: false, start: '10:00', end: '12:00'},
        sun: {enabled: false, start: '10:00', end: '12:00'},
    });

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (sessionInfo) {
            setSessionName(sessionInfo.name);
            setSessionDescription(sessionInfo.description ?? '');

            const ts = (sessionInfo.settings || {}) as Record<string, unknown>;
            const duration = ts.default_session_duration_min;
            if (typeof duration === 'number') {
                if ([30, 60, 90, 120, 240].includes(duration)) {
                    setDefaultSessionDuration(String(duration) as '30' | '60' | '90' | '120' | '240');
                } else {
                    setDefaultSessionDuration('custom');
                    setCustomSessionDuration(String(duration));
                }
            }
            const maxParts = ts.max_participants;
            if (typeof maxParts === 'number') {
                if ([10, 50, 100, 200, 400].includes(maxParts)) {
                    setMaxParticipants(String(maxParts) as '10' | '50' | '100' | '200' | '400');
                } else {
                    setMaxParticipants('custom');
                    setCustomMaxParticipants(String(maxParts));
                }
            }
            const entryMode = ts.participant_entry_mode;
            if (typeof entryMode === 'string' && ['anonymous', 'registered', 'sso', 'email_code'].includes(entryMode)) {
                setParticipantEntryMode(entryMode as 'anonymous' | 'registered' | 'sso' | 'email_code');
            }
            const ssoOrgId = ts.sso_organization_id;
            if (typeof ssoOrgId === 'number') {
                setSsoOrganizationId(ssoOrgId);
            }
            const emailDomains = ts.email_code_domains_whitelist;
            if (Array.isArray(emailDomains)) {
                setEmailCodeDomainsWhitelist(emailDomains.filter((d): d is string => typeof d === 'string'));
            }
        }
    }, [sessionInfo]);

    const setDay = useCallback(
        (day: WeekDay, patch: Partial<{enabled: boolean; start: string; end: string}>) => {
            setAutostartSchedule((prev) => ({...prev, [day]: {...prev[day], ...patch}}));
        },
        [],
    );

    const parseIntSafe = useCallback((value: string, fallback = 0) => {
        const n = Number.parseInt(value, 10);
        return Number.isFinite(n) ? n : fallback;
    }, []);

    const clamp = useCallback((value: number, min: number, max: number) => {
        return Math.min(max, Math.max(min, value));
    }, []);

    const timeOptions = useMemo(() => generateTimeOptions(), []);

    const saveSession = useCallback(async () => {
        if (!Number.isFinite(sessionId)) return;
        if (participantEntryMode === 'sso' && ssoOrganizationId === null) {
            setError('Organization is required when SSO mode is selected.');
            return;
        }
        setError(null);
        setIsSaving(true);
        try {
            const settings = buildSessionSettingsPayload({
                defaultSessionDuration,
                customSessionDuration,
                maxParticipants,
                customMaxParticipants,
                participantEntryMode,
                ssoOrganizationId,
                emailCodeDomainsWhitelist,
                parseIntSafe,
                clamp,
            });
            await api.put(`/sessions/${sessionId}`, {
                name: sessionName.trim() || undefined,
                description: sessionDescription.trim() || null,
                settings,
            });
            onSaved?.();
        } catch (err: unknown) {
            const message = parseBackendError(
                (err as {response?: {data?: unknown}})?.response?.data,
                'Failed to save session settings.',
            );
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }, [
        sessionId,
        sessionName,
        sessionDescription,
        defaultSessionDuration,
        customSessionDuration,
        maxParticipants,
        customMaxParticipants,
        participantEntryMode,
        ssoOrganizationId,
        emailCodeDomainsWhitelist,
        api,
        parseIntSafe,
        clamp,
        onSaved,
    ]);

    return {
        sessionName,
        setSessionName,
        sessionDescription,
        setSessionDescription,
        defaultSessionDuration,
        setDefaultSessionDuration,
        customSessionDuration,
        setCustomSessionDuration,
        maxParticipants,
        setMaxParticipants,
        customMaxParticipants,
        setCustomMaxParticipants,
        enableChat,
        setEnableChat,
        enableModeration,
        setEnableModeration,
        autoExpireDays,
        setAutoExpireDays,
        autoExpireEnabled,
        setAutoExpireEnabled,
        autostartEnabled,
        setAutostartEnabled,
        autostartSchedule,
        setAutostartSchedule,
        participantEntryMode,
        setParticipantEntryMode,
        ssoOrganizationId,
        setSsoOrganizationId,
        emailCodeDomainsWhitelist,
        setEmailCodeDomainsWhitelist,
        setDay,
        parseIntSafe,
        clamp,
        timeOptions,
        weekDays,
        saveSession,
        isSaving,
        error,
    };
}
