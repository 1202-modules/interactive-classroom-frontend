import {Button, Text as GText, PasswordInput, TextInput} from '@gravity-ui/uikit';
import React, {useState} from 'react';
import styles from './Forms.module.css';
import {AxiosError} from 'axios';
import {Link, Navigate, useLocation, useNavigate} from 'react-router-dom';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '@/store/store';
import {setCredentials} from '@/store/authSlice';
import {useAuth} from '@/hooks/useAuth';
import {setUser, setUserError, setUserLoading} from '@/store/userSlice';
import {api} from '@/api/api';

type LoginFormState = {
    email: string;
    password: string;
};

type ValidationDetail = {
    type: string;
    loc: (string | number)[];
    msg: string;
    input: unknown;
    ctx?: Record<string, unknown>;
};

type BackendError = {
    detail?: string | ValidationDetail[];
};

export default function LoginForm() {
    const navigate = useNavigate();

    const location = useLocation();
    const from = (location.state as {from?: string})?.from || '/';

    const {accessToken} = useAuth();

    const dispatch = useDispatch<AppDispatch>();

    const [form, setForm] = useState<LoginFormState>({
        email: '',
        password: '',
    });

    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const parseBackendError = (data: BackendError | string | undefined, fallback: string) => {
        if (!data) return fallback;

        if (typeof data === 'string') {
            return data;
        }

        if (typeof data.detail === 'string') {
            return data.detail;
        }

        if (Array.isArray(data.detail) && data.detail.length > 0) {
            return data.detail[0].msg || fallback;
        }

        return fallback;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await api.post('/auth/login', {
                email: form.email,
                password: form.password,
            });

            const {
                access_token: accessToken,
                user_id: userId,
                email,
            } = res.data as {
                access_token: string;
                user_id: number;
                email: string;
            };

            dispatch(
                setCredentials({
                    accessToken: accessToken,
                    userId: userId,
                    email,
                }),
            );

            try {
                dispatch(setUserLoading(true));
                const userRes = await api.get('/users/me', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                dispatch(setUser(userRes.data));
                dispatch(setUserError(null));

                const profile = userRes.data as {
                    first_name?: string;
                    last_name?: string;
                };

                setIsLoading(false);

                if (!profile.first_name || !profile.last_name) {
                    navigate('/profile/edit', {replace: true});
                } else {
                    navigate(from, {replace: true});
                }
            } catch {
                dispatch(setUserError('Failed to load user'));
                setIsLoading(false);
                navigate(from, {replace: true}); // fallback
            } finally {
                dispatch(setUserLoading(false));
            }
        } catch (err) {
            const error = err as AxiosError<BackendError | string>;
            const message = parseBackendError(error.response?.data, 'Invalid email or password');
            setError(message);
            setIsLoading(false);
        }
    };

    if (accessToken) {
        return <Navigate to={from || '/'} replace />;
    }

    return (
        <form onSubmit={handleSubmit} className={styles.formFlex}>
            <GText variant="header-2">Authorization</GText>

            <TextInput
                placeholder="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                size="l"
                validationState={error ? 'invalid' : undefined}
                errorMessage={error}
                type="email"
            />

            <PasswordInput
                placeholder="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                size="l"
                validationState={error ? 'invalid' : undefined}
                errorMessage={error}
            />

            <Button type="submit" view="action" size="l" color="primary" loading={isLoading}>
                Sign in
            </Button>

            <Link to="/auth/register">No account? Register</Link>
        </form>
    );
}
