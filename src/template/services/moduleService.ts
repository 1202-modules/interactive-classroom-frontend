import type {
  ActivityModuleType,
  ActivityModuleConfig,
  WorkspaceActivityModule,
  PollAnswerMode,
  QuizTimeLimit,
  TimerDuration,
} from '../types/workspace';

/**
 * ModuleService - Business logic for workspace activity modules
 * TODO: When integrating with API, these methods should become async and call API endpoints:
 * - createModule -> POST /workspaces/{id}/modules
 * - updateModule -> PUT /workspaces/{id}/modules/{id}
 * - deleteModule -> DELETE /workspaces/{id}/modules/{id}
 * - duplicateModule -> POST /workspaces/{id}/modules/{id}/duplicate
 * - renameModule -> PATCH /workspaces/{id}/modules/{id}/name
 * - toggleEnabled -> PATCH /workspaces/{id}/modules/{id}/enabled
 */
export class ModuleService {
  /**
   * Create a new module from form data
   * TODO: Make async and call API: POST /workspaces/{workspaceId}/modules
   */
  createModule(
    type: ActivityModuleType,
    name: string,
    description: string,
    enabled: boolean,
    config: ActivityModuleConfig,
    existingModules: WorkspaceActivityModule[],
  ): WorkspaceActivityModule {
    const nextId = existingModules.reduce((acc, x) => Math.max(acc, x.id), 0) + 1;
    return {
      id: nextId,
      type,
      name,
      description,
      enabled,
      used_in_sessions: 0,
      updated_at: new Date().toISOString(),
      config,
    };
  }

  /**
   * Update an existing module
   * TODO: Make async and call API: PUT /workspaces/{workspaceId}/modules/{id}
   */
  updateModule(
    id: number,
    updates: Partial<WorkspaceActivityModule>,
    existingModules: WorkspaceActivityModule[],
  ): WorkspaceActivityModule {
    const module = existingModules.find((m) => m.id === id);
    if (!module) {
      throw new Error(`Module with id ${id} not found`);
    }
    return {
      ...module,
      ...updates,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Delete a module
   * TODO: Make async and call API: DELETE /workspaces/{workspaceId}/modules/{id}
   */
  deleteModule(id: number, existingModules: WorkspaceActivityModule[]): WorkspaceActivityModule[] {
    return existingModules.filter((m) => m.id !== id);
  }

  /**
   * Duplicate a module
   */
  duplicateModule(module: WorkspaceActivityModule, existingModules: WorkspaceActivityModule[]): WorkspaceActivityModule {
    const nextId = existingModules.reduce((acc, x) => Math.max(acc, x.id), 0) + 1;
    return {
      ...JSON.parse(JSON.stringify(module)),
      id: nextId,
      name: `${module.name} copy`,
      used_in_sessions: 0,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Rename a module
   */
  renameModule(
    id: number,
    newName: string,
    existingModules: WorkspaceActivityModule[],
  ): WorkspaceActivityModule {
    return this.updateModule(
      id,
      { name: newName.trim() || existingModules.find((m) => m.id === id)?.name || 'Unnamed' },
      existingModules,
    );
  }

  /**
   * Toggle module enabled state
   */
  toggleEnabled(
    id: number,
    existingModules: WorkspaceActivityModule[],
  ): WorkspaceActivityModule {
    const module = existingModules.find((m) => m.id === id);
    if (!module) {
      throw new Error(`Module with id ${id} not found`);
    }
    return this.updateModule(id, { enabled: !module.enabled }, existingModules);
  }

  /**
   * Build config for poll module
   */
  buildPollConfig(
    question: string,
    answerMode: PollAnswerMode,
    wordCloud: boolean,
    options: string[],
  ): ActivityModuleConfig {
    return {
      type: 'poll',
      question,
      answer_mode: answerMode,
      word_cloud: wordCloud,
      options,
    };
  }

  /**
   * Build config for quiz module
   */
  buildQuizConfig(
    question: string,
    timeLimit: QuizTimeLimit,
    customTimeLimit: string,
    showCorrectAnswer: boolean,
    options: Array<{ text: string; correct: boolean }>,
  ): ActivityModuleConfig {
    const timeLimitSec =
      timeLimit === 'custom'
        ? Number.parseInt(customTimeLimit, 10) || 60
        : Number.parseInt(timeLimit, 10);
    return {
      type: 'quiz',
      question,
      time_limit_sec: timeLimitSec,
      show_correct_answer: showCorrectAnswer,
      options,
    };
  }

  /**
   * Build config for questions module
   */
  buildQuestionsConfig(
    allowAnonymous: boolean,
    enableUpvotes: boolean,
    maxLength: string,
    cooldownSec: string,
  ): ActivityModuleConfig {
    return {
      type: 'questions',
      allow_anonymous: allowAnonymous,
      enable_upvotes: enableUpvotes,
      max_length: Number.parseInt(maxLength, 10) || 240,
      cooldown_sec: Number.parseInt(cooldownSec, 10) || 0,
    };
  }

  /**
   * Build config for timer module
   */
  buildTimerConfig(
    duration: TimerDuration,
    customDurationSec: string,
    enableSound: boolean,
    allowPause: boolean,
  ): ActivityModuleConfig {
    const durationSec =
      duration === 'custom'
        ? Number.parseInt(customDurationSec, 10) || 120
        : Number.parseInt(duration, 10);
    return {
      type: 'timer',
      duration_sec: durationSec,
      enable_sound: enableSound,
      allow_pause: allowPause,
    };
  }
}

export const moduleService = new ModuleService();

