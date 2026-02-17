import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Breadcrumbs,
    Button,
    Card,
    Text,
    TextArea,
    TextInput,
} from '@gravity-ui/uikit';
import { useApi } from '@/shared/hooks/useApi';
import { PageHeader } from '@/shared/components/PageHeader';
import { SettingsCard, SessionDefaults, AutoStartSchedule } from '@/shared/components/Workspace';
import { useWorkspaceSettings } from '@/shared/hooks/useWorkspaceSettings';
import { getOrganizations } from '@/shared/api/organizations';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import './Workspace.css';

export default function CreateWorkspacePage() {
    const navigate = useNavigate();
    const api = useApi();
    const workspaceSettings = useWorkspaceSettings(undefined);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [organizations, setOrganizations] = useState<Array<{value: string; content: string}>>([]);

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const orgs = await getOrganizations(api);
                setOrganizations(orgs.map((org) => ({value: String(org.id), content: org.name})));
            } catch (err) {
                console.warn('Failed to load organizations:', err);
            }
        };
        loadOrganizations();
    }, [api]);

    const canSubmit = useMemo(() => {
        const hasName = workspaceSettings.workspaceName.trim().length > 0;
        const ssoValid =
            workspaceSettings.participantEntryMode !== 'sso' ||
            workspaceSettings.ssoOrganizationId !== null;
        return hasName && ssoValid && !isSubmitting;
    }, [
        workspaceSettings.workspaceName,
        workspaceSettings.participantEntryMode,
        workspaceSettings.ssoOrganizationId,
        isSubmitting,
    ]);


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

    const handleReset = () => {
        workspaceSettings.setWorkspaceName('');
        workspaceSettings.setWorkspaceDescription('');
        workspaceSettings.setDefaultSessionDuration('60');
        workspaceSettings.setCustomSessionDuration('75');
        workspaceSettings.setMaxParticipants('100');
        workspaceSettings.setCustomMaxParticipants('150');
        workspaceSettings.setEnableChat(true);
        workspaceSettings.setEnableModeration(false);
        workspaceSettings.setAutoExpireDays('30');
        workspaceSettings.setAutoExpireEnabled(true);
        workspaceSettings.setAutostartEnabled(false);
        workspaceSettings.setAutostartSchedule({
            mon: { enabled: false, start: '09:00', end: '10:30' },
            tue: { enabled: false, start: '09:00', end: '10:30' },
            wed: { enabled: false, start: '09:00', end: '10:30' },
            thu: { enabled: false, start: '09:00', end: '10:30' },
            fri: { enabled: false, start: '09:00', end: '10:30' },
            sat: { enabled: false, start: '10:00', end: '12:00' },
            sun: { enabled: false, start: '10:00', end: '12:00' },
        });
        workspaceSettings.setParticipantEntryMode('anonymous');
        workspaceSettings.setSsoOrganizationId(null);
        workspaceSettings.setEmailCodeDomainsWhitelist([]);
        setError(null);
    };

    const handleCreate = async () => {
        const name = workspaceSettings.workspaceName.trim();
        const description = workspaceSettings.workspaceDescription.trim();

        if (!name) {
            setError('Workspace name is required.');
            return;
        }

        // Validate SSO organization
        if (workspaceSettings.participantEntryMode === 'sso' && workspaceSettings.ssoOrganizationId === null) {
            setError('Organization is required when SSO mode is selected.');
            return;
        }

        setError(null);
        setIsSubmitting(true);
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

            const res = await api.post('/workspaces', {
                name,
                description: description.length > 0 ? description : null,
                template_settings: templateSettings,
            });

            const newId = res?.data?.id;
            if (newId) {
                navigate(`/workspace/${newId}?tab=settings`, { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        } catch (err: unknown) {
            const message = parseBackendError(
                (err as { response?: { data?: unknown } })?.response?.data,
                'Failed to create workspace. Please try again.',
            );
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="workspace-page">
            <div className="workspace-page__top">
                <Breadcrumbs>
                    <Breadcrumbs.Item onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item>Create workspace</Breadcrumbs.Item>
                </Breadcrumbs>

                <PageHeader
                    title="Create workspace"
                    subtitle="Set the basics and defaults for new sessions."
                    back={{ label: 'Back to workspaces', onClick: () => navigate('/dashboard') }}
                />
            </div>

            {error && <Alert theme="danger" title="Could not create workspace" message={error} />}

            <div className="workspace-page__section">
                <div className="workspace-page__settings-grid">
                    <SettingsCard
                        title="Basics"
                        description="Configure basic workspace settings and preferences."
                    >
                        <div className="workspace-page__settings-field">
                            <Text variant="body-1" className="workspace-page__settings-label">
                                Name
                            </Text>
                            <TextInput
                                value={workspaceSettings.workspaceName}
                                onUpdate={workspaceSettings.setWorkspaceName}
                                size="l"
                                placeholder="Enter workspace name"
                            />
                        </div>
                        <div className="workspace-page__settings-field">
                            <Text variant="body-1" className="workspace-page__settings-label">
                                Description
                            </Text>
                            <TextArea
                                value={workspaceSettings.workspaceDescription}
                                onUpdate={workspaceSettings.setWorkspaceDescription}
                                size="l"
                                placeholder="Add a description for your workspace"
                                rows={4}
                            />
                        </div>
                    </SettingsCard>

                    <SessionDefaults
                        defaultSessionDuration={workspaceSettings.defaultSessionDuration}
                        onDefaultSessionDurationChange={
                            workspaceSettings.setDefaultSessionDuration
                        }
                        customSessionDuration={workspaceSettings.customSessionDuration}
                        onCustomSessionDurationChange={
                            workspaceSettings.setCustomSessionDuration
                        }
                        maxParticipants={workspaceSettings.maxParticipants}
                        onMaxParticipantsChange={workspaceSettings.setMaxParticipants}
                        customMaxParticipants={workspaceSettings.customMaxParticipants}
                        onCustomMaxParticipantsChange={
                            workspaceSettings.setCustomMaxParticipants
                        }
                        enableChat={workspaceSettings.enableChat}
                        onEnableChatChange={workspaceSettings.setEnableChat}
                        enableModeration={workspaceSettings.enableModeration}
                        onEnableModerationChange={workspaceSettings.setEnableModeration}
                        autoExpireDays={workspaceSettings.autoExpireDays}
                        onAutoExpireDaysChange={workspaceSettings.setAutoExpireDays}
                        autoExpireEnabled={workspaceSettings.autoExpireEnabled}
                        onAutoExpireEnabledChange={workspaceSettings.setAutoExpireEnabled}
                        autostartEnabled={workspaceSettings.autostartEnabled}
                        onAutostartEnabledChange={workspaceSettings.setAutostartEnabled}
                        autostartSchedule={workspaceSettings.autostartSchedule}
                        onSetDay={workspaceSettings.setDay}
                        parseIntSafe={workspaceSettings.parseIntSafe}
                        clamp={workspaceSettings.clamp}
                        timeOptions={workspaceSettings.timeOptions}
                        weekDays={workspaceSettings.weekDays}
                        participantEntryMode={workspaceSettings.participantEntryMode}
                        onParticipantEntryModeChange={workspaceSettings.setParticipantEntryMode}
                        ssoOrganizationId={workspaceSettings.ssoOrganizationId}
                        onSsoOrganizationIdChange={workspaceSettings.setSsoOrganizationId}
                        organizations={organizations}
                        emailCodeDomainsWhitelist={workspaceSettings.emailCodeDomainsWhitelist}
                        onEmailCodeDomainsWhitelistChange={workspaceSettings.setEmailCodeDomainsWhitelist}
                    />

                    {workspaceSettings.autostartEnabled && (
                        <AutoStartSchedule
                            schedule={workspaceSettings.autostartSchedule}
                            onSetDay={workspaceSettings.setDay}
                            timeOptions={workspaceSettings.timeOptions}
                            weekDays={workspaceSettings.weekDays}
                            parseIntSafe={workspaceSettings.parseIntSafe}
                        />
                    )}

                    <Card view="outlined" className="workspace-page__settings-card">
                        <div className="workspace-page__settings-actions">
                            <Button view="outlined" size="l" onClick={handleReset}>
                                Reset to defaults
                            </Button>
                            <Button
                                view="action"
                                size="l"
                                onClick={handleCreate}
                                loading={isSubmitting}
                                disabled={!canSubmit}
                            >
                                Create workspace
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
