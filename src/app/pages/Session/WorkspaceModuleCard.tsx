import {Card, Button, Icon, Label, Text} from '@gravity-ui/uikit';
import {Bars, Clock, Plus} from '@gravity-ui/icons';
import {useDraggable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';
import type {WorkspaceActivityModule} from '../../types/workspace';
import type {SessionModule} from '../../types/sessionPage';
import {getModuleIcon} from '../../utils/sessionModuleUtils';

type WorkspaceModuleCardProps = {
    module: WorkspaceActivityModule;
    onAdd: () => void;
    disabled?: boolean;
    isWip?: boolean;
};

export function WorkspaceModuleCard({module, onAdd, disabled, isWip}: WorkspaceModuleCardProps) {
    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
        id: `workspace-${module.id}`,
        disabled: Boolean(disabled),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.6 : 1,
    };

    const ModuleIcon = getModuleIcon(module.type as SessionModule['type']);

    return (
        <Card
            ref={setNodeRef}
            view="outlined"
            className="session-page__workspace-module-card"
            style={style}
        >
            <div className="session-page__workspace-module-header">
                <div className="session-page__workspace-module-drag" {...attributes} {...listeners}>
                    <Icon data={Bars} size={14} />
                </div>
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
            <Button view="outlined" size="s" onClick={onAdd} disabled={disabled}>
                <Icon data={Plus} size={14} />
                Add
            </Button>
        </Card>
    );
}
