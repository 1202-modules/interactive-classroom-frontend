import { useState } from 'react';
import { Button, Text, TextInput } from '@gravity-ui/uikit';

interface AnonymousJoinFormProps {
    onSubmit: (displayName?: string) => void;
    isLoading?: boolean;
}

export function AnonymousJoinForm({ onSubmit, isLoading }: AnonymousJoinFormProps) {
    const [displayName, setDisplayName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(displayName.trim() || undefined);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Text variant="header-2" style={{ marginBottom: '16px' }}>
                Join Session
            </Text><br />
            <Text variant="body-1" color="secondary">
                Enter your name (optional) to join as an anonymous participant
            </Text>
            <TextInput
                placeholder="Your name (optional)"
                value={displayName}
                onUpdate={setDisplayName}
                size="l"
                disabled={isLoading}
                style={{ marginTop: '16px' }}
            />
            <Button
                type="submit"
                view="action"
                size="l"
                loading={isLoading}
                disabled={isLoading}
                width="max"
                style={{ marginTop: '16px' }}
            >
                Join Session
            </Button>
        </form>
    );
}
