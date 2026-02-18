import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/shared/hooks/useApi';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import type { Session } from '@/shared/types/session';
import type { AxiosInstance } from 'axios';

interface UseCreateSessionOptions {
    workspaceId: number;
    api: AxiosInstance;
    onSuccess?: (session: Session | null) => void | Promise<void>;
}

function normalizeCreatedSession(data: Partial<Session> & { id: number }, workspaceId: number): Session {
    return {
        id: data.id,
        workspace_id: workspaceId,
        name: data.name ?? '',
        description: data.description ?? null,
        status: data.status ?? 'active',
        is_stopped: data.is_stopped ?? true,
        participant_count: data.participant_count ?? 0,
        created_at: data.created_at ?? new Date().toISOString(),
        updated_at: data.updated_at ?? new Date().toISOString(),
        is_deleted: data.is_deleted ?? false,
    };
}

export type CreateSessionSettings = {
    defaultSessionDuration: '30' | '60' | '90' | '120' | '240' | 'custom';
    customSessionDuration: string;
    maxParticipants: '10' | '50' | '100' | '200' | '400' | 'custom';
    customMaxParticipants: string;
    participantEntryMode: 'anonymous' | 'registered' | 'sso' | 'email_code';
    ssoOrganizationId: number | null;
    emailCodeDomainsWhitelist: string[];
};

const defaultSessionSettings: CreateSessionSettings = {
    defaultSessionDuration: '60',
    customSessionDuration: '60',
    maxParticipants: '50',
    customMaxParticipants: '50',
    participantEntryMode: 'anonymous',
    ssoOrganizationId: null,
    emailCodeDomainsWhitelist: [],
};

export function useCreateSession({ workspaceId, api, onSuccess }: UseCreateSessionOptions) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [sessionSettings, setSessionSettings] = useState<CreateSessionSettings | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback((initialSettings?: CreateSessionSettings) => {
        setError(null);
        setName('');
        setSessionSettings(initialSettings ?? defaultSessionSettings);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        if (isLoading) return;
        setIsOpen(false);
        setError(null);
        /* Keep name and sessionSettings until next open so the dialog doesn't flash to "just Name" during close animation */
    }, [isLoading]);

    const focusField = useCallback((fieldId: string) => {
        window.requestAnimationFrame(() => {
            const el = document.getElementById(fieldId) as
                | HTMLInputElement
                | HTMLTextAreaElement
                | null;
            el?.focus();
        });
    }, []);

    const submit = useCallback(async () => {
        const trimmedName = name.trim();

        if (trimmedName.length === 0) {
            setError('Session name is required.');
            focusField('create-session-name');
            return;
        }
        if (trimmedName.length > 200) {
            setError('Session name must be 200 characters or fewer.');
            focusField('create-session-name');
            return;
        }

        setError(null);
        setIsLoading(true);
        try {
            // Build settings object from sessionSettings if provided
            const settings: Record<string, unknown> | undefined = sessionSettings ? {
                default_session_duration_min: sessionSettings.defaultSessionDuration === 'custom'
                    ? Number.parseInt(sessionSettings.customSessionDuration, 10) || 90
                    : Number.parseInt(sessionSettings.defaultSessionDuration, 10),
                max_participants: sessionSettings.maxParticipants === 'custom'
                    ? Number.parseInt(sessionSettings.customMaxParticipants, 10) || 100
                    : Number.parseInt(sessionSettings.maxParticipants, 10),
                participant_entry_mode: sessionSettings.participantEntryMode,
                ...(sessionSettings.participantEntryMode === 'sso' && sessionSettings.ssoOrganizationId !== null
                    ? {sso_organization_id: sessionSettings.ssoOrganizationId}
                    : {}),
                ...(sessionSettings.participantEntryMode === 'email_code' && sessionSettings.emailCodeDomainsWhitelist.length > 0
                    ? {email_code_domains_whitelist: sessionSettings.emailCodeDomainsWhitelist}
                    : {}),
            } : undefined;

            const res = await api.post<Session>(`/workspaces/${workspaceId}/sessions`, {
                name: trimmedName,
                ...(settings ? {settings} : {}),
            });
            const created = res?.data ?? null;
            const newSessionId = created?.id;
            close();
            if (onSuccess && created?.id) {
                await onSuccess(normalizeCreatedSession(created as Partial<Session> & { id: number }, workspaceId));
            }
            if (newSessionId) {
                navigate(`/workspace/${workspaceId}/session/${newSessionId}`);
            }
        } catch (err: unknown) {
            const message = parseBackendError(
                (err as { response?: { data?: unknown } })?.response?.data,
                'Failed to create session. Please try again.',
            );
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [name, sessionSettings, workspaceId, api, navigate, close, onSuccess, focusField]);

    return {
        name,
        sessionSettings,
        setSessionSettings,
        error,
        isLoading,
        isOpen,
        setName,
        open,
        close,
        submit,
    };
}
