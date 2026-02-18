export interface SessionParticipantItem {
    id: number;
    display_name: string | null;
    participant_type: string;
    is_active: boolean;
    created_at?: string | null;
}

export interface SessionParticipantsResponse {
    participants: SessionParticipantItem[];
    total: number;
    active_count: number;
}

