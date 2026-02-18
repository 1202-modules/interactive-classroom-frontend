export interface Workspace {
    id: number;
    name: string;
    description: string | null;
    status: 'active' | 'archive' | 'trash' | string;
    is_deleted?: boolean;
    participant_count: number;
    session_count: number;
    has_live_session: boolean;
    live_session_name?: string | null;
    last_session_started_at: string | null;
    created_at: string;
    updated_at: string;
    template_settings?: Record<string, unknown> | null;
}

export type WorkspaceTab = 'sessions' | 'settings' | 'modules';

export type ActivityModuleType = 'questions' | 'poll' | 'quiz' | 'timer';

export type PollAnswerMode = 'options' | 'free' | 'mixed';

export type QuizTimeLimit = '30' | '60' | '90' | 'custom';

export type TimerDuration = '60' | '300' | '600' | 'custom';

export type QuestionsLengthLimitMode = 'compact' | 'moderate' | 'extended';

export type ActivityModuleConfig =
    | {
        type: 'questions';
        length_limit_mode: QuestionsLengthLimitMode;
        likes_enabled: boolean;
        allow_anonymous: boolean;
        cooldown_enabled: boolean;
        cooldown_seconds: number;
    }
    | {
        type: 'poll';
        question: string;
        answer_mode: PollAnswerMode;
        word_cloud: boolean;
        options: string[];
    }
    | {
        type: 'quiz';
        question: string;
        time_limit_sec: number;
        show_correct_answer: boolean;
        options: Array<{ text: string; correct: boolean }>;
    }
    | {
        type: 'timer';
        duration_seconds: number;
        sound_notification_enabled: boolean;
    };

export interface WorkspaceActivityModule {
    id: number;
    type: ActivityModuleType;
    name: string;
    description: string;
    updated_at: string;
    enabled: boolean;
    used_in_sessions: number;
    config: ActivityModuleConfig;
}

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
