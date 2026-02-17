export interface QuestionsModuleSettings {
    likes_enabled: boolean;
    allow_participant_answers: boolean;
    length_limit_mode: 'compact' | 'moderate' | 'extended' | string;
    max_length: number;
    cooldown_enabled?: boolean;
    cooldown_seconds?: number;
    max_questions_total?: number | null;
}

export interface QuestionMessageItem {
    id: number;
    session_module_id: number;
    participant_id: number;
    author_display_name: string | null;
    parent_id: number | null;
    content: string;
    likes_count: number;
    is_answered: boolean;
    created_at: string | null;
    children: QuestionMessageItem[];
}

export interface QuestionMessagesResponse {
    messages: QuestionMessageItem[];
    settings?: QuestionsModuleSettings | null;
}

export interface CreateQuestionMessageRequest {
    content: string;
    parent_id?: number;
}

