import {useDroppable} from '@dnd-kit/core';
import type {ReactNode} from 'react';

type ModuleQueueDropZoneProps = {
    children: ReactNode;
};

export function ModuleQueueDropZone({children}: ModuleQueueDropZoneProps) {
    const {setNodeRef, isOver} = useDroppable({
        id: 'module-queue-zone',
    });

    return (
        <div
            ref={setNodeRef}
            className={`session-page__modules-drop ${
                isOver ? 'session-page__modules-drop_over' : ''
            }`}
        >
            {children}
        </div>
    );
}
