import { useState } from 'react';
import { Button, Card, Icon, Text } from '@gravity-ui/uikit';
import { TrashBin } from '@gravity-ui/icons';
import { useApi } from '@/shared/hooks/useApi';
import { useAuth } from '@/features/auth/useAuth';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/shared/store/authSlice';
import { setUser } from '@/shared/store/userSlice';
import type { AppDispatch } from '@/shared/store/store';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import { TextInput } from '@gravity-ui/uikit';
import './DeleteAccountCard.css';

export function DeleteAccountCard() {
    const api = useApi();
    const { accessToken } = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmText, setConfirmText] = useState('');

    const handleDelete = async () => {
        if (confirmText.toLowerCase() !== 'delete') return;
        if (!accessToken) return;
        setError(null);
        setDeleting(true);
        try {
            await api.delete('/users/me');
            dispatch(logout());
            dispatch(setUser(null));
            navigate('/login', { replace: true });
        } catch (err: unknown) {
            const message = parseBackendError(
                (err as { response?: { data?: unknown } })?.response?.data,
                'Failed to delete account'
            );
            setError(message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Card view="outlined" className="delete-account-card">
            <div className="delete-account-card__header">
                <Text variant="header-2">Delete Account</Text>
                <Text variant="body-2" color="secondary">
                    Permanently delete your account and all associated data.
                </Text>
            </div>
            <div className="delete-account-card__content">
                <Text variant="body-2" color="secondary" className="delete-account-card__hint">
                    This action cannot be undone. All your workspaces, sessions, and data will be permanently deleted.
                    Type <strong>delete</strong> below to confirm.
                </Text>
                <TextInput
                    value={confirmText}
                    onUpdate={setConfirmText}
                    placeholder="Type 'delete' to confirm"
                    className="delete-account-card__input"
                    disabled={deleting}
                    data-testid="delete-account-confirm"
                />
                {error && (
                    <Text variant="body-2" color="danger">
                        {error}
                    </Text>
                )}
                <Button
                    view="outlined-danger"
                    size="l"
                    disabled={confirmText.toLowerCase() !== 'delete' || deleting}
                    loading={deleting}
                    onClick={handleDelete}
                >
                    <Icon data={TrashBin} size={16} />
                    Delete Account
                </Button>
            </div>
        </Card>
    );
}
