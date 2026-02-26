import {Card, Button, Icon, Label, Text} from '@gravity-ui/uikit';
import {Bars, Clock, Pencil, Plus} from '@gravity-ui/icons';
import {useDraggable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';
import type {WorkspaceActivityModule} from '@/shared/types/workspace';
import type {SessionModule} from '@/shared/types/sessionPage';
import {getModuleIcon} from '@/shared/utils/sessionModuleUtils';

type WorkspaceModuleCardProps = {
    module: WorkspaceActivityModule;
    workspaceId: string;
    onAdd: () => void;
    onEdit: () => void;
    disabled?: boolean;
    /** When true, Add button is disabled (e.g. queue full) but card remains draggable */
    addDisabled?: boolean;
    isWip?: boolean;
};

export function WorkspaceModuleCard({
    module,
    workspaceId: _workspaceId,
    onAdd,
    onEdit,
    disabled,
    addDisabled,
    isWip,
}: WorkspaceModuleCardProps) {
    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
        id: `workspace-${module.id}`,
        disabled: Boolean(disabled),
    });

    const style = {
        transform: isDragging ? undefined : CSS.Translate.toString(transform),
        touchAction: 'none' as const,
        userSelect: 'none' as const,
    };

    const ModuleIcon = getModuleIcon(module.type as SessionModule['type']);

    return (
        <Card
            ref={setNodeRef}
            view="outlined"
            className={`session-page__workspace-module-card${isDragging ? ' session-page__workspace-module-card_dragging' : ''}`}
            style={style}
            {...attributes}
            {...listeners}
        >
            <div className="session-page__workspace-module-main">
                <div className="session-page__workspace-module-drag">
                    <Icon data={Bars} size={14} />
                </div>
                <div className="session-page__workspace-module-info">
                    <div className="session-page__workspace-module-header">
                        <Icon data={ModuleIcon} size={18} />
                        <Text variant="body-2">{module.name}</Text>
                        {isWip && (
                            <Label theme="warning" size="s" className="workspace-page__wip-label">
                                <span className="workspace-page__wip-icon-wrapper">
                                    <Icon data={Clock} size={14} />
                                </span>
                                <span>WIP</span>
                            </Label>
                        )}
                    </div>
                    {module.description ? (
                        <Text variant="body-2" color="secondary" className="session-page__workspace-module-desc">
                            {module.description}
                        </Text>
                    ) : null}
                </div>
            </div>
            <div className="session-page__workspace-module-actions" onClick={(e) => e.stopPropagation()}>
                <Button view="flat" size="s" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit in workspace">
                    <Icon data={Pencil} size={14} />
                </Button>
                <Button view="outlined" size="s" onClick={(e) => { e.stopPropagation(); onAdd(); }} disabled={disabled || addDisabled}>
                    <Icon data={Plus} size={14} />
                    Add
                </Button>
            </div>
        </Card>
    );
}
