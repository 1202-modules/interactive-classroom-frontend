import {Card, Button, Icon, Label, Text} from '@gravity-ui/uikit';
import {Bars, CirclePlay, Pencil, TrashBin} from '@gravity-ui/icons';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import type {SessionModule} from '@/shared/types/sessionPage';
import {getModuleIcon} from '@/shared/utils/sessionModuleUtils';

type SortableModuleCardProps = {
    module: SessionModule;
    onActivate: () => void;
    onRemove: () => void;
};

export function SortableModuleCard({module, onActivate, onRemove}: SortableModuleCardProps) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: module.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const ModuleIcon = getModuleIcon(module.type);

    return (
        <Card
            ref={setNodeRef}
            style={style}
            view="outlined"
            className={`session-page__module-card ${
                module.is_active ? 'session-page__module-card_active' : ''
            }`}
            {...attributes}
            {...listeners}
        >
            <div className="session-page__module-card-header">
                <div className="session-page__module-card-drag">
                    <Icon data={Bars} size={16} />
                </div>
                <Icon data={ModuleIcon} size={18} />
                <Text variant="body-2">{module.name}</Text>
                {module.is_active && (
                    <Label theme="success" size="s">
                        Active
                    </Label>
                )}
            </div>
            <div className="session-page__module-card-actions">
                {!module.is_active && (
                    <Button view="outlined-success" size="s" onClick={onActivate}>
                        <Icon data={CirclePlay} size={14} />
                        Activate
                    </Button>
                )}
                <Button view="flat" size="s">
                    <Icon data={Pencil} size={14} />
                </Button>
                <Button view="flat" size="s" onClick={onRemove}>
                    <Icon data={TrashBin} size={14} />
                </Button>
            </div>
        </Card>
    );
}
