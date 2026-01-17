import { Button, Card, Text as GText, Loader, TextArea, TextInput } from '@gravity-ui/uikit';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './SessionEdit.module.css';
import { useSession, useUpdateSession } from './queries';

const SessionEdit = () => {
    const { sessionId } = useParams<string>();
    const navigate = useNavigate();
    const sid = Number(sessionId);
    const isValidId = Number.isFinite(sid) && sid > 0;

    const { data, isLoading, isError } = useSession(sid);
    const updateSession = useUpdateSession();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (data) {
            setName(data.name ?? '');
            setDescription(data.description ?? '');
        }
    }, [data]);

    if (!isValidId) {
        return (
            <div className={styles.page}>
                <GText variant="body-2" color="danger">
                    Invalid session id
                </GText>
            </div>
        );
    }

    if (isLoading) {
        return <Loader className={styles.loader} />;
    }

    if (isError || !data) {
        return (
            <div className={styles.page}>
                <GText variant="body-2" color="danger">
                    Failed to load session
                </GText>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        updateSession.mutate(
            { sessionId: sid, payload: { name: name.trim(), description: description.trim() || null } },
            {
                onSuccess: () => navigate(`/sessions/${sid}`),
                onError: (err: any) => {
                    const message = err?.response?.data?.detail ?? 'Failed to update session';
                    setError(message);
                },
            },
        );
    };

    return (
        <div className={styles.page}>
            <Card type="container" view="raised" className={styles.card}>
                <div className={styles.header}>
                    <GText variant="header-2">Edit session</GText>
                    <GText variant="body-2" color="secondary">
                        Update session name and description
                    </GText>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <TextInput
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        size="l"
                        validationState={error && !name.trim() ? 'invalid' : undefined}
                    />

                    <TextArea
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        minRows={3}
                        maxRows={8}
                        size="l"
                    />

                    {error && (
                        <GText variant="body-2" color="danger">
                            {error}
                        </GText>
                    )}

                    <div className={styles.footer}>
                        <Button view="flat" type="button" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button view="action" type="submit" loading={updateSession.isPending}>
                            Save
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SessionEdit;
