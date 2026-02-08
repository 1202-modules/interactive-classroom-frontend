import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Breadcrumbs,
    Button,
    Card,
    Dialog,
    Icon,
    Label,
    Skeleton,
    Tab,
    TabList,
    TabProvider,
    Text,
    TextArea,
    TextInput,
} from '@gravity-ui/uikit';
import { ArrowLeft } from '@gravity-ui/icons';
import type { Workspace, WorkspaceTab } from '../../types/workspace';
import { useApi } from '@/hooks/useApi';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { useWorkspaceModules } from '../../hooks/useWorkspaceModules';
import { useWorkspaceSessions } from '../../hooks/useWorkspaceSessions';
import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useModuleForm } from '../../hooks/useModuleForm';
import { SessionCard } from '../../components/Workspace/SessionCard/SessionCard';
import { SessionFilters } from '../../components/Workspace/SessionFilters/SessionFilters';
import { ModuleCluster } from '../../components/Workspace/ModuleCluster/ModuleCluster';
import { CreateModuleDialog } from '../../components/Workspace/CreateModuleDialog/CreateModuleDialog';
import { SettingsCard } from '../../components/Workspace/SettingsCard/SettingsCard';
import { SessionDefaults } from '../../components/Workspace/SessionDefaults/SessionDefaults';
import { AutoStartSchedule } from '../../components/Workspace/AutoStartSchedule/AutoStartSchedule';
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

function getTabFromSearchParams(params: URLSearchParams): WorkspaceTab {
    const tab = params.get('tab');
    if (tab === 'settings') return 'settings';
    if (tab === 'modules') return 'modules';
    return 'sessions';
}

export default function WorkspacePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const api = useApi();

    const nameInputId = 'create-session-name';
    const descriptionInputId = 'create-session-description';
    const focusField = (fieldId: string) => {
        window.requestAnimationFrame(() => {
            const el = document.getElementById(fieldId) as
                | HTMLInputElement
                | HTMLTextAreaElement
                | null;
            el?.focus();
        });
    };

    const workspaceId = Number(id);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);
    const [workspaceLoading, setWorkspaceLoading] = useState(false);

    useEffect(() => {
        if (!Number.isFinite(workspaceId)) return;
        let cancelled = false;
        const fetchWorkspace = async () => {
            setWorkspaceLoading(true);
            setWorkspaceError(null);
            try {
                const res = await api.get<Workspace>(`/workspaces/${workspaceId}`);
                if (!cancelled) {
                    setWorkspace(res.data);
                }
            } catch (err: any) {
                if (cancelled) return;
                const status = err?.response?.status;
                const detail = err?.response?.data?.detail || err?.response?.data;
                const message = typeof detail === 'string' ? detail : 'Failed to load workspace';
                setWorkspaceError(message);
                if (status === 404) setWorkspace(null);
            } finally {
                if (!cancelled) setWorkspaceLoading(false);
            }
        };
        fetchWorkspace();
        return () => {
            cancelled = true;
        };
    }, [api, workspaceId]);

    // Use hooks for state management
    const workspaceSettings = useWorkspaceSettings(workspace || undefined);
    const workspaceModules = useWorkspaceModules(workspaceId); // Pass workspaceId for future API integration
    const workspaceSessions = useWorkspaceSessions(workspaceId);
    const moduleForm = useModuleForm(
        workspaceModules.createModuleType,
        workspaceModules.isCreateModuleOpen,
        workspaceModules.createModuleType,
    );

    const [activeTab, setActiveTab] = useState<WorkspaceTab>(() =>
        getTabFromSearchParams(searchParams),
    );

    useEffect(() => {
        setActiveTab(getTabFromSearchParams(searchParams));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.toString()]);

    const [isModulesLoading, setIsModulesLoading] = useState(false);
    useEffect(() => {
        if (activeTab !== 'modules') return;
        setIsModulesLoading(true);
        const timer = window.setTimeout(() => {
            setIsModulesLoading(false);
        }, 200);
        return () => window.clearTimeout(timer);
    }, [activeTab]);

    const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
    const [createSessionName, setCreateSessionName] = useState('');
    const [createSessionDescription, setCreateSessionDescription] = useState('');
    const [createSessionError, setCreateSessionError] = useState<string | null>(null);
    const [isCreateSessionLoading, setIsCreateSessionLoading] = useState(false);

    const parseBackendError = (data: BackendError | string | undefined, fallback: string) => {
        if (!data) return fallback;
        if (typeof data === 'string') return data;
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail) && data.detail.length > 0) {
            return data.detail[0].msg || fallback;
        }
        return fallback;
    };

    const openCreateSession = () => {
        setCreateSessionError(null);
        setIsCreateSessionOpen(true);
    };

    const closeCreateSession = () => {
        if (isCreateSessionLoading) return;
        setIsCreateSessionOpen(false);
        setCreateSessionError(null);
        setCreateSessionName('');
        setCreateSessionDescription('');
    };

    const handleCreateSession = async () => {
        const name = createSessionName.trim();
        const description = createSessionDescription.trim();

        if (name.length === 0) {
            setCreateSessionError('Session name is required.');
            focusField(nameInputId);
            return;
        }
        if (name.length > 200) {
            setCreateSessionError('Session name must be 200 characters or fewer.');
            focusField(nameInputId);
            return;
        }
        if (description.length > 1000) {
            setCreateSessionError('Session description must be 1000 characters or fewer.');
            focusField(descriptionInputId);
            return;
        }

        setCreateSessionError(null);
        setIsCreateSessionLoading(true);
        try {
            const res = await api.post(`/workspaces/${workspaceId}/sessions`, {
                name,
                description: description.length > 0 ? description : null,
            });
            const newSessionId = res?.data?.id;
            closeCreateSession();
            await workspaceSessions.refetch();
            if (newSessionId) {
                navigate(`/workspace/${workspaceId}/session/${newSessionId}`);
            }
        } catch (err: any) {
            const message = parseBackendError(
                err?.response?.data,
                'Failed to create session. Please try again.',
            );
            setCreateSessionError(message);
        } finally {
            setIsCreateSessionLoading(false);
        }
    };

    if (!Number.isFinite(workspaceId) || (!workspace && !workspaceLoading)) {
        return (
            <div className="workspace-page">
                <div className="workspace-page__top">
                    <Breadcrumbs>
                        <Breadcrumbs.Item onClick={() => navigate('/dashboard')}>
                            Dashboard
                        </Breadcrumbs.Item>
                        <Breadcrumbs.Item>Workspace</Breadcrumbs.Item>
                    </Breadcrumbs>
                </div>

                <Alert
                    theme="warning"
                    title="Workspace not found"
                    message={workspaceError || 'This workspace does not exist (or isn’t available).'}
                />
                <div className="workspace-page__notfound-actions">
                    <Button view="action" size="l" onClick={() => navigate('/dashboard')}>
                        <Icon data={ArrowLeft} size={18} />
                        Back to dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (workspaceLoading || !workspace) {
        return (
            <div className="workspace-page">
                <div className="workspace-page__top">
                    <Breadcrumbs>
                        <Breadcrumbs.Item onClick={() => navigate('/dashboard')}>
                            Dashboard
                        </Breadcrumbs.Item>
                        <Breadcrumbs.Item>Workspace</Breadcrumbs.Item>
                    </Breadcrumbs>
                </div>
                <Card view="outlined" className="workspace-page__skeleton">
                    <Skeleton style={{ width: '60%', height: 28, borderRadius: 8 }} />
                    <Skeleton style={{ width: '80%', height: 16, borderRadius: 6, marginTop: 8 }} />
                </Card>
            </div>
        );
    }

    return (
        <div className="workspace-page">
            <div className="workspace-page__top">
                <div className="workspace-page__breadcrumbs">
                    <Breadcrumbs>
                        <Breadcrumbs.Item onClick={() => navigate('/dashboard')}>
                            Dashboard
                        </Breadcrumbs.Item>
                        <Breadcrumbs.Item>{workspace.name}</Breadcrumbs.Item>
                    </Breadcrumbs>
                </div>

                <div className="workspace-page__header">
                    <div className="workspace-page__title">
                        <Button
                            view="flat"
                            size="l"
                            onClick={() => navigate('/dashboard')}
                            className="workspace-page__back-button"
                        >
                            <Icon data={ArrowLeft} size={16} />
                            Back to workspaces
                        </Button>
                        <Text variant="display-2" as="h1" ellipsis>
                            {workspace.name}
                        </Text>
                        <div className="workspace-page__title-row">
                            {workspace.description ? (
                                <Text
                                    variant="body-2"
                                    color="secondary"
                                    className="workspace-page__subtitle"
                                >
                                    {workspace.description}
                                </Text>
                            ) : (
                                <Text
                                    variant="body-2"
                                    color="hint"
                                    className="workspace-page__subtitle"
                                >
                                    No description
                                </Text>
                            )}
                        </div>
                    </div>
                    <div className="workspace-page__meta">
                        <Label theme="info" size="m">
                            {workspace.participant_count} participants
                        </Label>
                        <Label theme="utility" size="m">
                            {workspace.session_count} sessions
                        </Label>
                    </div>
                </div>

                <TabProvider
                    value={activeTab}
                    onUpdate={(value) => {
                        const next = (value as WorkspaceTab) || 'sessions';
                        setSearchParams((prev) => {
                            const nextParams = new URLSearchParams(prev);
                            nextParams.set('tab', next);
                            return nextParams;
                        });
                    }}
                >
                    <TabList className="workspace-page__tabs">
                        <Tab value="sessions">Sessions</Tab>
                        <Tab value="settings">Workspace Settings</Tab>
                        <Tab value="modules">Activity Modules</Tab>
                    </TabList>
                </TabProvider>
            </div>

            {activeTab === 'sessions' ? (
                <div className="workspace-page__section">
                    <SessionFilters
                        query={workspaceSessions.sessionQuery}
                        onQueryChange={workspaceSessions.setSessionQuery}
                        status={workspaceSessions.sessionStatus}
                        onStatusChange={workspaceSessions.startSessionFilterTransition}
                        onCreateSession={openCreateSession}
                    />

                    <div
                        className="workspace-page__list"
                        aria-busy={workspaceSessions.isSessionsLoading || undefined}
                    >
                        {workspaceSessions.isSessionsLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <Card key={i} view="outlined" className="workspace-session">
                                    <div className="workspace-session__main">
                                        <div className="workspace-session__name">
                                            <Skeleton
                                                style={{ width: '55%', height: 18, borderRadius: 6 }}
                                            />
                                        </div>
                                        <div className="workspace-session__sub">
                                            <Skeleton
                                                style={{ width: 120, height: 14, borderRadius: 6 }}
                                            />
                                        </div>
                                    </div>
                                    <div className="workspace-session__side">
                                        <Skeleton
                                            style={{ width: 90, height: 18, borderRadius: 9 }}
                                        />
                                        <Skeleton
                                            style={{ width: 36, height: 36, borderRadius: 10 }}
                                        />
                                    </div>
                                </Card>
                            ))
                        ) : workspaceSessions.filteredSessions.length === 0 ? (
                            <Card view="outlined" className="workspace-page__empty">
                                <Text variant="body-1" color="secondary">
                                    No sessions here yet. Try changing the filter or creating a new
                                    session.
                                </Text>
                            </Card>
                        ) : (
                            workspaceSessions.filteredSessions.map((s) => (
                                <SessionCard
                                    key={s.id}
                                    session={s}
                                    workspaceId={workspaceId}
                                    onNavigate={(wId, sId) =>
                                        navigate(`/workspace/${wId}/session/${sId}`)
                                    }
                                    onToggleStartStop={workspaceSessions.toggleStartStop}
                                    onMoveSession={workspaceSessions.moveSession}
                                    onDelete={workspaceSessions.setDeleteSessionId}
                                    isUpdating={workspaceSessions.updatingSessionId === s.id}
                                />
                            ))
                        )}
                    </div>

                    <ConfirmDialog
                        open={workspaceSessions.deleteSessionId != null}
                        title="Delete permanently?"
                        message="This action cannot be undone."
                        cancelText="Cancel"
                        confirmText="Delete permanently"
                        onCancel={workspaceSessions.closeDeleteDialog}
                        onConfirm={workspaceSessions.confirmDeletePermanently}
                    />
                </div>
            ) : activeTab === 'settings' ? (
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
                        <div className="workspace-page__settings-actions">
                            <Button view="outlined" size="l">
                                Reset to defaults
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="workspace-page__section">
                    <Card view="outlined" className="workspace-page__settings-card">
                        <div className="workspace-page__settings-head">
                            <Text variant="subheader-2">Activity Modules</Text>
                            <Text variant="body-2" color="secondary">
                                Configure reusable activity modules here, then attach them to
                                sessions.
                            </Text>
                        </div>

                        {isModulesLoading ? (
                            <div className="workspace-page__modules-skeleton">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Card
                                        key={i}
                                        view="outlined"
                                        className="workspace-page__modules-cluster workspace-page__modules-cluster_skeleton"
                                    >
                                        <div className="workspace-page__modules-cluster-head">
                                            <Skeleton
                                                style={{ width: 160, height: 18, borderRadius: 6 }}
                                            />
                                            <Skeleton
                                                style={{ width: 260, height: 14, borderRadius: 6 }}
                                            />
                                        </div>
                                        <div className="workspace-page__modules-cards">
                                            <Skeleton
                                                style={{
                                                    width: '100%',
                                                    height: 108,
                                                    borderRadius: 12,
                                                }}
                                            />
                                            <Skeleton
                                                style={{
                                                    width: '100%',
                                                    height: 108,
                                                    borderRadius: 12,
                                                }}
                                            />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="workspace-page__modules">
                                {(
                                    [
                                        {
                                            type: 'questions' as const,
                                            title: 'Questions',
                                            subtitle:
                                                'Collect questions and let participants upvote.',
                                        },
                                        {
                                            type: 'poll' as const,
                                            title: 'Poll',
                                            subtitle: 'Gather opinions with flexible answer modes.',
                                        },
                                        {
                                            type: 'quiz' as const,
                                            title: 'Quiz',
                                            subtitle: 'Run quizzes with options and time limits.',
                                        },
                                        {
                                            type: 'timer' as const,
                                            title: 'Timer',
                                            subtitle:
                                                'Keep activities on time with a shared countdown.',
                                        },
                                    ] as const
                                ).map((cluster) => {
                                    const typeModules = workspaceModules.modules.filter(
                                        (x) => x.type === cluster.type,
                                    );
                                    return (
                                        <ModuleCluster
                                            key={cluster.type}
                                            type={cluster.type}
                                            title={cluster.title}
                                            subtitle={cluster.subtitle}
                                            modules={typeModules}
                                            onOpenDetails={workspaceModules.openModuleDetails}
                                            onToggleEnabled={workspaceModules.toggleModuleEnabled}
                                            onRename={workspaceModules.openRenameModule}
                                            onDuplicate={workspaceModules.duplicateModule}
                                            onDelete={workspaceModules.setDeleteModuleId}
                                            onCreate={workspaceModules.openCreateModule}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    <CreateModuleDialog
                        open={workspaceModules.isCreateModuleOpen}
                        onClose={workspaceModules.closeCreateModule}
                        moduleType={workspaceModules.createModuleType}
                        formState={moduleForm}
                        onCreate={() => {
                            const config = moduleForm.getModuleConfig();
                            workspaceModules.createModule(
                                workspaceModules.createModuleType,
                                moduleForm.moduleName,
                                moduleForm.moduleDescription,
                                moduleForm.moduleEnabled,
                                config,
                            );
                            workspaceModules.closeCreateModule();
                        }}
                    />

                    <Dialog
                        open={workspaceModules.renameModuleId != null}
                        onClose={workspaceModules.closeRenameModule}
                        size="s"
                        className="workspace-page__module-rename-dialog"
                    >
                        <Dialog.Header caption="Rename module" />
                        <Dialog.Body>
                            <div className="workspace-page__module-form">
                                <div className="workspace-page__module-form-field">
                                    <Text
                                        variant="body-1"
                                        className="workspace-page__settings-label"
                                    >
                                        New name
                                    </Text>
                                    <TextInput
                                        value={workspaceModules.renameValue}
                                        onUpdate={workspaceModules.setRenameValue}
                                        size="l"
                                        placeholder="Module name"
                                    />
                                </div>
                            </div>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button view="flat" onClick={workspaceModules.closeRenameModule}>
                                Cancel
                            </Button>
                            <Button view="action" onClick={workspaceModules.confirmRenameModule}>
                                Rename
                            </Button>
                        </Dialog.Footer>
                    </Dialog>

                    <ConfirmDialog
                        open={workspaceModules.deleteModuleId != null}
                        title="Delete permanently?"
                        message="This action cannot be undone."
                        cancelText="Cancel"
                        confirmText="Delete permanently"
                        onCancel={() => workspaceModules.setDeleteModuleId(null)}
                        onConfirm={() =>
                            workspaceModules.deleteModule(workspaceModules.deleteModuleId!)
                        }
                    />
                </div>
            )}

            <Dialog
                open={isCreateSessionOpen}
                onClose={closeCreateSession}
                size="s"
                className="workspace-page__module-rename-dialog"
            >
                <Dialog.Header caption="Create session" />
                <Dialog.Body>
                    {createSessionError && (
                        <Alert
                            theme="danger"
                            title="Could not create session"
                            message={createSessionError}
                        />
                    )}
                    <div className="workspace-page__module-form">
                        <div className="workspace-page__module-form-field">
                            <Text variant="body-1" className="workspace-page__settings-label">
                                Name
                            </Text>
                            <TextInput
                                id={nameInputId}
                                value={createSessionName}
                                onUpdate={setCreateSessionName}
                                size="l"
                                placeholder="Session name"
                            />
                        </div>
                        <div className="workspace-page__module-form-field">
                            <Text variant="body-1" className="workspace-page__settings-label">
                                Description
                            </Text>
                            <TextArea
                                id={descriptionInputId}
                                value={createSessionDescription}
                                onUpdate={setCreateSessionDescription}
                                size="l"
                                rows={4}
                                placeholder="Optional description"
                            />
                        </div>
                    </div>
                </Dialog.Body>
                <Dialog.Footer>
                    <Button view="flat" onClick={closeCreateSession} disabled={isCreateSessionLoading}>
                        Cancel
                    </Button>
                    <Button
                        view="action"
                        onClick={handleCreateSession}
                        loading={isCreateSessionLoading}
                        disabled={createSessionName.trim().length === 0}
                    >
                        Create session
                    </Button>
                </Dialog.Footer>
            </Dialog>
        </div>
    );
}
