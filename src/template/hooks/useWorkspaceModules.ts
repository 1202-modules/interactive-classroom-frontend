import { useState, useMemo, useEffect } from 'react';
import type { WorkspaceActivityModule, ActivityModuleType } from '../types/workspace';
import { moduleService } from '../services/moduleService';
// TODO: Replace with API call - import { getWorkspaceModules } from '../api/modules';

// Mock data - will be replaced with API call
const getMockModules = (): WorkspaceActivityModule[] => [
  {
    id: 1,
    type: 'questions',
    name: 'Main questions',
    description: 'Collect questions from participants with voting and moderation.',
    updated_at: '2026-01-17T10:40:00Z',
    enabled: true,
    used_in_sessions: 3,
    config: {
      type: 'questions',
      allow_anonymous: false,
      enable_upvotes: true,
      max_length: 240,
      cooldown_sec: 0,
    },
  },
  {
    id: 2,
    type: 'poll',
    name: 'Poll-1',
    description: 'Quick pulse-check poll with a word cloud mode.',
    updated_at: '2026-01-15T17:10:00Z',
    enabled: true,
    used_in_sessions: 1,
    config: {
      type: 'poll',
      question: "What do you think about today's topic?",
      answer_mode: 'options',
      word_cloud: true,
      options: ['Great', 'Okay', 'Confusing'],
    },
  },
  {
    id: 3,
    type: 'quiz',
    name: 'Quick Quiz',
    description: 'Single question quiz with timed answers.',
    updated_at: '2026-01-16T12:20:00Z',
    enabled: false,
    used_in_sessions: 0,
    config: {
      type: 'quiz',
      question: 'Which statement is correct?',
      time_limit_sec: 60,
      show_correct_answer: true,
      options: [
        { text: 'Option 1', correct: true },
        { text: 'Option 2', correct: false },
        { text: 'Option 3', correct: false },
      ],
    },
  },
  {
    id: 4,
    type: 'timer',
    name: 'Timer-1',
    description: 'Simple activity timer with optional sound and pause.',
    updated_at: '2026-01-14T09:05:00Z',
    enabled: true,
    used_in_sessions: 2,
    config: {
      type: 'timer',
      duration_sec: 120,
      enable_sound: true,
      allow_pause: true,
    },
  },
];

export function useWorkspaceModules(workspaceId?: number) {
  // TODO: Replace with API call - const [modules, setModules] = useState<WorkspaceActivityModule[]>([]);
  // TODO: useEffect(() => { getWorkspaceModules(workspaceId).then(setModules); }, [workspaceId]);
  const [modules, setModules] = useState<WorkspaceActivityModule[]>(() => getMockModules());
  const [isModuleDetailsOpen, setIsModuleDetailsOpen] = useState(false);
  const [moduleDetailsTab, setModuleDetailsTab] = useState<'overview' | 'settings' | 'content' | 'preview'>('overview');
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const selectedModule = useMemo(
    () => (selectedModuleId != null ? modules.find((m) => m.id === selectedModuleId) : undefined),
    [modules, selectedModuleId],
  );
  const [moduleDraft, setModuleDraft] = useState<WorkspaceActivityModule | null>(null);
  const [renameModuleId, setRenameModuleId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteModuleId, setDeleteModuleId] = useState<number | null>(null);
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [createModuleType, setCreateModuleType] = useState<ActivityModuleType>('poll');

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

  const saveModuleDetails = () => {
    if (!moduleDraft) return;
    // TODO: Replace with API call - await updateModule(moduleDraft.id, moduleDraft);
    const updated = moduleService.updateModule(moduleDraft.id, moduleDraft, modules);
    setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setIsModuleDetailsOpen(false);
  };

  const openRenameModule = (m: WorkspaceActivityModule) => {
    setRenameModuleId(m.id);
    setRenameValue(m.name);
  };

  const closeRenameModule = () => {
    setRenameModuleId(null);
    setRenameValue('');
  };

  const confirmRenameModule = () => {
    if (renameModuleId == null) return;
    // TODO: Replace with API call - await renameModule(renameModuleId, renameValue);
    const updated = moduleService.renameModule(renameModuleId, renameValue, modules);
    setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    closeRenameModule();
  };

  const duplicateModule = (m: WorkspaceActivityModule) => {
    // TODO: Replace with API call - const duplicated = await duplicateModule(m.id);
    const duplicated = moduleService.duplicateModule(m, modules);
    setModules((prev) => [...prev, duplicated]);
  };

  const toggleModuleEnabled = (id: number) => {
    // TODO: Replace with API call - await toggleModuleEnabled(id);
    const updated = moduleService.toggleEnabled(id, modules);
    setModules((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const deleteModule = (id: number) => {
    // TODO: Replace with API call - await deleteModule(id);
    setModules((prev) => moduleService.deleteModule(id, prev));
    setDeleteModuleId(null);
  };

  const openCreateModule = (type: ActivityModuleType) => {
    setCreateModuleType(type);
    setIsCreateModuleOpen(true);
  };

  const closeCreateModule = () => setIsCreateModuleOpen(false);

  const createModule = (
    type: ActivityModuleType,
    name: string,
    description: string,
    enabled: boolean,
    config: WorkspaceActivityModule['config'],
  ) => {
    // TODO: Replace with API call - const newModule = await createModule({ type, name, description, enabled, config });
    const newModule = moduleService.createModule(type, name, description, enabled, config, modules);
    setModules((prev) => [...prev, newModule]);
    return newModule;
  };

  return {
    modules,
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

