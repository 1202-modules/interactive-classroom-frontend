export type SessionStatus = 'active' | 'archive' | 'trash';

export interface Session {
    id: number;
    workspace_id: number;
    name: string;
    status: SessionStatus | string;
    is_stopped: boolean;
    passcode?: string;
    description?: string | null;
    participant_count: number;
    stopped_participant_count?: number;
    start_datetime?: string | null;
    end_datetime?: string | null;
    settings?: Record<string, unknown>;
    started_at?: string | null; // legacy field
    created_at: string;
    updated_at: string;
}
