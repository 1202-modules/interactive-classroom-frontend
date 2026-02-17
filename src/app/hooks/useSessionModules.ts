import {useState} from 'react';
import type {DragEndEvent, DragStartEvent} from '@dnd-kit/core';
import {arrayMove} from '@dnd-kit/sortable';
import type {SessionDetail, SessionModule} from '../types/sessionPage';

export function useSessionModules(initialSessionDetail: SessionDetail) {
    const [sessionDetail, setSessionDetail] = useState<SessionDetail>(initialSessionDetail);
    const [activeId, setActiveId] = useState<string | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        setActiveId(null);

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = sessionDetail.session_modules.findIndex((m) => m.id === active.id);
        const newIndex = sessionDetail.session_modules.findIndex((m) => m.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newModules = arrayMove(sessionDetail.session_modules, oldIndex, newIndex);
            const reorderedModules = newModules.map((m, idx) => ({...m, order: idx}));

            // If dropped on active zone, activate the module
            const isActiveZone = over.id === 'active-module-zone';
            const activeModuleId = isActiveZone
                ? (active.id as string)
                : sessionDetail.active_module_id;

            setSessionDetail((prev) => ({
                ...prev,
                session_modules: reorderedModules,
                active_module_id: activeModuleId,
            }));
        }
    };

    const activateModule = (moduleId: string) => {
        setSessionDetail((prev) => ({
            ...prev,
            active_module_id: moduleId,
        }));
    };

    const removeModule = (moduleId: string) => {
        setSessionDetail((prev) => ({
            ...prev,
            session_modules: prev.session_modules.filter((m) => m.id !== moduleId),
            active_module_id: prev.active_module_id === moduleId ? null : prev.active_module_id,
        }));
    };

    const addModule = (module: SessionModule) => {
        const maxOrder = Math.max(...sessionDetail.session_modules.map((m) => m.order), -1);
        setSessionDetail((prev) => ({
            ...prev,
            session_modules: [...prev.session_modules, {...module, order: maxOrder + 1}],
        }));
    };

    return {
        sessionDetail,
        setSessionDetail,
        activeId,
        handleDragStart,
        handleDragEnd,
        activateModule,
        removeModule,
        addModule,
    };
}
