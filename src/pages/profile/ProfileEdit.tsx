import React, {useEffect, useState} from 'react';
import {Button, Card, Text as GText, TextInput} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';
import {useUser} from '@/hooks/useUser';
import {useDispatch} from 'react-redux';
import type {AppDispatch} from '@/store/store';
import {setUser} from '@/store/userSlice';
import {useApi} from '@/hooks/useApi';
import {USER_FIELDS, fieldsToString} from '@/api/fields';
import {parseBackendError} from '@/utils/parseBackendError';
import styles from './Profile.module.css';

export default function ProfileEdit() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const {data: user} = useUser();
    const api = useApi();

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
            const payload: {first_name: string; last_name: string; avatar_url?: string} = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
            };

            if (avatarUrl.trim()) {
                payload.avatar_url = avatarUrl.trim();
            }

            const fields = fieldsToString(USER_FIELDS.PROFILE);

            let nextUser = (await api.put('/users/me', payload, {params: {fields}})).data;

            // Some backends return empty body on update without fields; refetch to ensure state is fresh.
            if (!nextUser || typeof nextUser !== 'object' || !('first_name' in nextUser)) {
                nextUser = (await api.get('/users/me', {params: {fields}})).data;
            }

            dispatch(setUser(nextUser));
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
            <Card type="container" view="raised" size="l" className={styles.card}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.header}>
                        <GText variant="header-2">Edit profile</GText>
                        <GText variant="body-2" color="secondary">
                            Update your personal information
                        </GText>
                    </div>

                    <div className={styles.fields}>
                        <div className={styles.field}>
                            <GText variant="body-2">First name *</GText>
                            <TextInput
                                placeholder="Enter first name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                size="l"
                                validationState={error && !firstName.trim() ? 'invalid' : undefined}
                            />
                        </div>

                        <div className={styles.field}>
                            <GText variant="body-2">Last name *</GText>
                            <TextInput
                                placeholder="Enter last name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                size="l"
                                validationState={error && !lastName.trim() ? 'invalid' : undefined}
                            />
                        </div>

                        <div className={styles.field}>
                            <GText variant="body-2">Avatar URL</GText>
                            <TextInput
                                placeholder="https://example.com/avatar.png"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                size="l"
                            />
                        </div>
                    </div>

                    {error && (
                        <GText variant="body-2" color="danger" className={styles.error}>
                            {error}
                        </GText>
                    )}

                    <div className={styles.footer}>
                        <Button type="button" view="flat" size="l" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button type="submit" view="action" size="l" loading={isLoading}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
