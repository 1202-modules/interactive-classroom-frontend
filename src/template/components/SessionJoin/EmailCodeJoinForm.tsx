import { useState } from 'react';
import { Button, Text, TextInput } from '@gravity-ui/uikit';

interface EmailCodeJoinFormProps {
    onSubmit: (email: string) => void;
    isLoading?: boolean;
    error?: string | null;
    emailCodeDomainsWhitelist?: string[];
}

export function EmailCodeJoinForm({
    onSubmit,
    isLoading,
    error,
    emailCodeDomainsWhitelist,
}: EmailCodeJoinFormProps) {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
    };

    const getEmailPlaceholder = () => {
        if (emailCodeDomainsWhitelist && emailCodeDomainsWhitelist.length > 0) {
            return `email@${emailCodeDomainsWhitelist[0]}`;
        }
        return 'your.email@example.com';
    };

    return (
        <form onSubmit={handleSubmit}>
            <Text variant="header-2" style={{ marginBottom: '16px' }}>
                Join Session
            </Text>
            <Text variant="body-1" color="secondary" style={{ marginBottom: '24px' }}>
                Enter your email address to receive a verification code
            </Text>
            {emailCodeDomainsWhitelist && emailCodeDomainsWhitelist.length > 0 && (
                <Text variant="body-2" color="secondary" style={{ marginBottom: '16px' }}>
                    Allowed domains: {emailCodeDomainsWhitelist.join(', ')}
                </Text>
            )}
            {error && (
                <Text variant="body-2" color="danger" style={{ marginBottom: '16px' }}>
                    {error}
                </Text>
            )}
            <TextInput
                type="email"
                placeholder={getEmailPlaceholder()}
                value={email}
                onUpdate={setEmail}
                size="l"
                disabled={isLoading}
                validationState={error ? 'invalid' : undefined}
                style={{ marginBottom: '16px' }}
            />
            <Button
                type="submit"
                view="action"
                size="l"
                loading={isLoading}
                disabled={isLoading || !email.trim()}
                width="max"
            >
                Send Verification Code
            </Button>
        </form>
    );
}
