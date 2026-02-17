import {CircleQuestion, Clock, ListCheck, Square} from '@gravity-ui/icons';
import type {ActivityModuleType} from '../types/workspace';
import type {SessionModule} from '../types/sessionPage';

export function getModuleIcon(type: ActivityModuleType | SessionModule['type']) {
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
