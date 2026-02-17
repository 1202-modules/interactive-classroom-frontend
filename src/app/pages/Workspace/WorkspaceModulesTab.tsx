import { Alert, Card, Skeleton, Text } from '@gravity-ui/uikit';
import { ModuleCluster } from './ModuleCluster/ModuleCluster';
import { CreateModuleDialog } from './CreateModuleDialog/CreateModuleDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import type { ActivityModuleType, WorkspaceActivityModule } from '../../types/workspace';
import type { useWorkspaceModules } from '../../hooks/useWorkspaceModules';
import type { useModuleForm } from '../../hooks/useModuleForm';

const MODULE_CLUSTERS = [
    {
        type: 'questions' as const,
        title: 'Questions',
        subtitle: 'Collect questions and let participants upvote.',
        isWip: false,
    },
    {
        type: 'poll' as const,
        title: 'Poll',
        subtitle: 'Gather opinions with flexible answer modes.',
        isWip: true,
    },
    {
        type: 'quiz' as const,
        title: 'Quiz',
        subtitle: 'Run quizzes with options and time limits.',
        isWip: true,
    },
    {
        type: 'timer' as const,
        title: 'Timer',
        subtitle: 'Keep activities on time with a shared countdown.',
        isWip: false,
    },
] as const;

interface WorkspaceModulesTabProps {
    workspaceId: number;
    workspaceModules: ReturnType<typeof useWorkspaceModules>;
    moduleForm: ReturnType<typeof useModuleForm>;
    isModulesLoading: boolean;
    isEditModuleOpen: boolean;
    editModule: {type: ActivityModuleType; module: WorkspaceActivityModule} | null;
    editModuleForm: ReturnType<typeof useModuleForm>;
    onEditModuleOpen: (module: WorkspaceActivityModule) => void;
    onEditModuleClose: () => void;
    onEditModuleSave: () => Promise<void>;
}

export function WorkspaceModulesTab({
    workspaceId,
    workspaceModules,
    moduleForm,
    isModulesLoading,
    isEditModuleOpen,
    editModule,
    editModuleForm,
    onEditModuleOpen,
    onEditModuleClose,
    onEditModuleSave,
}: WorkspaceModulesTabProps) {
    return (
        <div className="workspace-page__section">
            <Card view="outlined" className="workspace-page__settings-card">
                <div className="workspace-page__settings-head">
                    <Text variant="subheader-2">Activity Modules</Text>
                    <Text variant="body-2" color="secondary">
                        Configure reusable activity modules here, then attach them to sessions.
                    </Text>
                </div>

                {isModulesLoading || workspaceModules.isLoading ? (
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
                        {workspaceModules.error && (
                            <Alert
                                theme="danger"
                                title="Failed to load modules"
                                message={workspaceModules.error}
                            />
                        )}
                        {MODULE_CLUSTERS.map((cluster) => {
                            const typeModules = workspaceModules.modules.filter(
                                (x) => x.type === cluster.type,
                            );
                            return (
                                <ModuleCluster
                                    key={cluster.type}
                                    type={cluster.type}
                                    title={cluster.title}
                                    subtitle={cluster.subtitle}
                                    isWip={cluster.isWip}
                                    modules={typeModules}
                                    onOpenDetails={(moduleId) => {
                                        const module = typeModules.find((m) => m.id === moduleId);
                                        if (module && (module.type === 'questions' || module.type === 'timer')) {
                                            onEditModuleOpen(module);
                                        } else {
                                            workspaceModules.openModuleDetails(moduleId);
                                        }
                                    }}
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

            <CreateModuleDialog
                open={isEditModuleOpen}
                onClose={onEditModuleClose}
                moduleType={editModule?.type || 'questions'}
                formState={editModuleForm}
                isEdit={true}
                onCreate={onEditModuleSave}
            />

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
    );
}
