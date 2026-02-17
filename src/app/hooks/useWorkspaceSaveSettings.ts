import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { parseBackendError } from '@/utils/parseBackendError';
import type { useWorkspaceSettings } from './useWorkspaceSettings';

interface UseWorkspaceSaveSettingsOptions {
    workspaceId: number;
    workspaceSettings: ReturnType<typeof useWorkspaceSettings>;
    onSuccess?: (workspace: any) => void;
}

export function useWorkspaceSaveSettings({
    workspaceId,
    workspaceSettings,
    onSuccess,
}: UseWorkspaceSaveSettingsOptions) {
    const api = useApi();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getDefaultSessionDuration = useCallback(() => {
        if (workspaceSettings.defaultSessionDuration === 'custom') {
            return workspaceSettings.clamp(
                workspaceSettings.parseIntSafe(workspaceSettings.customSessionDuration, 60),
                1,
                420,
            );
        }
        return Number(workspaceSettings.defaultSessionDuration);
    }, [workspaceSettings]);

    const getMaxParticipants = useCallback(() => {
        if (workspaceSettings.maxParticipants === 'custom') {
            return workspaceSettings.clamp(
                workspaceSettings.parseIntSafe(workspaceSettings.customMaxParticipants, 100),
                1,
                500,
            );
        }
        return Number(workspaceSettings.maxParticipants);
    }, [workspaceSettings]);

    const save = useCallback(async () => {
        if (!Number.isFinite(workspaceId)) return;

        // Validate SSO organization
        if (workspaceSettings.participantEntryMode === 'sso' && workspaceSettings.ssoOrganizationId === null) {
            setError('Organization is required when SSO mode is selected.');
            return;
        }

        setError(null);
        setIsSaving(true);
        try {
            const templateSettings: Record<string, unknown> = {
                default_session_duration_min: getDefaultSessionDuration(),
                max_participants: getMaxParticipants(),
                participant_entry_mode: workspaceSettings.participantEntryMode,
            };

            if (workspaceSettings.participantEntryMode === 'sso' && workspaceSettings.ssoOrganizationId !== null) {
                templateSettings.sso_organization_id = workspaceSettings.ssoOrganizationId;
            }

            if (workspaceSettings.participantEntryMode === 'email_code') {
                templateSettings.email_code_domains_whitelist = workspaceSettings.emailCodeDomainsWhitelist;
            }

            const res = await api.put(`/workspaces/${workspaceId}`, {
                name: workspaceSettings.workspaceName,
                description: workspaceSettings.workspaceDescription || null,
                template_settings: templateSettings,
            });

            if (res.data && onSuccess) {
                onSuccess(res.data);
            }
        } catch (err: any) {
            const message = parseBackendError(
                err?.response?.data,
                'Failed to save workspace settings. Please try again.',
            );
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }, [
        workspaceId,
        workspaceSettings,
        getDefaultSessionDuration,
        getMaxParticipants,
        api,
        onSuccess,
    ]);

    return {
        isSaving,
        error,
        save,
    };
}
