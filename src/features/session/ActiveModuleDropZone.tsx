import {useDroppable} from '@dnd-kit/core';
import {Icon, Text} from '@gravity-ui/uikit';
import {CirclePlay} from '@gravity-ui/icons';
import type {SessionModule} from '@/shared/types/sessionPage';
import {ActiveModuleCardDraggable} from './ActiveModuleCardDraggable';

type ActiveModuleDropZoneProps = {
    activeModule: SessionModule | undefined;
    onEdit?: () => void;
    onMoveToQueue?: () => void;
    onRemove?: () => void;
};

export function ActiveModuleDropZone({activeModule, onEdit, onMoveToQueue, onRemove}: ActiveModuleDropZoneProps) {
    const {setNodeRef, isOver} = useDroppable({
        id: 'active-module-zone',
    });

    return (
        <div
            ref={setNodeRef}
            className={`session-page__active-zone ${
                isOver ? 'session-page__active-zone_over' : ''
            } ${activeModule ? 'session-page__active-zone_filled' : ''}`}
        >
            {activeModule ? (
                <ActiveModuleCardDraggable
                    module={activeModule}
                    onEdit={onEdit}
                    onMoveToQueue={onMoveToQueue}
                    onRemove={onRemove}
                />
            ) : (
                <>
                    <Icon data={CirclePlay} size={32} />
                    <Text variant="body-1" color="secondary">
                        Drag a module here to activate
                    </Text>
                </>
            )}
        </div>
    );
}
