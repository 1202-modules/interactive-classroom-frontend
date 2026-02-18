import { useState, useCallback, useEffect, useRef } from 'react';
import { useApi } from '@/shared/hooks/useApi';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import type { Workspace } from '@/shared/types/workspace';
import type { useWorkspaceSettings } from './useWorkspaceSettings';

const DEBOUNCE_MS = 500;
const FIELDS_PARAM = 'id,name,description,status,template_settings,created_at,updated_at,participant_count,session_count,has_live_session';

function buildTemplateSettings(workspaceSettings: ReturnType<typeof useWorkspaceSettings>): Record<string, unknown> {
    const getDefaultSessionDuration = () => {
        if (workspaceSettings.defaultSessionDuration === 'custom') {
            return workspaceSettings.clamp(
                workspaceSettings.parseIntSafe(workspaceSettings.customSessionDuration, 60),
                1,
                420,
            );
        }
        return Number(workspaceSettings.defaultSessionDuration);
    };
    const getMaxParticipants = () => {
        if (workspaceSettings.maxParticipants === 'custom') {
            return workspaceSettings.clamp(
                workspaceSettings.parseIntSafe(workspaceSettings.customMaxParticipants, 100),
                1,
                500,
            );
        }
        return Number(workspaceSettings.maxParticipants);
    };

    const ts: Record<string, unknown> = {
        default_session_duration_min: getDefaultSessionDuration(),
        max_participants: getMaxParticipants(),
        participant_entry_mode: workspaceSettings.participantEntryMode,
    };
    if (workspaceSettings.participantEntryMode === 'sso' && workspaceSettings.ssoOrganizationId !== null) {
        ts.sso_organization_id = workspaceSettings.ssoOrganizationId;
    }
    if (workspaceSettings.participantEntryMode === 'email_code') {
        ts.email_code_domains_whitelist = workspaceSettings.emailCodeDomainsWhitelist;
    }
    return ts;
}

function templateSettingsEqual(a: Record<string, unknown>, b: Record<string, unknown> | undefined | null): boolean {
    if (!b || typeof b !== 'object') return false;
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    for (const k of keys) {
        const va = a[k];
        const vb = b[k];
        if (Array.isArray(va) && Array.isArray(vb)) {
            if (va.length !== vb.length) return false;
            for (let i = 0; i < va.length; i++) {
                if (va[i] !== vb[i]) return false;
            }
        } else if (va !== vb) {
            return false;
        }
    }
    return true;
}

interface UseWorkspaceSaveSettingsOptions {
    workspaceId: number;
    workspace: Workspace | null;
    workspaceSettings: ReturnType<typeof useWorkspaceSettings>;
    onSuccess?: (workspace: Workspace) => void;
}

export function useWorkspaceSaveSettings({
    workspaceId,
    workspace,
    workspaceSettings,
    onSuccess,
}: UseWorkspaceSaveSettingsOptions) {
    const api = useApi();
    const [isSavingBasics, setIsSavingBasics] = useState(false);
    const [isSavingSessionDefaults, setIsSavingSessionDefaults] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialSyncRef = useRef(true);

    useEffect(() => {
        isInitialSyncRef.current = true;
    }, [workspaceId]);

    const saveSessionDefaults = useCallback(async () => {
        if (!Number.isFinite(workspaceId)) return;

        if (workspaceSettings.participantEntryMode === 'sso' && workspaceSettings.ssoOrganizationId === null) {
            setError('Organization is required when SSO mode is selected.');
            return;
        }

        setError(null);
        setIsSavingSessionDefaults(true);
        try {
            const templateSettings = buildTemplateSettings(workspaceSettings);
            const res = await api.put(
                `/workspaces/${workspaceId}`,
                { template_settings: templateSettings },
                { params: { fields: FIELDS_PARAM } }
            );
            if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0 && onSuccess) {
                onSuccess(res.data as Workspace);
            }
        } catch (err: unknown) {
            const message = parseBackendError(
                (err as { response?: { data?: unknown } })?.response?.data,
                'Failed to save session defaults.',
            );
            setError(message);
        } finally {
            setIsSavingSessionDefaults(false);
        }
    }, [workspaceId, workspaceSettings, api, onSuccess]);

    const saveBasics = useCallback(async () => {
        if (!Number.isFinite(workspaceId)) return;

        setError(null);
        setIsSavingBasics(true);
        try {
            const res = await api.put(
                `/workspaces/${workspaceId}`,
                {
                    name: workspaceSettings.workspaceName,
                    description: workspaceSettings.workspaceDescription || null,
                },
                { params: { fields: FIELDS_PARAM } }
            );
            if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0 && onSuccess) {
                onSuccess(res.data as Workspace);
            }
        } catch (err: unknown) {
            const message = parseBackendError(
                (err as { response?: { data?: unknown } })?.response?.data,
                'Failed to save workspace settings. Please try again.',
            );
            setError(message);
        } finally {
            setIsSavingBasics(false);
        }
    }, [workspaceId, workspaceSettings.workspaceName, workspaceSettings.workspaceDescription, api, onSuccess]);

    // Auto-save Session defaults when they change (debounced)
    useEffect(() => {
        if (!workspace || !Number.isFinite(workspaceId)) return;

        const templateSettings = buildTemplateSettings(workspaceSettings);
        const serverTs = (workspace.template_settings || {}) as Record<string, unknown>;

        if (isInitialSyncRef.current) {
            isInitialSyncRef.current = false;
            return;
        }

        if (templateSettingsEqual(templateSettings, serverTs)) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
            saveSessionDefaults();
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [
        workspaceId,
        workspace?.id,
        workspace?.template_settings,
        workspaceSettings.defaultSessionDuration,
        workspaceSettings.customSessionDuration,
        workspaceSettings.maxParticipants,
        workspaceSettings.customMaxParticipants,
        workspaceSettings.participantEntryMode,
        workspaceSettings.ssoOrganizationId,
        workspaceSettings.emailCodeDomainsWhitelist,
        saveSessionDefaults,
    ]);

    return {
        isSaving: isSavingBasics || isSavingSessionDefaults,
        isSavingBasics,
        error,
        saveBasics,
        saveSessionDefaults,
    };
}
