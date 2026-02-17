import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Breadcrumbs,
    Label,
    Tab,
    TabList,
    TabProvider,
} from '@gravity-ui/uikit';
import type { ActivityModuleType, Workspace, WorkspaceActivityModule, WorkspaceTab } from '@/shared/types/workspace';
import { useApi } from '@/shared/hooks/useApi';
import { useWorkspaceModules } from '@/shared/hooks/useWorkspaceModules';
import { useWorkspaceSessions } from '@/shared/hooks/useWorkspaceSessions';
import { useWorkspaceSettings } from '@/shared/hooks/useWorkspaceSettings';
import { useModuleForm } from '@/shared/hooks/useModuleForm';
import { useCreateSession } from '@/shared/hooks/useCreateSession';
import { useWorkspaceSaveSettings } from '@/shared/hooks/useWorkspaceSaveSettings';
import { getOrganizations } from '@/shared/api/organizations';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import { PageHeader } from '@/shared/components/PageHeader';
import { WorkspaceNotFound } from './WorkspaceNotFound';
import { WorkspaceLoading } from './WorkspaceLoading';
import { WorkspaceSessionsTab } from './WorkspaceSessionsTab';
import { WorkspaceSettingsTab } from './WorkspaceSettingsTab';
import { WorkspaceModulesTab } from './WorkspaceModulesTab';
import { CreateSessionDialog } from './CreateSessionDialog';
import { RenameModuleDialog } from './RenameModuleDialog';
import './Workspace.css';

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

    const workspaceId = Number(id);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);
    const [workspaceLoading, setWorkspaceLoading] = useState(false);
    const [organizations, setOrganizations] = useState<Array<{value: string; content: string}>>([]);
    const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
    const [editModule, setEditModule] = useState<{type: ActivityModuleType; module: WorkspaceActivityModule} | null>(null);

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
            } catch (err: unknown) {
                if (cancelled) return;
                const axiosErr = err as { response?: { status?: number; data?: unknown } };
                const status = axiosErr?.response?.status;
                const message = parseBackendError(
                    axiosErr?.response?.data,
                    'Failed to load workspace',
                );
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
    const workspaceModules = useWorkspaceModules(workspaceId);
    const workspaceSessions = useWorkspaceSessions(workspaceId);
    const moduleForm = useModuleForm(
        workspaceModules.createModuleType,
        workspaceModules.isCreateModuleOpen,
        workspaceModules.createModuleType,
    );
    const editModuleForm = useModuleForm(
        editModule?.type || 'questions',
        isEditModuleOpen,
        editModule?.type,
        editModule?.module,
    );

    const createSession = useCreateSession({
        workspaceId,
        api,
        onSuccess: (session) => session && workspaceSessions.addSession(session),
    });

    const saveSettings = useWorkspaceSaveSettings({
        workspaceId,
        workspaceSettings,
        onSuccess: setWorkspace,
    });

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

    const handleEditModuleOpen = (module: WorkspaceActivityModule) => {
        setEditModule({type: module.type, module});
        setIsEditModuleOpen(true);
    };

    const handleEditModuleClose = () => {
        setIsEditModuleOpen(false);
        setEditModule(null);
    };

    const handleEditModuleSave = async () => {
        if (!editModule || !Number.isFinite(workspaceId)) return;
        const config = editModuleForm.getModuleConfig();
        try {
            await api.put(`/workspaces/${workspaceId}/modules/${editModule.module.id}`, {
                name: editModuleForm.moduleName,
                module_type: editModule.type,
                settings: {
                    ...config,
                    description: editModuleForm.moduleDescription,
                    enabled: editModuleForm.moduleEnabled,
                },
            });
            const updated: WorkspaceActivityModule = {
                ...editModule.module,
                name: editModuleForm.moduleName,
                description: editModuleForm.moduleDescription,
                enabled: editModuleForm.moduleEnabled,
                config,
                updated_at: new Date().toISOString(),
            };
            workspaceModules.replaceModule(updated);
        } catch (err) {
            console.error('Failed to update module:', err);
        }
        handleEditModuleClose();
    };

    if (!Number.isFinite(workspaceId) || (!workspace && !workspaceLoading)) {
        return <WorkspaceNotFound error={workspaceError} />;
    }

    if (workspaceLoading || !workspace) {
        return <WorkspaceLoading />;
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
                <PageHeader
                    title={workspace.name}
                    subtitle={workspace.description || 'No description'}
                    back={{ label: 'Back to workspaces', onClick: () => navigate('/dashboard') }}
                    meta={
                        <>
                            <Label theme="info" size="m">
                                {workspace.participant_count} participants
                            </Label>
                            <Label theme="utility" size="m">
                                {workspace.session_count} sessions
                            </Label>
                        </>
                    }
                />
            </div>

            <TabProvider
                value={activeTab}
                onUpdate={(value: string) => {
                    const next = (value as WorkspaceTab) || 'sessions';
                    setSearchParams((prev: URLSearchParams) => {
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

            {activeTab === 'sessions' && (
                <WorkspaceSessionsTab
                    workspaceId={workspaceId}
                    workspaceSessions={workspaceSessions}
                    onCreateSession={createSession.open}
                    onNavigate={(wId, sId) => navigate(`/workspace/${wId}/session/${sId}`)}
                />
            )}
            {activeTab === 'settings' && (
                <WorkspaceSettingsTab
                    workspaceSettings={workspaceSettings}
                    organizations={organizations}
                    settingsError={saveSettings.error}
                    isSavingSettings={saveSettings.isSaving}
                    onSave={saveSettings.save}
                />
            )}
            {activeTab === 'modules' && (
                <WorkspaceModulesTab
                    workspaceId={workspaceId}
                    workspaceModules={workspaceModules}
                    moduleForm={moduleForm}
                    isModulesLoading={isModulesLoading}
                    isEditModuleOpen={isEditModuleOpen}
                    editModule={editModule}
                    editModuleForm={editModuleForm}
                    onEditModuleOpen={handleEditModuleOpen}
                    onEditModuleClose={handleEditModuleClose}
                    onEditModuleSave={handleEditModuleSave}
                />
            )}

            <CreateSessionDialog
                open={createSession.isOpen}
                onClose={createSession.close}
                name={createSession.name}
                description={createSession.description}
                error={createSession.error}
                isLoading={createSession.isLoading}
                onNameChange={createSession.setName}
                onDescriptionChange={createSession.setDescription}
                onSubmit={createSession.submit}
                nameInputId="create-session-name"
                descriptionInputId="create-session-description"
            />

            <RenameModuleDialog
                open={workspaceModules.renameModuleId != null}
                onClose={workspaceModules.closeRenameModule}
                value={workspaceModules.renameValue}
                onValueChange={workspaceModules.setRenameValue}
                onConfirm={workspaceModules.confirmRenameModule}
            />
        </div>
    );
}
