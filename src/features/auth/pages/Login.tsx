import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Checkbox, Text, TextInput, Tooltip } from '@gravity-ui/uikit';
import { AxiosError } from 'axios';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/shared/store/store';
import { setCredentials } from '@/shared/store/authSlice';
import { setUser, setUserError, setUserLoading } from '@/shared/store/userSlice';
import { api } from '@/shared/api/api';
import { useAuth } from '../useAuth';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import { isValidEmail, validateEmail, validatePasswordMinLength } from '@/shared/utils/validation';
import { PageHeader } from '@/shared/components/PageHeader';
import { PasswordInput } from '../components/PasswordInput';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import './Auth.css';

const WIP_TOOLTIP = 'WIP (Work In Progress)';
const TOOLTIP_SHOW_MS = 2000;

function ForgotPasswordButton() {
    const [open, setOpen] = useState(false);
    const handleClick = () => {
        setOpen(true);
        window.setTimeout(() => setOpen(false), TOOLTIP_SHOW_MS);
    };
    return (
        <Tooltip content={WIP_TOOLTIP} open={open} onOpenChange={(o: boolean) => !o && setOpen(false)}>
            <Button view="flat" size="s" className="auth-page__link" onClick={handleClick}>
                Forgot password?
            </Button>
        </Tooltip>
    );
}

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from || '/';
    const prefilledEmail = (location.state as { prefilledEmail?: string })?.prefilledEmail;

    const dispatch = useDispatch<AppDispatch>();
    const { accessToken } = useAuth();

    const [email, setEmail] = useState(prefilledEmail ?? '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
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
                remember_me: rememberMe,
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
                    navigate('/profile', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            } catch {
                dispatch(setUserError('Failed to load user'));
                navigate('/dashboard', { replace: true });
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
                        <PasswordInput
                            value={password}
                            onUpdate={setPassword}
                            size="l"
                            placeholder="Enter your password"
                        />
                    </div>

                    <div className="auth-page__row">
                        <Checkbox checked={rememberMe} onUpdate={setRememberMe} size="l">
                            Remember me
                        </Checkbox>
                        <ForgotPasswordButton />
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
                        <div className="auth-page__social-row">
                            <SocialAuthButtons />
                        </div>
                    </div>
                </div>

                <div className="auth-page__footer">
                    <Text variant="body-2" color="secondary">
                        Don’t have an account?
                    </Text>
                    <Button
                        view="outlined"
                        size="l"
                        width="max"
                        className="auth-page__link auth-page__link--primary"
                        onClick={() => navigate('/register')}
                    >
                        Create an account
                    </Button>
                </div>
            </Card>
        </div>
    );
}
