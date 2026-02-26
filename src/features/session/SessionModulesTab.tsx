import type {ComponentProps} from 'react';
import {
    DndContext,
    DragOverlay,
    pointerWithin,
} from '@dnd-kit/core';
import type {DragEndEvent, DragStartEvent} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {Button, Card, Divider, Icon, Text} from '@gravity-ui/uikit';
import {Bars, CirclePlay, Pencil, Plus, TrashBin} from '@gravity-ui/icons';
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
    activeId: string | null;
    activeDragSize: {width: number; height: number} | null;
    sessionModulesLoading: boolean;
    workspaceModules: { modules: WorkspaceActivityModule[] };
    isModuleSupported: (type: SessionModule['type']) => boolean;
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
    activeId,
    activeDragSize,
    sessionModulesLoading,
    workspaceModules,
    isModuleSupported,
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
    const verticalOnlyModifier = ({
        transform,
    }: {
        transform: {x: number; y: number; scaleX: number; scaleY: number};
    }) => ({
        ...transform,
        x: 0,
    });

    const modifiers = activeId && !activeId.startsWith('workspace-') ? [verticalOnlyModifier] : undefined;

    const draggedSessionModule =
        activeId && !activeId.startsWith('workspace-')
            ? [activeModule, ...queueModules].find((module) => module?.id === activeId)
            : undefined;
    const draggedWorkspaceModule =
        activeId && activeId.startsWith('workspace-')
            ? workspaceModules.modules.find((module) => `workspace-${module.id}` === activeId)
            : undefined;
    const draggedModuleName = draggedSessionModule?.name ?? draggedWorkspaceModule?.name;
    const draggedModuleType =
        draggedSessionModule?.type ??
        (draggedWorkspaceModule?.type as SessionModule['type'] | undefined);
    const DraggedModuleIcon = draggedModuleType ? getModuleIcon(draggedModuleType) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            modifiers={modifiers}
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
                        onRemove={activeModule ? () => onRemoveModule(activeModule.id) : undefined}
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

            <DragOverlay zIndex={2000} className="session-page__drag-overlay-wrapper">
                {draggedModuleName && DraggedModuleIcon ? (
                    draggedSessionModule ? (
                        <Card
                            view="outlined"
                            className="session-page__drag-overlay session-page__module-card"
                            style={activeDragSize ? {width: activeDragSize.width, minHeight: activeDragSize.height} : undefined}
                        >
                            <div className="session-page__module-card-header">
                                <div className="session-page__module-card-drag">
                                    <Icon data={Bars} size={16} />
                                </div>
                                <Icon data={DraggedModuleIcon} size={18} />
                                <Text variant="body-2">{draggedModuleName}</Text>
                            </div>
                            <div className="session-page__module-card-actions">
                                <Button view="outlined-success" size="s" disabled>
                                    <Icon data={CirclePlay} size={14} />
                                    To active
                                </Button>
                                <Button view="flat" size="s" disabled>
                                    <Icon data={Pencil} size={14} />
                                </Button>
                                <Button view="flat" size="s" disabled>
                                    <Icon data={TrashBin} size={14} />
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card
                            view="outlined"
                            className="session-page__drag-overlay session-page__workspace-module-card"
                            style={activeDragSize ? {width: activeDragSize.width, minHeight: activeDragSize.height} : undefined}
                        >
                            <div className="session-page__workspace-module-main">
                                <div className="session-page__workspace-module-drag">
                                    <Icon data={Bars} size={14} />
                                </div>
                                <div className="session-page__workspace-module-info">
                                    <div className="session-page__workspace-module-header">
                                        <Icon data={DraggedModuleIcon} size={18} />
                                        <Text variant="body-2">{draggedModuleName}</Text>
                                    </div>
                                    {draggedWorkspaceModule?.description ? (
                                        <Text variant="body-2" color="secondary" className="session-page__workspace-module-desc">
                                            {draggedWorkspaceModule.description}
                                        </Text>
                                    ) : null}
                                </div>
                            </div>
                            <div className="session-page__workspace-module-actions">
                                <Button view="flat" size="s" disabled>
                                    <Icon data={Pencil} size={14} />
                                </Button>
                                <Button view="outlined" size="s" disabled>
                                    <Icon data={Plus} size={14} />
                                    Add
                                </Button>
                            </div>
                        </Card>
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
