/**
 * Shared validation helpers for forms (auth, etc.).
 */

const MIN_PASSWORD_LENGTH = 6;

export function isValidEmail(value: string): boolean {
    const trimmed = value.trim();
    return trimmed.length > 0 && trimmed.includes('@');
}

export function validateEmail(value: string): string | null {
    if (!value.trim()) return 'Email is required.';
    if (!value.trim().includes('@')) return 'Enter a valid email address.';
    return null;
}

export function validatePasswordMinLength(
    password: string,
    minLength: number = MIN_PASSWORD_LENGTH,
): string | null {
    if (password.length < minLength) {
        return `Password must be at least ${minLength} characters.`;
    }
    return null;
}
