import { Button, Text } from '@gravity-ui/uikit'
import React from 'react'
import { Link, replace, useLocation, useNavigate } from 'react-router-dom'
import styles from './Forms.module.css'
import { useAuth } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { logout } from '@/store/authSlice';
import { setUser } from '@/store/userSlice';

export default function LogoutForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from || '/';
    const dispatch = useDispatch<AppDispatch>()

    const handleSubmit = async (e : React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(logout())
        dispatch(setUser(null));
        navigate('/auth/login', { replace: true });
    }

    const handleCancelButton = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        navigate(from, {replace: true})
    }

    return (
        <form onSubmit={handleSubmit} className={styles.formFlex}>
            <Text variant="header-2">Confirmation</Text>
            <div style={{display: 'flex', gap: '10px'}}>
                <Button type="submit" view="action" size="l" color="primary">
                    Logout
                </Button>
                <Button type="button" view="normal" size="l" color="primary" onClick={handleCancelButton}>
                    Cancel
                </Button>
            </div>
        </form>
    )
}
