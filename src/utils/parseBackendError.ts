/**
 * Parse API error response into a user-facing message.
 */

export type ValidationDetail = {
    type: string;
    loc: (string | number)[];
    msg: string;
    input: unknown;
    ctx?: Record<string, unknown>;
};

export type BackendError = {
    detail?: string | ValidationDetail[];
};

export function parseBackendError(
    data: BackendError | string | undefined,
    fallback: string
): string {
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail[0].msg || fallback;
    }
    return fallback;
}
