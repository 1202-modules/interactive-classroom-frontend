import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Checkbox, Text, TextInput } from '@gravity-ui/uikit';
import { AxiosError } from 'axios';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { setCredentials } from '@/store/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { setUser, setUserError, setUserLoading } from '@/store/userSlice';
import { api } from '@/api/api';
import { parseBackendError } from '@/utils/parseBackendError';
import { isValidEmail, validateEmail, validatePasswordMinLength } from '@/utils/validation';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import './Auth.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from || '/';

    const dispatch = useDispatch<AppDispatch>();
    const { accessToken } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const canSubmit = useMemo(
        () => isValidEmail(email) && password.length >= 6,
        [email, password],
    );

    const onSubmit = async () => {
        setError(null);

        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }
        const passwordError = validatePasswordMinLength(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        const e = email.trim();
        setIsLoading(true);
        try {
            const res = await api.post('/auth/login', {
                email: e,
                password,
            });

            const {
                access_token: token,
                user_id: userId,
                email: userEmail,
            } = res.data as {
                access_token: string;
                user_id: number;
                email: string;
            };

            dispatch(
                setCredentials({
                    accessToken: token,
                    userId,
                    email: userEmail,
                }),
            );

            try {
                dispatch(setUserLoading(true));
                const userRes = await api.get('/users/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                dispatch(setUser(userRes.data));
                dispatch(setUserError(null));

                const profile = userRes.data as { first_name?: string; last_name?: string };

                if (!profile.first_name || !profile.last_name) {
                    navigate('/profile/edit', { replace: true });
                } else {
                    navigate(from, { replace: true });
                }
            } catch {
                dispatch(setUserError('Failed to load user'));
                navigate(from, { replace: true });
            } finally {
                dispatch(setUserLoading(false));
            }
        } catch (err) {
            const axiosErr = err as AxiosError<{ detail?: string | Array<{ msg?: string }> }>;
            const message = parseBackendError(axiosErr.response?.data, 'Invalid email or password');
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (accessToken) {
        return <Navigate to={from} replace />;
    }

    return (
        <div className="auth-page">
            <Card view="outlined" className="auth-page__card">
                <PageHeader
                    title="Log in"
                    subtitle="Access your workspaces and manage live sessions."
                />

                {error && <Alert theme="danger" title="Could not log in" message={error} />}

                <div className="auth-page__form">
                    <div className="auth-page__field">
                        <Text variant="body-1">Email</Text>
                        <TextInput
                            value={email}
                            onUpdate={setEmail}
                            size="l"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="auth-page__field">
                        <Text variant="body-1">Password</Text>
                        <TextInput
                            value={password}
                            onUpdate={setPassword}
                            size="l"
                            type="password"
                            placeholder="Enter your password"
                        />
                    </div>

                    <div className="auth-page__row">
                        <Checkbox checked={rememberMe} onUpdate={setRememberMe} size="l">
                            Remember me
                        </Checkbox>
                        <Button view="flat" size="s" className="auth-page__link" title="WIP">
                            Forgot password?
                        </Button>
                    </div>

                    <div className="auth-page__actions">
                        <Button
                            view="action"
                            size="l"
                            disabled={!canSubmit}
                            loading={isLoading}
                            onClick={onSubmit}
                        >
                            Log in
                        </Button>
                        <Button view="outlined" size="l" title="WIP">
                            Continue with Google (WIP)
                        </Button>
                    </div>
                </div>

                <div className="auth-page__footer">
                    <Text variant="body-2" color="secondary">
                        Don’t have an account?
                    </Text>
                    <Button
                        view="flat"
                        size="s"
                        className="auth-page__link"
                        onClick={() => navigate('/register')}
                    >
                        Create an account
                    </Button>
                </div>
            </Card>
        </div>
    );
}
