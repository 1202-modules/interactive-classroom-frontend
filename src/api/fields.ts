/**
 * Typed field constants for API requests.
 * These constants ensure type safety and prevent typos in field names.
 */

export const WORKSPACE_FIELDS = {
    LIST: [
        'id',
        'name',
        'description',
        'status',
        'is_deleted',
        'participant_count',
        'session_count',
        'has_live_session',
        'live_session_name',
        'last_session_started_at',
        'created_at',
        'updated_at',
    ] as const,
    CARD: [
        'id',
        'name',
        'description',
        'status',
        'participant_count',
        'session_count',
        'has_live_session',
    ] as const,
} as const;

export const SESSION_FIELDS = {
    LIST: [
        'id',
        'workspace_id',
        'name',
        'description',
        'status',
        'is_stopped',
        'passcode',
        'participant_count',
        'stopped_participant_count',
        'start_datetime',
        'end_datetime',
        'created_at',
        'updated_at',
        'is_deleted',
    ] as const,
    PRESENTATION: [
        'id',
        'workspace_id',
        'name',
        'is_stopped',
        'passcode',
    ] as const,
    DETAILS: [
        'id',
        'workspace_id',
        'name',
        'is_stopped',
        'start_datetime',
        'end_datetime',
        'status',
        'passcode',
    ] as const,
    UPDATE: [
        'id',
        'name',
        'status',
        'is_stopped',
        'passcode',
        'participant_count',
        'stopped_participant_count',
        'start_datetime',
        'end_datetime',
        'updated_at',
    ] as const,
    RESTORE: [
        'id',
        'name',
        'status',
        'is_stopped',
        'passcode',
        'participant_count',
        'stopped_participant_count',
        'start_datetime',
        'end_datetime',
        'updated_at',
        'is_deleted',
    ] as const,
} as const;

export const SESSION_MODULE_FIELDS = {
    LIST: [
        'id',
        'session_id',
        'name',
        'module_type',
        'settings',
        'is_active',
    ] as const,
    DETAILS: [
        'id',
        'session_id',
        'name',
        'module_type',
        'settings',
        'is_active',
        'created_at',
        'updated_at',
    ] as const,
} as const;

export const WORKSPACE_MODULE_FIELDS = {
    LIST: [
        'id',
        'workspace_id',
        'name',
        'module_type',
        'settings',
        'created_at',
        'updated_at',
    ] as const,
} as const;

export const USER_FIELDS = {
    PROFILE: [
        'id',
        'email',
        'first_name',
        'last_name',
        'avatar_url',
        'updated_at',
    ] as const,
} as const;

/**
 * Helper function to convert field array to comma-separated string
 */
export function fieldsToString(fields: readonly string[]): string {
    return fields.join(',');
}
