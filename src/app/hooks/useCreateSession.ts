import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { parseBackendError } from '@/utils/parseBackendError';
import type { AxiosInstance } from 'axios';

interface UseCreateSessionOptions {
    workspaceId: number;
    api: AxiosInstance;
    onSuccess?: () => Promise<void>;
}

export function useCreateSession({ workspaceId, api, onSuccess }: UseCreateSessionOptions) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => {
        setError(null);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        if (isLoading) return;
        setIsOpen(false);
        setError(null);
        setName('');
        setDescription('');
    }, [isLoading]);

    const focusField = useCallback((fieldId: string) => {
        window.requestAnimationFrame(() => {
            const el = document.getElementById(fieldId) as
                | HTMLInputElement
                | HTMLTextAreaElement
                | null;
            el?.focus();
        });
    }, []);

    const submit = useCallback(async () => {
        const trimmedName = name.trim();
        const trimmedDescription = description.trim();

        if (trimmedName.length === 0) {
            setError('Session name is required.');
            focusField('create-session-name');
            return;
        }
        if (trimmedName.length > 200) {
            setError('Session name must be 200 characters or fewer.');
            focusField('create-session-name');
            return;
        }
        if (trimmedDescription.length > 1000) {
            setError('Session description must be 1000 characters or fewer.');
            focusField('create-session-description');
            return;
        }

        setError(null);
        setIsLoading(true);
        try {
            const res = await api.post(`/workspaces/${workspaceId}/sessions`, {
                name: trimmedName,
                description: trimmedDescription.length > 0 ? trimmedDescription : null,
            });
            const newSessionId = res?.data?.id;
            close();
            if (onSuccess) {
                await onSuccess();
            }
            if (newSessionId) {
                navigate(`/workspace/${workspaceId}/session/${newSessionId}`);
            }
        } catch (err: any) {
            const message = parseBackendError(
                err?.response?.data,
                'Failed to create session. Please try again.',
            );
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [name, description, workspaceId, api, navigate, close, onSuccess, focusField]);

    return {
        name,
        description,
        error,
        isLoading,
        isOpen,
        setName,
        setDescription,
        open,
        close,
        submit,
    };
}
