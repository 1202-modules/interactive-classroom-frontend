import {useDraggable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';
import {Button, Card, Icon, Label, Text} from '@gravity-ui/uikit';
import {ArrowUturnCwLeft, Pencil, TrashBin} from '@gravity-ui/icons';
import type {SessionModule} from '@/shared/types/sessionPage';
import {getModuleIcon} from '@/shared/utils/sessionModuleUtils';

type ActiveModuleCardDraggableProps = {
    module: SessionModule;
    onEdit?: () => void;
    onMoveToQueue?: () => void;
    onRemove?: () => void;
};

export function ActiveModuleCardDraggable({module, onEdit, onMoveToQueue, onRemove}: ActiveModuleCardDraggableProps) {
    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
        id: module.id,
    });

    const style = {
        transform: isDragging ? undefined : CSS.Translate.toString(transform),
        touchAction: 'none' as const,
        userSelect: 'none' as const,
    };

    const ModuleIcon = getModuleIcon(module.type);

    return (
        <Card
            ref={setNodeRef}
            view="outlined"
            className={`session-page__active-module-card session-page__module-card${isDragging ? ' session-page__active-module-card_dragging' : ''}`}
            style={style}
            {...attributes}
            {...listeners}
        >
            <div className="session-page__active-zone-content">
                <Icon data={ModuleIcon} size={24} />
                <Text variant="header-2">{module.name}</Text>
                <Label theme="success">Active</Label>
            </div>
            <div className="session-page__active-zone-actions" onClick={(e) => e.stopPropagation()}>
                <Button view="flat" size="s" onClick={onEdit} title="Edit module">
                    <Icon data={Pencil} size={14} />
                </Button>
                <Button view="outlined" size="s" onClick={onMoveToQueue} title="Move back to queue">
                    <Icon data={ArrowUturnCwLeft} size={14} />
                    To queue
                </Button>
                <Button
                    view="flat"
                    size="s"
                    onClick={onRemove}
                    title="Remove module"
                    className="session-page__active-zone-remove-btn"
                >
                    <Icon data={TrashBin} size={14} />
                </Button>
            </div>
        </Card>
    );
}
