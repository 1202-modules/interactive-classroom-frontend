import {useDroppable} from '@dnd-kit/core';
import {Icon, Text} from '@gravity-ui/uikit';
import {TrashBin} from '@gravity-ui/icons';

export function RemoveQueueDropZone() {
    const {setNodeRef, isOver} = useDroppable({
        id: 'remove-queue-zone',
    });

    return (
        <div
            ref={setNodeRef}
            className={`session-page__remove-zone ${isOver ? 'session-page__remove-zone_over' : ''}`}
        >
            <Icon data={TrashBin} size={18} />
            <Text variant="body-2" color="secondary">
                Drag here to remove from queue
            </Text>
        </div>
    );
}
