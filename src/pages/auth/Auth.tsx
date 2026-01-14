import RegisterForm from '@/components/Forms/RegisterForm';
import React from 'react';
import {useLocation} from 'react-router-dom';
import styles from './Auth.module.css';
import LoginForm from '@/components/Forms/LoginForm';

export default function Auth() {
    const location = useLocation();
    const isLogin = location.pathname.endsWith('/login');

    return (
        <div className={styles.container}>
            <div className={styles.card}>{isLogin ? <LoginForm /> : <RegisterForm />}</div>
        </div>
    );
}
