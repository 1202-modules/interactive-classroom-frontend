import {useDroppable} from '@dnd-kit/core';
import {Icon, Label, Text} from '@gravity-ui/uikit';
import {CirclePlay} from '@gravity-ui/icons';
import type {SessionModule} from '@/shared/types/sessionPage';
import {getModuleIcon} from '@/shared/utils/sessionModuleUtils';

type ActiveModuleDropZoneProps = {
    activeModule: SessionModule | undefined;
};

export function ActiveModuleDropZone({activeModule}: ActiveModuleDropZoneProps) {
    const {setNodeRef, isOver} = useDroppable({
        id: 'active-module-zone',
    });

    const ModuleIcon = activeModule ? getModuleIcon(activeModule.type) : CirclePlay;

    return (
        <div
            ref={setNodeRef}
            className={`session-page__active-zone ${
                isOver ? 'session-page__active-zone_over' : ''
            } ${activeModule ? 'session-page__active-zone_filled' : ''}`}
        >
            {activeModule ? (
                <>
                    <Icon data={ModuleIcon} size={24} />
                    <Text variant="header-2">{activeModule.name}</Text>
                    <Label theme="success">Active</Label>
                </>
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
