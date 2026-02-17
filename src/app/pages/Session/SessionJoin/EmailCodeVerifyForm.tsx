import { useState } from 'react';
import { Button, Text, TextInput } from '@gravity-ui/uikit';

interface EmailCodeVerifyFormProps {
    email: string;
    onSubmit: (code: string, displayName?: string) => void;
    isLoading?: boolean;
    error?: string | null;
    verificationCode?: string; // For development when SMTP is disabled
}

export function EmailCodeVerifyForm({
    email,
    onSubmit,
    isLoading,
    error,
    verificationCode,
}: EmailCodeVerifyFormProps) {
    const [code, setCode] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCode = code.trim();
        if (!trimmedCode) return;
        onSubmit(trimmedCode, displayName.trim() || undefined);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Text variant="header-2" style={{ marginBottom: '16px' }}>
                Verify Email
            </Text>
            <Text variant="body-1" color="secondary" style={{ marginBottom: '8px' }}>
                We sent a verification code to {email}
            </Text>
            {verificationCode && (
                <Text variant="body-2" color="secondary" style={{ marginBottom: '16px' }}>
                    Development mode: Your code is {verificationCode}
                </Text>
            )}
            {error && (
                <Text variant="body-2" color="danger" style={{ marginBottom: '16px' }}>
                    {error}
                </Text>
            )}
            <TextInput
                placeholder="Enter verification code"
                value={code}
                onUpdate={setCode}
                size="l"
                disabled={isLoading}
                validationState={error ? 'invalid' : undefined}
                style={{ marginBottom: '16px' }}
                autoFocus
            />
            <TextInput
                placeholder="Your name (optional)"
                value={displayName}
                onUpdate={setDisplayName}
                size="l"
                disabled={isLoading}
                style={{ marginBottom: '16px' }}
            />
            <Button
                type="submit"
                view="action"
                size="l"
                loading={isLoading}
                disabled={isLoading || !code.trim()}
                width="max"
            >
                Verify and Join
            </Button>
        </form>
    );
}
