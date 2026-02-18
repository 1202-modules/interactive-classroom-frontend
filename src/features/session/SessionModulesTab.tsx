import type {ComponentProps} from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
} from '@dnd-kit/core';
import type {DragEndEvent, DragStartEvent} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {Button, Card, Divider, Icon, Text} from '@gravity-ui/uikit';
import {Plus} from '@gravity-ui/icons';
import type {SessionModule} from '@/shared/types/sessionPage';
import type {WorkspaceActivityModule} from '@/shared/types/workspace';
import {getModuleIcon} from '@/shared/utils/sessionModuleUtils';
import {ActiveModuleDropZone} from './ActiveModuleDropZone';
import {ModuleQueueDropZone} from './ModuleQueueDropZone';
import {RemoveQueueDropZone} from './RemoveQueueDropZone';
import {SortableModuleCard} from './SortableModuleCard';
import {WorkspaceModuleCard} from './WorkspaceModuleCard';

type SessionModulesTabProps = {
    workspaceId: string;
    sensors: ComponentProps<typeof DndContext>['sensors'];
    activeModule: SessionModule | undefined;
    queueModules: SessionModule[];
    sessionModulesLoading: boolean;
    workspaceModules: { modules: WorkspaceActivityModule[] };
    isModuleSupported: (type: SessionModule['type']) => boolean;
    activeId: string | null;
    sessionModules: SessionModule[];
    onDragStart: (event: DragStartEvent) => void;
    onDragEnd: (event: DragEndEvent) => void;
    onActivateModule: (moduleId: string) => void;
    onRemoveModule: (moduleId: string) => void;
    onDeactivateModule: () => void;
    onAddFromWorkspace: (workspaceModuleId: number) => void;
    onEditWorkspaceModule: (workspaceModuleId: number) => void;
    onEditSessionModule: (module: SessionModule) => void;
    onCreateNewModule?: () => void;
};

export function SessionModulesTab({
    workspaceId,
    sensors,
    activeModule,
    queueModules,
    sessionModulesLoading,
    workspaceModules,
    isModuleSupported,
    activeId,
    sessionModules,
    onDragStart,
    onDragEnd,
    onActivateModule,
    onRemoveModule,
    onDeactivateModule,
    onAddFromWorkspace,
    onEditWorkspaceModule,
    onEditSessionModule,
    onCreateNewModule,
}: SessionModulesTabProps) {
    const overlayModule = activeId
        ? sessionModules.find((m) => m.id === activeId)
        : null;
    const overlayWorkspaceModule = activeId?.startsWith('workspace-')
        ? workspaceModules.modules.find((m) => `workspace-${m.id}` === activeId)
        : null;
    const overlayName = overlayModule?.name ?? overlayWorkspaceModule?.name;
    const overlayType = overlayModule?.type ?? (overlayWorkspaceModule?.type as SessionModule['type']) ?? 'questions';

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="session-page__modules-grid">
                <div className="session-page__left-panel">
                    <Text variant="subheader-2">Module queue</Text>
                    <ActiveModuleDropZone
                        activeModule={activeModule}
                        onEdit={activeModule ? () => onEditSessionModule(activeModule) : undefined}
                        onMoveToQueue={activeModule ? onDeactivateModule : undefined}
                    />
                    <Text variant="body-2" color="secondary">
                        Add modules from the right, then activate one for participants.
                    </Text>
                    <Divider />
                    <ModuleQueueDropZone>
                        <SortableContext
                            items={queueModules.map((m) => m.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {queueModules.map((module) => (
                                <SortableModuleCard
                                    key={module.id}
                                    module={module}
                                    onActivate={() => onActivateModule(module.id)}
                                    onRemove={() => onRemoveModule(module.id)}
                                    onEdit={() => onEditSessionModule(module)}
                                />
                            ))}
                        </SortableContext>
                    </ModuleQueueDropZone>
                    <RemoveQueueDropZone />
                    {queueModules.length === 0 && !sessionModulesLoading && (
                        <Card view="outlined" className="session-page__empty-state">
                            <Text variant="body-1" color="secondary">
                                No modules in queue. Add from workspace modules →
                            </Text>
                        </Card>
                    )}
                </div>

                <div className="session-page__right-panel">
                    <Text variant="subheader-2">Workspace modules</Text>
                    <Text variant="body-2" color="secondary">
                        Activity modules from this workspace. Add to queue or drag to active zone.
                    </Text>
                    <div className="session-page__workspace-modules">
                        {workspaceModules.modules.map((module) => {
                            const isWip = !isModuleSupported(module.type as SessionModule['type']);
                            const queueFull = queueModules.length >= 3;
                            return (
                                <WorkspaceModuleCard
                                    key={module.id}
                                    module={module}
                                    workspaceId={workspaceId}
                                    onAdd={() => onAddFromWorkspace(module.id)}
                                    onEdit={() => onEditWorkspaceModule(module.id)}
                                    disabled={isWip}
                                    addDisabled={queueFull}
                                    isWip={isWip}
                                />
                            );
                        })}
                        {onCreateNewModule && (
                            <Button
                                view="flat"
                                size="l"
                                onClick={onCreateNewModule}
                                className="session-page__workspace-create-btn"
                            >
                                <Icon data={Plus} size={18} />
                                Create new module
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeId ? (
                    <Card view="raised" className="session-page__drag-overlay">
                        <Icon data={getModuleIcon(overlayType)} size={18} />
                        <Text variant="body-2">{overlayName}</Text>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
