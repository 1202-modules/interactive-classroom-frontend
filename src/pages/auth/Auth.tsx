import { Button, Card, Text } from '@gravity-ui/uikit';
import RegisterForm from '@/components/Forms/RegisterForm';
import LoginForm from '@/components/Forms/LoginForm';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Auth.module.css';

export default function Auth() {
    const location = useLocation();
    const navigate = useNavigate();
    const isLogin = location.pathname.endsWith('/login');

    const title = isLogin ? 'Log in' : 'Create account';
    const subtitle = isLogin
        ? 'Access your workspaces and manage live sessions.'
        : 'Set up your profile and start running interactive sessions.';

    const footerText = isLogin ? "Don’t have an account?" : 'Already have an account?';
    const footerCta = isLogin ? 'Create an account' : 'Log in';
    const footerTarget = isLogin ? '/auth/register' : '/auth/login';

    return (
        <div className={styles.container}>
            <Card view="outlined" className={styles.card}>
                <div className={styles.header}>
                    <Text variant="display-1">{title}</Text>
                    <Text variant="body-2" color="secondary">
                        {subtitle}
                    </Text>
                </div>

                <div className={styles.form}>{isLogin ? <LoginForm /> : <RegisterForm />}</div>

                <div className={styles.footer}>
                    <Text variant="body-2" color="secondary">
                        {footerText}
                    </Text>
                    <Button
                        view="flat"
                        size="s"
                        className={styles.linkButton}
                        onClick={() => navigate(footerTarget)}
                    >
                        {footerCta}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
