import LogoutForm from '@/components/Forms/LogoutForm';
import styles from './Auth.module.css';

export default function Logout() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <LogoutForm />
            </div>
        </div>
    );
}
