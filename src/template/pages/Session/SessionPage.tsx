import {useMemo, useState} from 'react';
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

import type {Participant, SessionDetail, SessionModule} from '../../types/sessionPage';
import {mockParticipants, mockSessionDetail} from '../../data/mockSessionDetail';
// TODO: Replace with API call - import { getSessionDetail, getSessionParticipants } from '../../api/sessions';
import {formatShortDate} from '../../utils/date';
import './SessionPage.css';

type PreviewTab = 'preview' | 'participants' | 'settings';

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
        >
            <div className="session-page__module-card-header">
                <div className="session-page__module-card-drag" {...attributes} {...listeners}>
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

// Workspace module card (правая панель)
function WorkspaceModuleCard({
    module,
    onAdd,
}: {
    module: {id: number; name: string; type: SessionModule['type']};
    onAdd: () => void;
}) {
    const ModuleIcon = getModuleIcon(module.type);

    return (
        <Card view="outlined" className="session-page__workspace-module-card">
            <div className="session-page__workspace-module-header">
                <Icon data={ModuleIcon} size={18} />
                <Text variant="body-2">{module.name}</Text>
            </div>
            <Button view="outlined" size="s" onClick={onAdd}>
                <Icon data={Plus} size={14} />
                Add
            </Button>
        </Card>
    );
}

export default function SessionPage() {
    const {workspaceId, sessionId} = useParams();
    const navigate = useNavigate();

    // State
    const [sessionDetail, setSessionDetail] = useState<SessionDetail>(mockSessionDetail);
    const [participants] = useState<Participant[]>(mockParticipants);
    const [previewTab, setPreviewTab] = useState<PreviewTab>('preview');
    const [participantSearch, setParticipantSearch] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);

    // Workspace modules (мок, в реальности загружались бы отсюда workspace)
    const workspaceModules = useMemo(
        () => [
            {id: 101, name: 'Questions Module', type: 'questions' as const},
            {id: 102, name: 'Poll Template', type: 'poll' as const},
            {id: 103, name: 'Quiz Builder', type: 'quiz' as const},
            {id: 104, name: 'Timer Module', type: 'timer' as const},
        ],
        [],
    );

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
        () => sessionDetail.session_modules.find((m) => m.is_active),
        [sessionDetail.session_modules],
    );

    // Handlers
    const handleStartStop = () => {
        setSessionDetail((prev) => ({
            ...prev,
            is_stopped: !prev.is_stopped,
            started_at: !prev.is_stopped ? null : new Date().toISOString(),
        }));
    };

    const handleOpenPresentation = () => {
        navigate(`/workspace/${workspaceId}/session/${sessionId}/presentation`);
    };

    const handleBackToWorkspace = () => {
        navigate(`/workspace/${workspaceId}`);
    };

    const handleActivateModule = (moduleId: string) => {
        setSessionDetail((prev) => ({
            ...prev,
            session_modules: prev.session_modules.map((m) => ({
                ...m,
                is_active: m.id === moduleId,
            })),
            active_module_id: moduleId,
        }));
    };

    const handleRemoveModule = (moduleId: string) => {
        setSessionDetail((prev) => {
            const modules = prev.session_modules.filter((m) => m.id !== moduleId);
            const newActiveId = moduleId === prev.active_module_id ? null : prev.active_module_id;
            return {
                ...prev,
                session_modules: modules,
                active_module_id: newActiveId,
            };
        });
    };

    const handleAddFromWorkspace = (workspaceModuleId: number) => {
        const wsModule = workspaceModules.find((m) => m.id === workspaceModuleId);
        if (!wsModule) return;

        // Найти количество модулей с таким же именем
        const existingCount = sessionDetail.session_modules.filter((m) =>
            m.name.startsWith(wsModule.name),
        ).length;

        const newModule: SessionModule = {
            id: `session-mod-${Date.now()}`,
            module_id: workspaceModuleId,
            order: sessionDetail.session_modules.length,
            is_active: false,
            name: `${wsModule.name}-${existingCount + 1}`,
            type: wsModule.type,
            config: {},
        };

        setSessionDetail((prev) => ({
            ...prev,
            session_modules: [...prev.session_modules, newModule],
        }));
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

        // Перетаскивание в Active Zone
        if (overId === 'active-module-zone') {
            handleActivateModule(activeId);
            return;
        }

        // Reorder в списке
        if (activeId !== overId) {
            setSessionDetail((prev) => {
                const oldIndex = prev.session_modules.findIndex((m) => m.id === activeId);
                const newIndex = prev.session_modules.findIndex((m) => m.id === overId);

                if (oldIndex === -1 || newIndex === -1) return prev;

                const newModules = arrayMove(prev.session_modules, oldIndex, newIndex).map(
                    (m: SessionModule, idx: number) => ({
                        ...m,
                        order: idx,
                    }),
                );

                return {
                    ...prev,
                    session_modules: newModules,
                };
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

    return (
        <div className="session-page">
            {/* Header */}
            <div className="session-page__header">
                <div className="session-page__header-main">
                    <Button view="flat" size="l" onClick={handleBackToWorkspace}>
                        <Icon data={ArrowLeft} size={20} />
                    </Button>
                    <div className="session-page__header-info">
                        <Text variant="header-1">{sessionDetail.name}</Text>
                        <div className="session-page__header-meta">
                            <Label theme={sessionDetail.is_stopped ? 'normal' : 'success'} size="m">
                                {sessionDetail.is_stopped ? 'Stopped' : 'Live'}
                            </Label>
                            <Text variant="body-1" color="secondary">
                                {activeParticipantsCount} active participants
                            </Text>
                            <Text variant="caption-2" color="secondary">
                                Code: {sessionDetail.passcode}
                            </Text>
                            <ClipboardButton
                                text={`${window.location.origin}/s/${sessionDetail.passcode}`}
                                size="s"
                            />
                        </div>
                    </div>
                </div>
                <div className="session-page__header-actions">
                    <Button
                        view={sessionDetail.is_stopped ? 'action' : 'outlined-danger'}
                        size="l"
                        onClick={handleStartStop}
                    >
                        <Icon data={sessionDetail.is_stopped ? Play : Stop} size={18} />
                        {sessionDetail.is_stopped ? 'Start Session' : 'Stop Session'}
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

            {/* Main Content: 3 columns */}
            <div className="session-page__content">
                {/* LEFT: Session Modules */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="session-page__left-panel">
                        <Text variant="header-2">Session Modules</Text>

                        {/* Active Module Zone */}
                        <ActiveModuleDropZone activeModule={activeModule} />

                        <Divider />

                        {/* Session Modules List */}
                        <div className="session-page__modules-list">
                            <Text variant="subheader-1">Module Queue</Text>
                            <SortableContext
                                items={sessionDetail.session_modules.map((m) => m.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {sessionDetail.session_modules
                                    .filter((m) => !m.is_active)
                                    .map((module) => (
                                        <SortableModuleCard
                                            key={module.id}
                                            module={module}
                                            onActivate={() => handleActivateModule(module.id)}
                                            onRemove={() => handleRemoveModule(module.id)}
                                        />
                                    ))}
                            </SortableContext>

                            {sessionDetail.session_modules.filter((m) => !m.is_active).length ===
                                0 && (
                                <Card view="outlined" className="session-page__empty-state">
                                    <Text variant="body-1" color="secondary">
                                        No modules in queue. Add from workspace modules →
                                    </Text>
                                </Card>
                            )}
                        </div>
                    </div>

                    <DragOverlay>
                        {activeId ? (
                            <Card view="raised" className="session-page__drag-overlay">
                                <Icon
                                    data={getModuleIcon(
                                        sessionDetail.session_modules.find((m) => m.id === activeId)
                                            ?.type || 'questions',
                                    )}
                                    size={18}
                                />
                                <Text variant="body-2">
                                    {
                                        sessionDetail.session_modules.find((m) => m.id === activeId)
                                            ?.name
                                    }
                                </Text>
                            </Card>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* CENTER: Preview / Participants / Settings */}
                <div className="session-page__center-panel">
                    <TabProvider
                        value={previewTab}
                        onUpdate={(v) => setPreviewTab(v as PreviewTab)}
                    >
                        <TabList className="session-page__tabs">
                            <Tab value="preview">Preview</Tab>
                            <Tab value="participants">Participants ({participants.length})</Tab>
                            <Tab value="settings">Settings</Tab>
                        </TabList>

                        <div className="session-page__tab-content">
                            {previewTab === 'preview' && (
                                <Card view="outlined" className="session-page__preview-card">
                                    <Text variant="subheader-1">Student View</Text>
                                    <div className="session-page__preview-content">
                                        {activeModule ? (
                                            <>
                                                <Icon
                                                    data={getModuleIcon(activeModule.type)}
                                                    size={48}
                                                />
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
                            )}

                            {previewTab === 'participants' && (
                                <div className="session-page__participants-panel">
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
                                                            {participant.is_active
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </Label>
                                                        <Label theme="utility" size="xs">
                                                            {participant.auth_type}
                                                        </Label>
                                                        <Text variant="caption-2" color="secondary">
                                                            Joined{' '}
                                                            {formatShortDate(participant.joined_at)}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {previewTab === 'settings' && (
                                <Card view="outlined" className="session-page__settings-card">
                                    <Text variant="subheader-1">Session Settings</Text>
                                    <Text variant="body-1" color="secondary">
                                        Settings controls coming soon...
                                    </Text>
                                    <Label theme="warning" size="m">
                                        <Icon data={Clock} size={14} />
                                        WIP: Session settings panel
                                    </Label>
                                </Card>
                            )}
                        </div>
                    </TabProvider>
                </div>

                {/* RIGHT: Workspace Modules */}
                <div className="session-page__right-panel">
                    <Text variant="header-2">Workspace Modules</Text>
                    <Text variant="body-1" color="secondary">
                        Add configured modules to this session
                    </Text>
                    <div className="session-page__workspace-modules">
                        {workspaceModules.map((module) => (
                            <WorkspaceModuleCard
                                key={module.id}
                                module={module}
                                onAdd={() => handleAddFromWorkspace(module.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
