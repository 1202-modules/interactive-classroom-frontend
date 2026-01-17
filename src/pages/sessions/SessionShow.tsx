import { Card, Loader, Text, Button } from '@gravity-ui/uikit';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from './SessionShow.module.css';
import { useSession } from './queries';

const SessionShow = () => {
    const { sessionId } = useParams<string>();
    const navigate = useNavigate();
    const sid = Number(sessionId);
    const isValidId = Number.isFinite(sid) && sid > 0;

    const { data, isLoading, isError } = useSession(sid);

    if (!isValidId) {
        return (
            <div className={styles.page}>
                <Text variant="body-2" color="danger">
                    Invalid session id
                </Text>
            </div>
        );
    }

    if (isLoading) {
        return <Loader className={styles.loader} />;
    }

    if (isError || !data) {
        return (
            <div className={styles.page}>
                <Text variant="body-2" color="danger">
                    Failed to load session
                </Text>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <Card type="container" view="raised" className={styles.card}>
                <div className={styles.header}>
                    <Text variant="header-2">{data.name}</Text>
                </div>
                <div className={styles.body}>
                    <Text variant="body-2" color="secondary">
                        {data.description || 'No description provided'}
                    </Text>
                </div>
                <div className={styles.footer}>
                    <Button view="action" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                    <Link to={`/workspaces/${data.workspace_id}`} style={{ textDecoration: 'none' }}>
                        <Button view="flat">To workspace</Button>
                    </Link>
                    <Link to={`/sessions/${data.id}/edit`} style={{ textDecoration: 'none' }}>
                        <Button view="outlined">Edit</Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default SessionShow;
