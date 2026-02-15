import {useCallback, useEffect, useMemo, useState, type ReactNode} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Button,
    Card,
    ClipboardButton,
    Divider,
    Icon,
    Label,
    Tab,
    TabList,
    TabProvider,
    Text,
    TextInput,
} from '@gravity-ui/uikit';
import {
    ArrowLeft,
    Bars,
    CirclePlay,
    CircleQuestion,
    Clock,
    Gear,
    ListCheck,
    Pencil,
    Play,
    Plus,
    Square,
    Stop,
    TrashBin,
    Tv,
} from '@gravity-ui/icons';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {DragEndEvent, DragStartEvent} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

import type {Participant, SessionModule} from '../../types/sessionPage';
import type {WorkspaceActivityModule} from '../../types/workspace';
import {mockParticipants} from '../../data/mockSessionDetail';
import {formatShortDate} from '../../utils/date';
import {AutoStartSchedule} from '../../components/Workspace/AutoStartSchedule/AutoStartSchedule';
import {SessionDefaults} from '../../components/Workspace/SessionDefaults/SessionDefaults';
import {useWorkspaceSettings} from '../../hooks/useWorkspaceSettings';
import {useWorkspaceModules} from '../../hooks/useWorkspaceModules';
import {useApi} from '@/hooks/useApi';
import '../Workspace/Workspace.css';
import './SessionPage.css';

type MainTab = 'modules' | 'preview' | 'settings';

type SessionInfo = {
    id: number;
    workspace_id: number;
    name: string;
    is_stopped: boolean;
    start_datetime?: string | null;
    end_datetime?: string | null;
    status?: string | null;
    passcode?: string | null;
};

type SessionModuleApi = {
    id: number;
    session_id: number;
    name: string | null;
    module_type: SessionModule['type'];
    settings: Record<string, unknown> | null;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
};

const sessionFields = 'id,workspace_id,name,is_stopped,start_datetime,end_datetime,status,passcode';
const sessionModuleFields =
    'id,session_id,name,module_type,settings,is_active,created_at,updated_at';

const getSessionModuleType = (value: unknown): SessionModule['type'] => {
    if (value === 'questions' || value === 'poll' || value === 'quiz' || value === 'timer') {
        return value;
    }
    return 'questions';
};

const mapSessionModule = (module: SessionModuleApi, index: number): SessionModule => {
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
};

// Helper для иконок типов модулей
function getModuleIcon(type: SessionModule['type']) {
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

// Компонент для одного модуля в списке (с drag handle)
function SortableModuleCard({
    module,
    onActivate,
    onRemove,
}: {
    module: SessionModule;
    onActivate: () => void;
    onRemove: () => void;
}) {
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

// Компонент для Active Module Drop Zone
function ActiveModuleDropZone({activeModule}: {activeModule: SessionModule | undefined}) {
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

function ModuleQueueDropZone({children}: {children: ReactNode}) {
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

// Workspace module card (правая панель)
function WorkspaceModuleCard({
    module,
    onAdd,
    disabled,
    isWip,
}: {
    module: WorkspaceActivityModule;
    onAdd: () => void;
    disabled?: boolean;
    isWip?: boolean;
}) {
    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
        id: `workspace-${module.id}`,
        disabled: Boolean(disabled),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.6 : 1,
    };

    const ModuleIcon = getModuleIcon(module.type);

    return (
        <Card
            ref={setNodeRef}
            view="outlined"
            className="session-page__workspace-module-card"
            style={style}
        >
            <div className="session-page__workspace-module-header">
                <div className="session-page__workspace-module-drag" {...attributes} {...listeners}>
                    <Icon data={Bars} size={14} />
                </div>
                <Icon data={ModuleIcon} size={18} />
                <Text variant="body-2">{module.name}</Text>
                {isWip && (
                    <Label theme="warning" size="s" className="workspace-page__wip-label">
                        <span className="workspace-page__wip-icon-wrapper">
                            <Icon data={Clock} size={14} />
                        </span>
                        <span>WIP</span>
                    </Label>
                )}
            </div>
            <Button view="outlined" size="s" onClick={onAdd} disabled={disabled}>
                <Icon data={Plus} size={14} />
                Add
            </Button>
        </Card>
    );
}

export default function SessionPage() {
    const {workspaceId, sessionId} = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const workspaceIdNumber = Number(workspaceId);
    const sessionIdNumber = Number(sessionId);
    const isSessionIdValid = Number.isFinite(sessionIdNumber);

    // State
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const [sessionModules, setSessionModules] = useState<SessionModule[]>([]);
    const [sessionLoading, setSessionLoading] = useState(false);
    const [sessionModulesLoading, setSessionModulesLoading] = useState(false);
    const [participants] = useState<Participant[]>(mockParticipants);
    const [mainTab, setMainTab] = useState<MainTab>('modules');
    const [participantSearch, setParticipantSearch] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const sessionSettings = useWorkspaceSettings(undefined);
    const workspaceModules = useWorkspaceModules(workspaceIdNumber);

    const fetchSessionInfo = useCallback(async () => {
        if (!isSessionIdValid) return;
        setSessionLoading(true);
        try {
            const res = await api.get<SessionInfo>(`/sessions/${sessionIdNumber}`, {
                params: {fields: sessionFields},
            });
            setSessionInfo(res.data);
        } catch (err) {
            setSessionInfo(null);
        } finally {
            setSessionLoading(false);
        }
    }, [api, isSessionIdValid, sessionIdNumber]);

    const fetchSessionModules = useCallback(async () => {
        if (!isSessionIdValid) return;
        setSessionModulesLoading(true);
        try {
            const res = await api.get<SessionModuleApi[]>(
                `/sessions/${sessionIdNumber}/modules`,
                {
                    params: {fields: sessionModuleFields},
                },
            );
            const modules = (res.data || []).map((m, index) => mapSessionModule(m, index));
            setSessionModules(modules);
        } catch (err) {
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

    // Sensors для drag-and-drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor),
    );

    // Active module
    const activeModule = useMemo(
        () => sessionModules.find((m) => m.is_active),
        [sessionModules],
    );

    const queueModules = useMemo(
        () => sessionModules.filter((m) => !m.is_active),
        [sessionModules],
    );

    const isModuleSupported = (type: SessionModule['type']) =>
        type === 'questions' || type === 'timer';

    // Handlers
    const handleStartStop = async () => {
        if (!isSessionIdValid || !sessionInfo) return;
        try {
            if (sessionInfo.is_stopped) {
                await api.post(`/sessions/${sessionIdNumber}/start`);
            } else {
                await api.post(`/sessions/${sessionIdNumber}/stop`);
            }
            await fetchSessionInfo();
        } catch (err) {
            await fetchSessionInfo();
        }
    };

    const handleOpenPresentation = () => {
        navigate(`/workspace/${workspaceId}/session/${sessionId}/presentation`);
    };

    const handleBackToWorkspace = () => {
        navigate(`/workspace/${workspaceId}`);
    };

    const handleActivateModule = async (moduleId: string) => {
        if (!isSessionIdValid) return;
        const numericId = Number(moduleId);
        if (!Number.isFinite(numericId)) return;
        try {
            await api.patch(`/sessions/${sessionIdNumber}/modules/${numericId}/activate`, null, {
                params: {fields: sessionModuleFields},
            });
            await fetchSessionModules();
        } catch (err) {
            await fetchSessionModules();
        }
    };

    const handleRemoveModule = async (moduleId: string) => {
        if (!isSessionIdValid) return;
        const numericId = Number(moduleId);
        if (!Number.isFinite(numericId)) return;
        try {
            await api.delete(`/sessions/${sessionIdNumber}/modules/${numericId}`, {
                params: {hard: true},
            });
            setSessionModules((prev) => prev.filter((m) => m.id !== moduleId));
        } catch (err) {
            await fetchSessionModules();
        }
    };

    const handleAddFromWorkspace = async (
        workspaceModuleId: number,
        options?: {activate?: boolean},
    ) => {
        if (!isSessionIdValid) return;
        const wsModule = workspaceModules.modules.find((m) => m.id === workspaceModuleId);
        if (!wsModule || !isModuleSupported(wsModule.type)) return;

        try {
            const res = await api.post<SessionModuleApi>(
                `/sessions/${sessionIdNumber}/modules`,
                {
                    workspace_module_id: workspaceModuleId,
                },
                {
                    params: {fields: sessionModuleFields},
                },
            );

            if (res.data && res.data.id) {
                let createdModuleId: string | null = null;
                setSessionModules((prev) => {
                    const created = mapSessionModule(res.data, prev.length);
                    createdModuleId = created.id;
                    return [...prev, created];
                });
                if (options?.activate) {
                    await handleActivateModule(createdModuleId ?? String(res.data.id));
                }
            } else {
                await fetchSessionModules();
            }
        } catch (err) {
            await fetchSessionModules();
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        setActiveId(null);

        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId.startsWith('workspace-')) {
            const workspaceModuleId = Number(activeId.replace('workspace-', ''));
            const wsModule = workspaceModules.modules.find((m) => m.id === workspaceModuleId);
            if (!wsModule || !isModuleSupported(wsModule.type)) return;
            const overIsQueue =
                overId === 'module-queue-zone' ||
                sessionModules.some((m) => m.id === overId);
            const overIsActive = overId === 'active-module-zone';

            if (overIsQueue || overIsActive) {
                handleAddFromWorkspace(workspaceModuleId, {activate: overIsActive});
            }
            return;
        }

        // Перетаскивание в Active Zone
        if (overId === 'active-module-zone') {
            handleActivateModule(activeId);
            return;
        }

        // Reorder в списке
        if (activeId !== overId && sessionModules.some((m) => m.id === overId)) {
            setSessionModules((prev) => {
                const active = prev.find((m) => m.is_active);
                const queue = prev.filter((m) => !m.is_active);
                const oldIndex = queue.findIndex((m) => m.id === activeId);
                const newIndex = queue.findIndex((m) => m.id === overId);

                if (oldIndex === -1 || newIndex === -1) return prev;

                const newQueue = arrayMove(queue, oldIndex, newIndex).map(
                    (m: SessionModule, idx: number) => ({
                        ...m,
                        order: idx,
                    }),
                );

                return active ? [active, ...newQueue] : newQueue;
            });
        }
    };

    // Filtered participants
    const filteredParticipants = useMemo(() => {
        if (!participantSearch) return participants;
        const search = participantSearch.toLowerCase();
        return participants.filter((p) => p.name.toLowerCase().includes(search));
    }, [participants, participantSearch]);

    const activeParticipantsCount = participants.filter((p) => p.is_active).length;
    const sessionPasscode = sessionInfo?.passcode ?? '—';
    const canCopyPasscode = Boolean(sessionInfo?.passcode);

    return (
        <div className="session-page">
            {/* Header */}
            <div className="session-page__header">
                <div className="session-page__header-main">
                    <Button view="flat" size="l" onClick={handleBackToWorkspace}>
                        <Icon data={ArrowLeft} size={20} />
                    </Button>
                    <div className="session-page__header-info">
                        <Text variant="header-1">
                            {sessionLoading ? 'Loading…' : sessionInfo?.name || 'Session'}
                        </Text>
                        <div className="session-page__header-meta">
                            <Label
                                theme={sessionInfo?.is_stopped ? 'normal' : 'success'}
                                size="m"
                            >
                                {sessionInfo?.is_stopped ? 'Stopped' : 'Live'}
                            </Label>
                            <Text variant="body-1" color="secondary">
                                {activeParticipantsCount} active participants
                            </Text>
                            <Text variant="caption-2" color="secondary">
                                Code: {sessionPasscode}
                            </Text>
                            {canCopyPasscode && (
                                <ClipboardButton
                                    text={`${window.location.origin}/s/${sessionPasscode}`}
                                    size="s"
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="session-page__header-actions">
                    <Button
                        view={sessionInfo?.is_stopped ? 'action' : 'outlined-danger'}
                        size="l"
                        onClick={handleStartStop}
                    >
                        <Icon data={sessionInfo?.is_stopped ? Play : Stop} size={18} />
                        {sessionInfo?.is_stopped ? 'Start Session' : 'Stop Session'}
                    </Button>
                    <Button view="flat" size="l">
                        <Icon data={Gear} size={18} />
                    </Button>
                    <Button view="outlined" size="l" onClick={handleOpenPresentation}>
                        <Icon data={Tv} size={18} />
                        Presentation
                    </Button>
                </div>
            </div>

            <Divider />

            {/* Main Content */}
            <div className="session-page__content">
                <TabProvider value={mainTab} onUpdate={(v) => setMainTab(v as MainTab)}>
                    <TabList className="session-page__main-tabs">
                        <Tab value="modules">Session modules</Tab>
                        <Tab value="preview">Preview & Participants</Tab>
                        <Tab value="settings">Settings</Tab>
                    </TabList>
                </TabProvider>

                {mainTab === 'modules' && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="session-page__modules-grid">
                            <div className="session-page__left-panel">
                                <Text variant="header-2">Session Modules</Text>

                                <ActiveModuleDropZone activeModule={activeModule} />

                                <Divider />

                                <div className="session-page__modules-list">
                                    <Text variant="subheader-1">Module Queue</Text>
                                    <ModuleQueueDropZone>
                                        <SortableContext
                                            items={queueModules.map((m) => m.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {queueModules.map((module) => (
                                                <SortableModuleCard
                                                    key={module.id}
                                                    module={module}
                                                    onActivate={() =>
                                                        handleActivateModule(module.id)
                                                    }
                                                    onRemove={() => handleRemoveModule(module.id)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </ModuleQueueDropZone>

                                    {queueModules.length === 0 && !sessionModulesLoading && (
                                        <Card view="outlined" className="session-page__empty-state">
                                            <Text variant="body-1" color="secondary">
                                                No modules in queue. Add from workspace modules →
                                            </Text>
                                        </Card>
                                    )}
                                </div>
                            </div>

                            <div className="session-page__right-panel">
                                <Text variant="header-2">Workspace Modules</Text>
                                <Text variant="body-1" color="secondary">
                                    Add configured modules to this session
                                </Text>
                                <div className="session-page__workspace-modules">
                                    {workspaceModules.modules.map((module) => {
                                        const isWip = !isModuleSupported(module.type);
                                        return (
                                        <WorkspaceModuleCard
                                            key={module.id}
                                            module={module}
                                            onAdd={() => handleAddFromWorkspace(module.id)}
                                            disabled={isWip}
                                            isWip={isWip}
                                        />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <DragOverlay>
                            {activeId ? (
                                <Card view="raised" className="session-page__drag-overlay">
                                    <Icon
                                        data={getModuleIcon(
                                            sessionModules.find((m) => m.id === activeId)?.type ||
                                                workspaceModules.modules.find(
                                                    (m) => `workspace-${m.id}` === activeId,
                                                )?.type ||
                                                'questions',
                                        )}
                                        size={18}
                                    />
                                    <Text variant="body-2">
                                        {sessionModules.find((m) => m.id === activeId)
                                            ?.name ||
                                            workspaceModules.modules.find(
                                                (m) => `workspace-${m.id}` === activeId,
                                            )?.name}
                                    </Text>
                                </Card>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}

                {mainTab === 'preview' && (
                    <div className="session-page__preview-grid">
                        <Card view="outlined" className="session-page__preview-card">
                            <Text variant="subheader-1">Preview</Text>
                            <Text variant="body-2" color="secondary">
                                How it looks on participant phones
                            </Text>
                            <div className="session-page__preview-content">
                                {activeModule ? (
                                    <>
                                        <Icon data={getModuleIcon(activeModule.type)} size={48} />
                                        <Text variant="header-2">{activeModule.name}</Text>
                                        <Text variant="body-1" color="secondary">
                                            Students see this module on their devices
                                        </Text>
                                        <Label theme="info" size="m">
                                            WIP: Module rendering
                                        </Label>
                                    </>
                                ) : (
                                    <>
                                        <Text variant="display-1" color="secondary">
                                            No active module
                                        </Text>
                                        <Text variant="body-1" color="secondary">
                                            Activate a module to show content to students
                                        </Text>
                                    </>
                                )}
                            </div>
                        </Card>

                        <Card view="outlined" className="session-page__participants-card">
                            <Text variant="subheader-1">
                                Participants ({participants.length})
                            </Text>
                            <TextInput
                                placeholder="Search participants..."
                                value={participantSearch}
                                onUpdate={setParticipantSearch}
                                size="l"
                                className="session-page__search"
                            />
                            <div className="session-page__participants-list">
                                {filteredParticipants.map((participant) => (
                                    <Card
                                        key={participant.id}
                                        view="outlined"
                                        className="session-page__participant-card"
                                    >
                                        <div className="session-page__participant-info">
                                            <Text variant="body-2">{participant.name}</Text>
                                            <div className="session-page__participant-meta">
                                                <Label
                                                    theme={
                                                        participant.is_active
                                                            ? 'success'
                                                            : 'normal'
                                                    }
                                                    size="xs"
                                                >
                                                    {participant.is_active ? 'Active' : 'Inactive'}
                                                </Label>
                                                <Label theme="utility" size="xs">
                                                    {participant.auth_type}
                                                </Label>
                                                <Text variant="caption-2" color="secondary">
                                                    Joined {formatShortDate(participant.joined_at)}
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {mainTab === 'settings' && (
                    <div className="session-page__settings-grid">
                        <SessionDefaults
                            defaultSessionDuration={sessionSettings.defaultSessionDuration}
                            onDefaultSessionDurationChange={
                                sessionSettings.setDefaultSessionDuration
                            }
                            customSessionDuration={sessionSettings.customSessionDuration}
                            onCustomSessionDurationChange={
                                sessionSettings.setCustomSessionDuration
                            }
                            maxParticipants={sessionSettings.maxParticipants}
                            onMaxParticipantsChange={sessionSettings.setMaxParticipants}
                            customMaxParticipants={sessionSettings.customMaxParticipants}
                            onCustomMaxParticipantsChange={
                                sessionSettings.setCustomMaxParticipants
                            }
                            enableChat={sessionSettings.enableChat}
                            onEnableChatChange={sessionSettings.setEnableChat}
                            enableModeration={sessionSettings.enableModeration}
                            onEnableModerationChange={sessionSettings.setEnableModeration}
                            autoExpireDays={sessionSettings.autoExpireDays}
                            onAutoExpireDaysChange={sessionSettings.setAutoExpireDays}
                            autoExpireEnabled={sessionSettings.autoExpireEnabled}
                            onAutoExpireEnabledChange={sessionSettings.setAutoExpireEnabled}
                            autostartEnabled={sessionSettings.autostartEnabled}
                            onAutostartEnabledChange={sessionSettings.setAutostartEnabled}
                            autostartSchedule={sessionSettings.autostartSchedule}
                            onSetDay={sessionSettings.setDay}
                            parseIntSafe={sessionSettings.parseIntSafe}
                            clamp={sessionSettings.clamp}
                            timeOptions={sessionSettings.timeOptions}
                            weekDays={sessionSettings.weekDays}
                        />
                        {sessionSettings.autostartEnabled && (
                            <AutoStartSchedule
                                schedule={sessionSettings.autostartSchedule}
                                onSetDay={sessionSettings.setDay}
                                timeOptions={sessionSettings.timeOptions}
                                weekDays={sessionSettings.weekDays}
                                parseIntSafe={sessionSettings.parseIntSafe}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
