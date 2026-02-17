import type {ComponentProps} from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
} from '@dnd-kit/core';
import type {DragEndEvent, DragStartEvent} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {Card, Divider, Icon, Text} from '@gravity-ui/uikit';
import type {SessionModule} from '../../types/sessionPage';
import type {WorkspaceActivityModule} from '../../types/workspace';
import {getModuleIcon} from '../../utils/sessionModuleUtils';
import {ActiveModuleDropZone} from './ActiveModuleDropZone';
import {ModuleQueueDropZone} from './ModuleQueueDropZone';
import {SortableModuleCard} from './SortableModuleCard';
import {WorkspaceModuleCard} from './WorkspaceModuleCard';

type SessionModulesTabProps = {
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
    onAddFromWorkspace: (workspaceModuleId: number) => void;
};

export function SessionModulesTab({
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
    onAddFromWorkspace,
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
                    <Text variant="header-2">Session Modules</Text>
                    <ActiveModuleDropZone activeModule={activeModule} />
                    <Divider />
                    <div className="session-page__modules-list">
                        <Text variant="subheader-1">Module Queue</Text>
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
                                    />
                                ))}
                            </SortableContext>
                        </ModuleQueueDropZone>
                        {queueModules.length === 0 && !sessionModulesLoading && (
                            <Card view="outlined" className="session-page__empty-state">
                                <Text variant="body-1" color="secondary">
                                    No modules in queue. Add from workspace modules →
                                </Text>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="session-page__right-panel">
                    <Text variant="header-2">Workspace Modules</Text>
                    <Text variant="body-1" color="secondary">
                        Add configured modules to this session
                    </Text>
                    <div className="session-page__workspace-modules">
                        {workspaceModules.modules.map((module) => {
                            const isWip = !isModuleSupported(module.type as SessionModule['type']);
                            return (
                                <WorkspaceModuleCard
                                    key={module.id}
                                    module={module}
                                    onAdd={() => onAddFromWorkspace(module.id)}
                                    disabled={isWip}
                                    isWip={isWip}
                                />
                            );
                        })}
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
