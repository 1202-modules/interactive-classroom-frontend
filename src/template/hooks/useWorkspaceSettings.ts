import {useEffect, useMemo, useState} from 'react';
import type {WeekDay, Workspace} from '../types/workspace';
import {generateTimeOptions} from '../utils/timeOptions';
import {weekDays} from '../utils/weekDays';

export function useWorkspaceSettings(workspace: Workspace | undefined) {
    // Basic settings
    const [workspaceName, setWorkspaceName] = useState('');
    const [workspaceDescription, setWorkspaceDescription] = useState('');

    // Session defaults
    const [defaultSessionDuration, setDefaultSessionDuration] = useState<
        '30' | '60' | '90' | '120' | '240' | 'custom'
    >('60');
    const [customSessionDuration, setCustomSessionDuration] = useState('75');
    const [maxParticipants, setMaxParticipants] = useState<
        '10' | '50' | '100' | '200' | '400' | 'custom'
    >('100');
    const [customMaxParticipants, setCustomMaxParticipants] = useState('150');
    const [enableChat, setEnableChat] = useState(true);
    const [enableModeration, setEnableModeration] = useState(false);
    const [autoExpireDays, setAutoExpireDays] = useState('30');
    const [autoExpireEnabled, setAutoExpireEnabled] = useState(true);

    // Auto-start schedule
    const [autostartEnabled, setAutostartEnabled] = useState(false);
    const [autostartSchedule, setAutostartSchedule] = useState<
        Record<WeekDay, {enabled: boolean; start: string; end: string}>
    >({
        mon: {enabled: false, start: '09:00', end: '10:30'},
        tue: {enabled: false, start: '09:00', end: '10:30'},
        wed: {enabled: false, start: '09:00', end: '10:30'},
        thu: {enabled: false, start: '09:00', end: '10:30'},
        fri: {enabled: false, start: '09:00', end: '10:30'},
        sat: {enabled: false, start: '10:00', end: '12:00'},
        sun: {enabled: false, start: '10:00', end: '12:00'},
    });

    // Initialize form with workspace data
    useEffect(() => {
        if (workspace) {
            setWorkspaceName(workspace.name);
            setWorkspaceDescription(workspace.description || '');
            // TODO: Load other settings from workspace object when API provides them:
            // - defaultSessionDuration, maxParticipants, enableChat, enableModeration
            // - autoExpireDays, autoExpireEnabled, autostartEnabled, autostartSchedule
        }
    }, [workspace]);

    const setDay = (
        day: WeekDay,
        patch: Partial<{enabled: boolean; start: string; end: string}>,
    ) => {
        setAutostartSchedule((prev) => ({...prev, [day]: {...prev[day], ...patch}}));
    };

    const parseIntSafe = (value: string, fallback = 0) => {
        const n = Number.parseInt(value, 10);
        return Number.isFinite(n) ? n : fallback;
    };

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const timeOptions = useMemo(() => generateTimeOptions(), []);

    return {
        workspaceName,
        setWorkspaceName,
        workspaceDescription,
        setWorkspaceDescription,
        defaultSessionDuration,
        setDefaultSessionDuration,
        customSessionDuration,
        setCustomSessionDuration,
        maxParticipants,
        setMaxParticipants,
        customMaxParticipants,
        setCustomMaxParticipants,
        enableChat,
        setEnableChat,
        enableModeration,
        setEnableModeration,
        autoExpireDays,
        setAutoExpireDays,
        autoExpireEnabled,
        setAutoExpireEnabled,
        autostartEnabled,
        setAutostartEnabled,
        autostartSchedule,
        setAutostartSchedule,
        setDay,
        parseIntSafe,
        clamp,
        timeOptions,
        weekDays,
    };
}
