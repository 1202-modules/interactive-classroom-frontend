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
    detail?: string | ValidationDetail[] | Array<{ msg?: string }>;
};

export function parseBackendError(
    data: BackendError | string | undefined,
    fallback: string
): string {
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (typeof (data as BackendError).detail === 'string') return (data as BackendError).detail as string;
    const detail = (data as BackendError).detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0];
        const msg = typeof first === 'object' && first && 'msg' in first ? first.msg : (first as ValidationDetail).msg;
        return msg || fallback;
    }
    return fallback;
}
