import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Breadcrumbs,
    Button,
    Card,
    Icon,
    Text,
    TextArea,
    TextInput,
} from '@gravity-ui/uikit';
import { ArrowLeft } from '@gravity-ui/icons';
import { useApi } from '@/hooks/useApi';
import { SettingsCard } from '../../components/Workspace/SettingsCard/SettingsCard';
import { SessionDefaults } from '../../components/Workspace/SessionDefaults/SessionDefaults';
import { AutoStartSchedule } from '../../components/Workspace/AutoStartSchedule/AutoStartSchedule';
import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import './Workspace.css';

type ValidationDetail = {
    type: string;
    loc: (string | number)[];
    msg: string;
    input: unknown;
    ctx?: Record<string, unknown>;
};

type BackendError = {
    detail?: string | ValidationDetail[];
};

export default function CreateWorkspacePage() {
    const navigate = useNavigate();
    const api = useApi();
    const workspaceSettings = useWorkspaceSettings(undefined);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        return workspaceSettings.workspaceName.trim().length > 0 && !isSubmitting;
    }, [workspaceSettings.workspaceName, isSubmitting]);

    const parseBackendError = (data: BackendError | string | undefined, fallback: string) => {
        if (!data) return fallback;
        if (typeof data === 'string') return data;
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail) && data.detail.length > 0) {
            return data.detail[0].msg || fallback;
        }
        return fallback;
    };

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
        setError(null);
    };

    const handleCreate = async () => {
        const name = workspaceSettings.workspaceName.trim();
        const description = workspaceSettings.workspaceDescription.trim();

        if (!name) {
            setError('Workspace name is required.');
            return;
        }

        setError(null);
        setIsSubmitting(true);
        try {
            const res = await api.post('/workspaces', {
                name,
                description: description.length > 0 ? description : null,
                template_settings: {
                    poll_duration: 30,
                    default_session_duration: getDefaultSessionDuration(),
                    max_participants_per_session: getMaxParticipants(),
                },
            });

            const newId = res?.data?.id;
            if (newId) {
                navigate(`/template/workspace/${newId}?tab=settings`, { replace: true });
            } else {
                navigate('/template/dashboard', { replace: true });
            }
        } catch (err: any) {
            const message = parseBackendError(
                err?.response?.data,
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
                    <Breadcrumbs.Item onClick={() => navigate('/template/dashboard')}>
                        Dashboard
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item>Create workspace</Breadcrumbs.Item>
                </Breadcrumbs>

                <div className="workspace-page__header">
                    <div className="workspace-page__title">
                        <Button
                            view="flat"
                            size="l"
                            onClick={() => navigate('/template/dashboard')}
                            className="workspace-page__back-button"
                        >
                            <Icon data={ArrowLeft} size={16} />
                            Back to workspaces
                        </Button>
                        <Text variant="display-2" as="h1">
                            Create workspace
                        </Text>
                        <Text variant="body-2" color="secondary" className="workspace-page__subtitle">
                            Set the basics and defaults for new sessions.
                        </Text>
                    </div>
                </div>
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
