import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {DragEndEvent, DragStartEvent} from '@dnd-kit/core';
import {arrayMove} from '@dnd-kit/sortable';

import type {Participant, SessionInfo, SessionModule, SessionModuleApi} from '@/shared/types/sessionPage';
import type {WorkspaceActivityModule} from '@/shared/types/workspace';
import {mapSessionModule} from '@/shared/utils/sessionModuleUtils';
import {useSessionSettings} from './useSessionSettings';
import {useWorkspaceModules} from './useWorkspaceModules';
import {useApi} from '@/shared/hooks/useApi';
import {SESSION_FIELDS, SESSION_MODULE_FIELDS, fieldsToString} from '@/shared/api/fields';
import {getParticipantsBySessionId} from '@/shared/api/sessionParticipants';

export type MainTab = 'modules' | 'inspect' | 'settings';

function isModuleSupported(type: SessionModule['type']) {
    return type === 'questions' || type === 'timer';
}

export function useSessionDetail() {
    const {workspaceId, sessionId} = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const workspaceIdNumber = Number(workspaceId);
    const sessionIdNumber = Number(sessionId);
    const isSessionIdValid = Number.isFinite(sessionIdNumber);

    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const [sessionModules, setSessionModules] = useState<SessionModule[]>([]);
    const [sessionLoading, setSessionLoading] = useState(false);
    const [sessionModulesLoading, setSessionModulesLoading] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activeParticipantsCount, setActiveParticipantsCount] = useState(0);
    const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
    const [mainTab, setMainTab] = useState<MainTab>('modules');
    const [participantSearch, setParticipantSearch] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragSize, setActiveDragSize] = useState<{width: number; height: number} | null>(null);

    const workspaceModules = useWorkspaceModules(workspaceIdNumber);

    const fetchSessionInfo = useCallback(async (options?: {silent?: boolean}) => {
        if (!isSessionIdValid) return;
        if (!options?.silent) {
            setSessionLoading(true);
        }
        try {
            const res = await api.get<SessionInfo>(`/sessions/${sessionIdNumber}`, {
                params: {fields: fieldsToString(SESSION_FIELDS.DETAILS)},
            });
            setSessionInfo(res.data);
        } catch {
            setSessionInfo(null);
        } finally {
            if (!options?.silent) {
                setSessionLoading(false);
            }
        }
    }, [api, isSessionIdValid, sessionIdNumber]);

    const sessionSettings = useSessionSettings(sessionIdNumber, sessionInfo, {
        onSaved: fetchSessionInfo,
    });

    const fetchSessionModules = useCallback(async () => {
        if (!isSessionIdValid) return;
        setSessionModulesLoading(true);
        try {
            const res = await api.get<SessionModuleApi[]>(
                `/sessions/${sessionIdNumber}/modules`,
                {
                    params: {fields: fieldsToString(SESSION_MODULE_FIELDS.DETAILS)},
                },
            );
            const modules = (res.data || []).map((m, index) => mapSessionModule(m, index));
            setSessionModules(modules);
        } catch {
            setSessionModules([]);
        } finally {
            setSessionModulesLoading(false);
        }
    }, [api, isSessionIdValid, sessionIdNumber]);

    useEffect(() => {
        fetchSessionInfo();
    }, [fetchSessionInfo]);

    useEffect(() => {
        fetchSessionModules();
    }, [fetchSessionModules]);

    const fetchParticipants = useCallback(async () => {
        if (!isSessionIdValid) return;
        try {
            const res = await getParticipantsBySessionId(api, sessionIdNumber);
            const items = res.participants.map((p) => ({
                id: p.id,
                name: p.display_name ?? 'Anonymous',
                guest_email: p.guest_email ?? null,
                joined_at: p.created_at ?? '',
                is_active: p.is_active,
                auth_type: (p.participant_type === 'guest_email' ? 'email' : p.participant_type === 'user' ? 'registered' : p.participant_type) as Participant['auth_type'],
                is_banned: p.is_banned,
            }));
            setParticipants(items);
            setActiveParticipantsCount(res.active_count ?? items.filter((p) => p.is_active).length);
            setMaxParticipants(res.max_participants ?? null);
        } catch {
            // Keep last successful participants snapshot to avoid abrupt UI reset on transient API errors.
        }
    }, [api, isSessionIdValid, sessionIdNumber]);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    useEffect(() => {
        if (!isSessionIdValid) return;
        const intervalId = window.setInterval(fetchParticipants, 10000);
        return () => window.clearInterval(intervalId);
    }, [fetchParticipants, isSessionIdValid]);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 8}}),
        useSensor(KeyboardSensor),
    );

    const activeModule = useMemo(
        () => sessionModules.find((m) => m.is_active),
        [sessionModules],
    );

    const queueModules = useMemo(
        () => sessionModules.filter((m) => !m.is_active),
        [sessionModules],
    );

    const handleStartStop = useCallback(async () => {
        if (!isSessionIdValid || !sessionInfo) return;
        try {
            if (sessionInfo.is_stopped) {
                await api.post(`/sessions/${sessionIdNumber}/start`);
            } else {
                await api.post(`/sessions/${sessionIdNumber}/stop`);
            }
            await fetchSessionInfo({silent: true});
        } catch {
            await fetchSessionInfo({silent: true});
        }
    }, [api, isSessionIdValid, sessionIdNumber, sessionInfo, fetchSessionInfo]);

    const presentationUrl = useMemo(
        () => `${window.location.origin}/workspace/${workspaceId}/session/${sessionId}/presentation`,
        [workspaceId, sessionId],
    );

    const handleOpenPresentation = useCallback(() => {
        window.open(presentationUrl, '_blank');
    }, [presentationUrl]);

    const handleCopyPresentationLink = useCallback(async () => {
        await navigator.clipboard.writeText(presentationUrl);
    }, [presentationUrl]);

    const handleBackToWorkspace = useCallback(() => {
        navigate(`/workspace/${workspaceId}`);
    }, [navigate, workspaceId]);

    const handleOpenWorkspaceModuleEdit = useCallback(
        (workspaceModuleId: number) => {
            navigate(`/workspace/${workspaceId}?tab=modules&edit=${workspaceModuleId}`);
        },
        [navigate, workspaceId],
    );

    const handleOpenWorkspaceModules = useCallback(() => {
        navigate(`/workspace/${workspaceId}?tab=modules`);
    }, [navigate, workspaceId]);

    const handleActivateModule = useCallback(async (moduleId: string) => {
        if (!isSessionIdValid) return;
        const numericId = Number(moduleId);
        if (!Number.isFinite(numericId)) return;
        try {
            await api.patch(`/sessions/${sessionIdNumber}/modules/${numericId}/activate`, null, {
                params: {fields: fieldsToString(SESSION_MODULE_FIELDS.DETAILS)},
            });
            await fetchSessionModules();
        } catch {
            await fetchSessionModules();
        }
    }, [api, isSessionIdValid, sessionIdNumber, fetchSessionModules]);

    const handleRemoveModule = useCallback(async (moduleId: string) => {
        if (!isSessionIdValid) return;
        const numericId = Number(moduleId);
        if (!Number.isFinite(numericId)) return;
        try {
            await api.delete(`/sessions/${sessionIdNumber}/modules/${numericId}`, {
                params: {hard: true},
            });
            setSessionModules((prev) => prev.filter((m) => m.id !== moduleId));
        } catch {
            await fetchSessionModules();
        }
    }, [api, isSessionIdValid, sessionIdNumber, fetchSessionModules]);

    const handleAddFromWorkspace = useCallback(async (
        workspaceModuleId: number,
        options?: {activate?: boolean},
    ) => {
        if (!isSessionIdValid) return;
        const wsModule = workspaceModules.modules.find((m) => m.id === workspaceModuleId);
        if (!wsModule || !isModuleSupported(wsModule.type)) return;

        try {
            const res = await api.post<SessionModuleApi>(
                `/sessions/${sessionIdNumber}/modules`,
                {workspace_module_id: workspaceModuleId},
                {params: {fields: fieldsToString(SESSION_MODULE_FIELDS.DETAILS)}},
            );

            if (res.data?.id) {
                let createdModuleId: string | null = null;
                setSessionModules((prev) => {
                    const created = mapSessionModule(res.data!, prev.length);
                    createdModuleId = created.id;
                    return [...prev, created];
                });
                if (options?.activate && createdModuleId) {
                    await handleActivateModule(createdModuleId);
                }
            } else {
                await fetchSessionModules();
            }
        } catch {
            await fetchSessionModules();
        }
    }, [api, isSessionIdValid, sessionIdNumber, workspaceModules.modules, handleActivateModule, fetchSessionModules]);

    const handleDeactivateModule = useCallback(async () => {
        if (!isSessionIdValid) return;
        try {
            await api.post(`/sessions/${sessionIdNumber}/modules/deactivate-active`);
            await fetchSessionModules();
        } catch {
            await fetchSessionModules();
        }
    }, [api, isSessionIdValid, sessionIdNumber, fetchSessionModules]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        const width = event.active.rect.current.initial?.width;
        const height = event.active.rect.current.initial?.height;
        if (width && height) {
            setActiveDragSize({width, height});
        } else {
            setActiveDragSize(null);
        }
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const {active, over} = event;
        setActiveId(null);
        setActiveDragSize(null);
        if (!over) return;

        const activeIdStr = String(active.id);
        const overId = String(over.id);

        if (activeIdStr.startsWith('workspace-')) {
            const workspaceModuleId = Number(activeIdStr.replace('workspace-', ''));
            const wsModule = workspaceModules.modules.find((m) => m.id === workspaceModuleId);
            if (!wsModule || !isModuleSupported(wsModule.type)) return;
            const overIsQueue =
                overId === 'module-queue-zone' || sessionModules.some((m) => m.id === overId);
            const overIsActive = overId === 'active-module-zone';
            const queueLength = sessionModules.filter((m) => !m.is_active).length;
            const hasActive = sessionModules.some((m) => m.is_active);
            const canAddToQueue = queueLength < 3;
            const canAddToActive = !hasActive || canAddToQueue;
            if (overIsActive && canAddToActive) {
                handleAddFromWorkspace(workspaceModuleId, {activate: true});
            } else if (overIsQueue && canAddToQueue) {
                handleAddFromWorkspace(workspaceModuleId, {activate: false});
            }
            return;
        }

        if (overId === 'active-module-zone') {
            handleActivateModule(activeIdStr);
            return;
        }

        if (overId === 'remove-queue-zone') {
            handleRemoveModule(activeIdStr);
            return;
        }

        if (overId === 'module-queue-zone' && sessionModules.some((m) => m.id === activeIdStr && m.is_active)) {
            handleDeactivateModule();
            return;
        }

        if (activeIdStr !== overId && sessionModules.some((m) => m.id === overId)) {
            setSessionModules((prev) => {
                const active = prev.find((m) => m.is_active);
                const queue = prev.filter((m) => !m.is_active);
                const oldIndex = queue.findIndex((m) => m.id === activeIdStr);
                const newIndex = queue.findIndex((m) => m.id === overId);
                if (oldIndex === -1 || newIndex === -1) return prev;
                const newQueue = arrayMove(queue, oldIndex, newIndex).map((m, idx) => ({
                    ...m,
                    order: idx,
                }));
                return active ? [active, ...newQueue] : newQueue;
            });
        }
    }, [sessionModules, workspaceModules.modules, handleActivateModule, handleAddFromWorkspace, handleRemoveModule, handleDeactivateModule]);

    const filteredParticipants = useMemo(() => {
        if (!participantSearch) return participants;
        const search = participantSearch.toLowerCase();
        return participants.filter((p) => p.name.toLowerCase().includes(search));
    }, [participants, participantSearch]);

    const sessionPasscode = sessionInfo?.passcode ?? '—';
    const canCopyPasscode = Boolean(sessionInfo?.passcode);
    const sessionInviteUrl = `${window.location.origin}/s/${sessionPasscode}`;

    const handleCopySessionLink = useCallback(async () => {
        if (!sessionInfo?.passcode) return;
        await navigator.clipboard.writeText(sessionInviteUrl);
    }, [sessionInviteUrl, sessionInfo?.passcode]);

    const [regeneratePasscodeLoading, setRegeneratePasscodeLoading] = useState(false);
    const handleRegeneratePasscode = useCallback(async () => {
        if (!isSessionIdValid || !sessionInfo?.passcode) return;
        setRegeneratePasscodeLoading(true);
        try {
            const res = await api.post<{ passcode: string }>(
                `/sessions/${sessionIdNumber}/passcode/regenerate`,
            );
            const newPasscode = res.data?.passcode;
            if (newPasscode) {
                setSessionInfo((prev) =>
                    prev ? { ...prev, passcode: newPasscode } : null,
                );
            }
        } finally {
            setRegeneratePasscodeLoading(false);
        }
    }, [api, isSessionIdValid, sessionIdNumber, sessionInfo?.passcode]);

    return {
        workspaceId,
        sessionId,
        sessionInfo,
        sessionModules,
        sessionLoading,
        sessionModulesLoading,
        participants,
        mainTab,
        setMainTab,
        participantSearch,
        setParticipantSearch,
        activeId,
        activeDragSize,
        sessionSettings,
        workspaceModules,
        sensors,
        activeModule,
        queueModules,
        isModuleSupported,
        handleStartStop,
        handleOpenPresentation,
        handleCopyPresentationLink,
        handleBackToWorkspace,
        handleOpenWorkspaceModuleEdit,
        handleOpenWorkspaceModules,
        handleActivateModule,
        handleRemoveModule,
        handleDeactivateModule,
        handleAddFromWorkspace,
        handleDragStart,
        handleDragEnd,
        filteredParticipants,
        activeParticipantsCount,
        maxParticipants,
        sessionPasscode,
        canCopyPasscode,
        handleCopySessionLink,
        handleRegeneratePasscode,
        regeneratePasscodeLoading,
        fetchSessionModules,
        fetchParticipants,
    };
}
