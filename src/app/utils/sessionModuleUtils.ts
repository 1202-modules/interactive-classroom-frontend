import type {SessionModule, SessionModuleApi} from '../types/sessionPage';
import {
    CircleQuestion,
    Clock,
    ListCheck,
    Square,
} from '@gravity-ui/icons';
export function getSessionModuleType(value: unknown): SessionModule['type'] {
    if (value === 'questions' || value === 'poll' || value === 'quiz' || value === 'timer') {
        return value;
    }
    return 'questions';
}

export function mapSessionModule(module: SessionModuleApi, index: number): SessionModule {
    const settings = module.settings ?? {};
    return {
        id: String(module.id),
        module_id: Number((settings as {workspace_module_id?: number}).workspace_module_id ?? 0),
        order: index,
        is_active: module.is_active,
        name: module.name ?? 'Untitled module',
        type: getSessionModuleType(module.module_type),
        config: settings,
    };
}

export function getModuleIcon(type: SessionModule['type']) {
    switch (type) {
        case 'questions':
            return CircleQuestion;
        case 'poll':
            return Square;
        case 'quiz':
            return ListCheck;
        case 'timer':
            return Clock;
        default:
            return CircleQuestion;
    }
}
