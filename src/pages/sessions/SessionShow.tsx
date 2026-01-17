import { Button, Card, Text as GText, Loader } from '@gravity-ui/uikit';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from './SessionShow.module.css';
import { useSession } from './queries';
import NotFound from '@/components/NotFound/NotFound';

const SessionShow = () => {
    const { sessionId } = useParams<string>();
    const navigate = useNavigate();
    const sid = Number(sessionId);
    const isValidId = Number.isFinite(sid) && sid > 0;

    const { data, isLoading, isError } = useSession(sid);

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
            <NotFound
                title="Session Not Found"
                description="The session you're looking for doesn't exist or has been deleted."
                showBackButton
                showHomeButton
            />
        );
    }

    return (
        <div className={styles.page}>
            <Card type="container" view="raised" className={styles.card}>
                <div className={styles.header}>
                    <GText variant="header-2">{data.name}</GText>
                </div>
                <div className={styles.body}>
                    <GText variant="body-2" color="secondary">
                        {data.description || 'No description provided'}
                    </GText>
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
