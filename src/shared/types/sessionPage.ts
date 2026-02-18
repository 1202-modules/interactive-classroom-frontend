// API response types for session detail page
export type SessionInfo = {
    id: number;
    workspace_id: number;
    name: string;
    description?: string | null;
    is_stopped: boolean;
    start_datetime?: string | null;
    end_datetime?: string | null;
    status?: string | null;
    passcode?: string | null;
    /** Merged session settings (template + custom) */
    settings?: Record<string, unknown> | null;
};

export type SessionModuleApi = {
    id: number;
    session_id: number;
    name: string | null;
    module_type: SessionModule['type'];
    settings: Record<string, unknown> | null;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
};

// Participant types
export type Participant = {
    id: number;
    name: string;
    joined_at: string;
    is_active: boolean;
    auth_type: 'anonymous' | 'registered' | 'sso' | 'email';
    is_banned?: boolean;
};

// Session module (в сессии)
export type SessionModule = {
    id: string; // unique id для dnd
    module_id: number; // ref к workspace module
    order: number;
    is_active: boolean;
    name: string;
    type: 'questions' | 'poll' | 'quiz' | 'timer';
    config: Record<string, unknown>;
};

// Полная информация о сессии для админ-панели
export type SessionDetail = {
    id: number;
    workspace_id: number;
    name: string;
    passcode: string;
    is_stopped: boolean;
    participants_count: number;
    active_module_id: string | null;
    session_modules: SessionModule[];
    created_at: string;
    started_at: string | null;
};
