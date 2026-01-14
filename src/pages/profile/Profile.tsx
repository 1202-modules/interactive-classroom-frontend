import {Avatar, Button, Card, Text as GText} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';
import {useUser} from '@/hooks/useUser';
import styles from './Profile.module.css';

export default function Profile() {
    const navigate = useNavigate();
    const {data: user} = useUser();

    return (
        <div className={styles.page}>
            <Card type="container" view="raised" size="l" className={styles.card}>
                <div className={styles.header}>
                    <GText variant="header-2">User Profile</GText>
                </div>

                <div className={styles.fields}>
                    <div className={styles.field}>
                        <Avatar
                            text={user?.avatar_url ? '' : `${user?.first_name} ${user?.last_name}`}
                            imgUrl={user?.avatar_url}
                            size="xl"
                            className={styles.avatar}
                        />
                        <GText
                            variant="header-2"
                            className={styles.name}
                        >{`${user?.first_name} ${user?.last_name}`}</GText>
                    </div>
                </div>
                <div className={styles.footer}>
                    <Button
                        onClick={() => {
                            navigate('/profile/edit');
                        }}
                        view="action"
                    >
                        Edit profile
                    </Button>
                </div>
            </Card>
        </div>
    );
}
