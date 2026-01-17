import {Button, Card, Text as GText} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';
import styles from './NotFound.module.css';

interface NotFoundProps {
    title?: string;
    description?: string;
    showBackButton?: boolean;
    showHomeButton?: boolean;
}

const NotFound = ({
    title = 'Not Found',
    description = 'The requested resource could not be found.',
    showBackButton = true,
    showHomeButton = true,
}: NotFoundProps) => {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <Card type="container" view="raised" className={styles.card}>
                <div className={styles.content}>
                    <div className={styles.errorCode}>404</div>
                    <GText variant="header-1" color="secondary" className={styles.title}>
                        {title}
                    </GText>
                    <GText variant="body-2" color="secondary" className={styles.description}>
                        {description}
                    </GText>
                    <div className={styles.actions}>
                        {showBackButton && (
                            <Button onClick={() => navigate(-1)} view="action">
                                Go Back
                            </Button>
                        )}
                        {showHomeButton && (
                            <Button onClick={() => navigate('/')} view="outlined">
                                Go Home
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default NotFound;
