export interface SessionParticipantItem {
    id: number;
    display_name: string | null;
    participant_type: string;
    guest_email?: string | null;
    is_active: boolean;
    is_banned?: boolean;
    created_at?: string | null;
}

export interface SessionParticipantsResponse {
    participants: SessionParticipantItem[];
    total: number;
    active_count: number;
    max_participants?: number | null;
}

