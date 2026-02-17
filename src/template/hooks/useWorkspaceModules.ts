import {useEffect, useMemo, useState} from 'react';
import type {
    ActivityModuleConfig,
    ActivityModuleType,
    WorkspaceActivityModule,
} from '../types/workspace';
import {useApi} from '@/hooks/useApi';
import {WORKSPACE_MODULE_FIELDS, fieldsToString} from '@/api/fields';

type WorkspaceModuleApi = {
    id: number;
    workspace_id: number;
    name: string;
    module_type: ActivityModuleType;
    settings: Record<string, unknown> | null;
    created_at?: string | null;
    updated_at?: string | null;
};


type ModuleDefaultsByType = {
    questions: Extract<ActivityModuleConfig, {type: 'questions'}>;
    poll: Extract<ActivityModuleConfig, {type: 'poll'}>;
    quiz: Extract<ActivityModuleConfig, {type: 'quiz'}>;
    timer: Extract<ActivityModuleConfig, {type: 'timer'}>;
};

const defaultConfigByType: ModuleDefaultsByType = {
    questions: {
        type: 'questions',
        allow_anonymous: false,
        enable_upvotes: true,
        max_length: 240,
        cooldown_sec: 0,
    },
    poll: {
        type: 'poll',
        question: '',
        answer_mode: 'options',
        word_cloud: false,
        options: [],
    },
    quiz: {
        type: 'quiz',
        question: '',
        time_limit_sec: 60,
        show_correct_answer: true,
        options: [],
    },
    timer: {
        type: 'timer',
        duration_sec: 120,
        enable_sound: true,
        allow_pause: true,
    },
};

const getBoolean = (value: unknown, fallback: boolean) =>
    typeof value === 'boolean' ? value : fallback;
const getNumber = (value: unknown, fallback: number) =>
    typeof value === 'number' ? value : fallback;
const getString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const normalizeConfig = (
    type: ActivityModuleType,
    settings: Record<string, unknown>,
): ActivityModuleConfig => {
    switch (type) {
        case 'questions':
            const questionsDefaults = defaultConfigByType.questions;
            return {
                type: 'questions',
                allow_anonymous: getBoolean(
                    settings.allow_anonymous,
                    questionsDefaults.allow_anonymous,
                ),
                enable_upvotes: getBoolean(
                    settings.enable_upvotes,
                    questionsDefaults.enable_upvotes,
                ),
                max_length: getNumber(settings.max_length, questionsDefaults.max_length),
                cooldown_sec: getNumber(settings.cooldown_sec, questionsDefaults.cooldown_sec),
            };
        case 'poll':
            const pollDefaults = defaultConfigByType.poll;
            return {
                type: 'poll',
                question: getString(settings.question, pollDefaults.question),
                answer_mode:
                    (settings.answer_mode as 'options' | 'free' | 'mixed') ||
                    pollDefaults.answer_mode,
                word_cloud: getBoolean(settings.word_cloud, pollDefaults.word_cloud),
                options: Array.isArray(settings.options)
                    ? (settings.options as string[])
                    : pollDefaults.options,
            };
        case 'quiz':
            const quizDefaults = defaultConfigByType.quiz;
            return {
                type: 'quiz',
                question: getString(settings.question, quizDefaults.question),
                time_limit_sec: getNumber(settings.time_limit_sec, quizDefaults.time_limit_sec),
                show_correct_answer: getBoolean(
                    settings.show_correct_answer,
                    quizDefaults.show_correct_answer,
                ),
                options: Array.isArray(settings.options)
                    ? (settings.options as Array<{text: string; correct: boolean}>)
                    : quizDefaults.options,
            };
        case 'timer':
            const timerDefaults = defaultConfigByType.timer;
            return {
                type: 'timer',
                duration_sec: getNumber(settings.duration_sec, timerDefaults.duration_sec),
                enable_sound: getBoolean(settings.enable_sound, timerDefaults.enable_sound),
                allow_pause: getBoolean(settings.allow_pause, timerDefaults.allow_pause),
            };
    }
};

const buildSettings = (module: WorkspaceActivityModule) => ({
    ...module.config,
    description: module.description,
    enabled: module.enabled,
});

const mapApiModule = (module: WorkspaceModuleApi): WorkspaceActivityModule => {
    const settings = module.settings ?? {};
    return {
        id: module.id,
        type: module.module_type,
        name: module.name,
        description: getString(settings.description, ''),
        updated_at:
            getString(module.updated_at || undefined, '') ||
            getString(module.created_at || undefined, new Date().toISOString()),
        enabled: getBoolean(settings.enabled, true),
        used_in_sessions: getNumber(settings.used_in_sessions, 0),
        config: normalizeConfig(module.module_type, settings),
    };
};

export function useWorkspaceModules(workspaceId?: number) {
    const api = useApi();
    const [modules, setModules] = useState<WorkspaceActivityModule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModuleDetailsOpen, setIsModuleDetailsOpen] = useState(false);
    const [moduleDetailsTab, setModuleDetailsTab] = useState<
        'overview' | 'settings' | 'content' | 'preview'
    >('overview');
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const selectedModule = useMemo(
        () =>
            selectedModuleId != null ? modules.find((m) => m.id === selectedModuleId) : undefined,
        [modules, selectedModuleId],
    );
    const [moduleDraft, setModuleDraft] = useState<WorkspaceActivityModule | null>(null);
    const [renameModuleId, setRenameModuleId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [deleteModuleId, setDeleteModuleId] = useState<number | null>(null);
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
    const [createModuleType, setCreateModuleType] = useState<ActivityModuleType>('poll');

    const fetchModules = async () => {
        if (!Number.isFinite(workspaceId)) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get<WorkspaceModuleApi[]>(
                `/workspaces/${workspaceId}/modules`,
                {
                    params: {fields: fieldsToString(WORKSPACE_MODULE_FIELDS.LIST)},
                },
            );
            setModules((res.data || []).map(mapApiModule));
        } catch (err: any) {
            const message = err?.response?.data?.detail || 'Failed to load modules';
            setError(typeof message === 'string' ? message : 'Failed to load modules');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModules();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId]);

    const openModuleDetails = (moduleId: number) => {
        const current = modules.find((m) => m.id === moduleId);
        if (!current) return;
        setSelectedModuleId(moduleId);
        setModuleDetailsTab('overview');
        setModuleDraft(JSON.parse(JSON.stringify(current)) as WorkspaceActivityModule);
        setIsModuleDetailsOpen(true);
    };

    const closeModuleDetails = () => {
        setIsModuleDetailsOpen(false);
    };

    const saveModuleDetails = async () => {
        if (!moduleDraft) return;
        if (!Number.isFinite(workspaceId)) return;
        try {
            const res = await api.put<WorkspaceModuleApi>(
                `/workspaces/${workspaceId}/modules/${moduleDraft.id}`,
                {
                    name: moduleDraft.name,
                    module_type: moduleDraft.type,
                    settings: buildSettings(moduleDraft),
                },
                {
                    params: {fields: fieldsToString(WORKSPACE_MODULE_FIELDS.LIST)},
                },
            );
            if (res.data && res.data.id) {
                const updated = mapApiModule(res.data);
                setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            } else {
                await fetchModules();
            }
            setIsModuleDetailsOpen(false);
        } catch (err) {
            await fetchModules();
        }
    };

    const openRenameModule = (m: WorkspaceActivityModule) => {
        setRenameModuleId(m.id);
        setRenameValue(m.name);
    };

    const closeRenameModule = () => {
        setRenameModuleId(null);
        setRenameValue('');
    };

    const confirmRenameModule = async () => {
        if (renameModuleId == null) return;
        if (!Number.isFinite(workspaceId)) return;
        const moduleToRename = modules.find((m) => m.id === renameModuleId);
        if (!moduleToRename) return;
        try {
            const res = await api.put<WorkspaceModuleApi>(
                `/workspaces/${workspaceId}/modules/${renameModuleId}`,
                {
                    name: renameValue.trim() || moduleToRename.name,
                    module_type: moduleToRename.type,
                    settings: buildSettings(moduleToRename),
                },
                {
                    params: {fields: fieldsToString(WORKSPACE_MODULE_FIELDS.LIST)},
                },
            );
            if (res.data && res.data.id) {
                const updated = mapApiModule(res.data);
                setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            } else {
                await fetchModules();
            }
            closeRenameModule();
        } catch (err) {
            await fetchModules();
        }
    };

    const duplicateModule = async (m: WorkspaceActivityModule) => {
        if (!Number.isFinite(workspaceId)) return;
        try {
            const res = await api.post<WorkspaceModuleApi>(
                `/workspaces/${workspaceId}/modules`,
                {
                    name: `${m.name} copy`,
                    module_type: m.type,
                    settings: buildSettings(m),
                },
                {
                    params: {fields: fieldsToString(WORKSPACE_MODULE_FIELDS.LIST)},
                },
            );
            if (res.data && res.data.id) {
                setModules((prev) => [...prev, mapApiModule(res.data)]);
            } else {
                await fetchModules();
            }
        } catch (err) {
            await fetchModules();
        }
    };

    const toggleModuleEnabled = async (id: number) => {
        if (!Number.isFinite(workspaceId)) return;
        const moduleToToggle = modules.find((m) => m.id === id);
        if (!moduleToToggle) return;
        const nextModule = {...moduleToToggle, enabled: !moduleToToggle.enabled};
        try {
            const res = await api.put<WorkspaceModuleApi>(
                `/workspaces/${workspaceId}/modules/${id}`,
                {
                    name: nextModule.name,
                    module_type: nextModule.type,
                    settings: buildSettings(nextModule),
                },
                {
                    params: {fields: fieldsToString(WORKSPACE_MODULE_FIELDS.LIST)},
                },
            );
            if (res.data && res.data.id) {
                const updated = mapApiModule(res.data);
                setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            } else {
                setModules((prev) => prev.map((m) => (m.id === id ? nextModule : m)));
            }
        } catch (err) {
            await fetchModules();
        }
    };

    const deleteModule = async (id: number) => {
        if (!Number.isFinite(workspaceId)) return;
        try {
            await api.delete(`/workspaces/${workspaceId}/modules/${id}`, {
                params: {hard: true},
            });
            setModules((prev) => prev.filter((m) => m.id !== id));
            setDeleteModuleId(null);
        } catch (err) {
            await fetchModules();
        }
    };

    const openCreateModule = (type: ActivityModuleType) => {
        setCreateModuleType(type);
        setIsCreateModuleOpen(true);
    };

    const closeCreateModule = () => setIsCreateModuleOpen(false);

    const createModule = async (
        type: ActivityModuleType,
        name: string,
        description: string,
        enabled: boolean,
        config: WorkspaceActivityModule['config'],
    ): Promise<WorkspaceActivityModule | undefined> => {
        if (!Number.isFinite(workspaceId)) return undefined;
        try {
            const res = await api.post<WorkspaceModuleApi>(
                `/workspaces/${workspaceId}/modules`,
                {
                    name,
                    module_type: type,
                    settings: {
                        ...config,
                        description,
                        enabled,
                    },
                },
                {
                    params: {fields: fieldsToString(WORKSPACE_MODULE_FIELDS.LIST)},
                },
            );
            if (res.data && res.data.id) {
                const created = mapApiModule(res.data);
                setModules((prev) => [...prev, created]);
                return created;
            }
            await fetchModules();
            return undefined;
        } catch (err) {
            await fetchModules();
            return undefined;
        }
    };

    return {
        modules,
        isLoading,
        error,
        isModuleDetailsOpen,
        moduleDetailsTab,
        selectedModuleId,
        selectedModule,
        moduleDraft,
        renameModuleId,
        renameValue,
        deleteModuleId,
        isCreateModuleOpen,
        createModuleType,
        setModuleDetailsTab,
        setModuleDraft,
        setRenameValue,
        openModuleDetails,
        closeModuleDetails,
        saveModuleDetails,
        openRenameModule,
        closeRenameModule,
        confirmRenameModule,
        duplicateModule,
        toggleModuleEnabled,
        setDeleteModuleId,
        deleteModule,
        openCreateModule,
        closeCreateModule,
        createModule,
    };
}
