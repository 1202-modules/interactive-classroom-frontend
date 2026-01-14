import React, { useEffect, useState } from 'react';
import { Card, Text, TextInput, Button } from '@gravity-ui/uikit';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { setUser } from '@/store/userSlice';
import { api } from '@/api/api';
import styles from './Profile.module.css';

type ValidationDetail = {
    type: string;
    loc: (string | number)[];
    msg: string;
    input: unknown;
    ctx?: Record<string, unknown>;
};

type BackendError = {
    detail?: string | ValidationDetail[];
};

const parseBackendError = (data: BackendError | string | undefined, fallback: string) => {
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail.length > 0) return data.detail[0].msg || fallback;
    return fallback;
};

export default function ProfileEdit() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { data: user } = useUser();

    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name ?? '');
            setLastName(user.last_name ?? '');
            setAvatarUrl(user.avatar_url ?? '');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!firstName.trim() || !lastName.trim()) {
            setError('First name and last name are required');
            return;
        }

        setIsLoading(true);

        try {
            const payload: { first_name: string; last_name: string; avatar_url?: string } = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
            };

            if (avatarUrl.trim()) {
                payload.avatar_url = avatarUrl.trim();
            }

            const res = await api.put('/users/me', payload);
            dispatch(setUser(res.data));
            setIsLoading(false);
            navigate(-1);
        } catch (err: any) {
            const message = parseBackendError(err.response?.data, 'Failed to update profile');
            setError(message);
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <Card
                type="container"
                view="raised"
                size="l"
                className={styles.card}
            >
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.header}>
                        <Text variant="header-2">Edit profile</Text>
                        <Text variant="body-2" color="secondary">
                            Update your personal information
                        </Text>
                    </div>

                    <div className={styles.fields}>
                        <div className={styles.field}>
                            <Text variant="body-2">First name *</Text>
                            <TextInput
                                placeholder="Enter first name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                size="l"
                                validationState={error && !firstName.trim() ? 'invalid' : undefined}
                            />
                        </div>

                        <div className={styles.field}>
                            <Text variant="body-2">Last name *</Text>
                            <TextInput
                                placeholder="Enter last name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                size="l"
                                validationState={error && !lastName.trim() ? 'invalid' : undefined}
                            />
                        </div>

                        <div className={styles.field}>
                            <Text variant="body-2">Avatar URL</Text>
                            <TextInput
                                placeholder="https://example.com/avatar.png"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                size="l"
                            />
                        </div>
                    </div>

                    {error && (
                        <Text variant="body-2" color="danger" className={styles.error}>
                            {error}
                        </Text>
                    )}

                    <div className={styles.footer}>
                        <Button
                            type="button"
                            view="flat"
                            size="l"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            view="action"
                            size="l"
                            loading={isLoading}
                        >
                            Save changes
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
