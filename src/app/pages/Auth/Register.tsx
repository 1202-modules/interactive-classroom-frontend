import { useMemo, useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Checkbox, Divider, Text, TextInput } from '@gravity-ui/uikit';
import { AxiosError } from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/api/api';
import { parseBackendError } from '@/utils/parseBackendError';
import { validateEmail, validatePasswordMinLength } from '@/utils/validation';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import './Auth.css';

const RESEND_COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from || '/';
    const { accessToken } = useAuth();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);

    const [regError, setRegError] = useState<string>('');
    const [confirmError, setConfirmError] = useState<string>('');
    const [resendError, setResendError] = useState<string>('');
    const [resendSuccess, setResendSuccess] = useState<string>('');

    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isCodeLoading, setIsCodeLoading] = useState(false);
    const [isResendLoading, setIsResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const canSubmit = useMemo(() => {
        return (
            firstName.trim().length > 0 &&
            lastName.trim().length > 0 &&
            email.trim().length > 0 &&
            password.length > 0 &&
            confirmPassword.length > 0 &&
            agree
        );
    }, [firstName, lastName, email, password, confirmPassword, agree]);

    const registerRequest = async () => {
        try {
            const res = await api.post('/auth/register', {
                email: email.trim(),
                password,
                confirmPassword,
            });
            setRegError('');
            setIsCodeSent(true);
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            return res.data;
        } catch (err) {
            const axiosErr = err as AxiosError<{ detail?: string | Array<{ msg?: string }> }>;
            const message = parseBackendError(axiosErr.response?.data, 'Ошибка регистрации');
            setRegError(message);
            return err;
        }
    };

    const resendCodeRequest = async () => {
        try {
            const res = await api.post('/auth/resend-code', {
                email: email.trim(),
            });

            setResendError('');
            setResendSuccess('Verification code resent to your email');
            setResendCooldown(RESEND_COOLDOWN_SECONDS);

            return res.data;
        } catch (err) {
            const axiosErr = err as AxiosError<{ detail?: string | Array<{ msg?: string }> }>;
            const message = parseBackendError(axiosErr.response?.data, 'Error');
            setResendSuccess('');
            setResendError(message);
            return err;
        } finally {
            setIsResendLoading(false);
        }
    };

    const onSubmit = async () => {
        setRegError('');

        const emailError = validateEmail(email);
        if (emailError) {
            setRegError(emailError);
            return;
        }
        const passwordError = validatePasswordMinLength(password);
        if (passwordError) {
            setRegError(passwordError);
            return;
        }
        if (password !== confirmPassword) {
            setRegError('Passwords do not match.');
            return;
        }
        if (!agree) {
            setRegError('You must accept the Terms to create an account.');
            return;
        }

        await registerRequest();
    };

    const handleSubmitCodeConfirmation = async () => {
        if (!email.trim()) {
            setConfirmError('Email is empty');
            return;
        }
        setIsCodeLoading(true);
        await api
            .post('/auth/verify-email', { email: email.trim(), code: confirmPassword })
            .then(() => {
                setConfirmError('');
                setIsCodeLoading(false);
                navigate('/login');
            })
            .catch((err: AxiosError<{ detail?: string | Array<{ msg?: string }> }>) => {
                const message = parseBackendError(err.response?.data, 'Error');
                setConfirmError(message);
                setIsCodeLoading(false);
            });
    };

    const handleResendClick = async () => {
        if (!email.trim()) {
            setResendError('Email is empty');
            return;
        }
        if (resendCooldown > 0) {
            return;
        }
        setIsResendLoading(true);
        await resendCodeRequest();
    };

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(id);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [resendCooldown]);

    if (accessToken) {
        return <Navigate to={from} replace />;
    }

    return (
        <div className="auth-page">
            <Card view="outlined" className="auth-page__card">
                <PageHeader
                    title="Create account"
                    subtitle="Set up your profile and start running interactive sessions."
                />

                {regError && (
                    <Alert theme="danger" title="Could not create account" message={regError} />
                )}

                <div className="auth-page__form">
                    <div className="auth-page__field">
                        <Text variant="body-1">First name</Text>
                        <TextInput
                            value={firstName}
                            onUpdate={setFirstName}
                            size="l"
                            placeholder="John"
                        />
                    </div>

                    <div className="auth-page__field">
                        <Text variant="body-1">Last name</Text>
                        <TextInput
                            value={lastName}
                            onUpdate={setLastName}
                            size="l"
                            placeholder="Doe"
                        />
                    </div>

                    <Divider />

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
                            placeholder="Create a password"
                        />
                    </div>

                    <div className="auth-page__field">
                        <Text variant="body-1">Confirm password</Text>
                        <TextInput
                            value={confirmPassword}
                            onUpdate={setConfirmPassword}
                            size="l"
                            type="password"
                            placeholder="Repeat the password"
                        />
                    </div>

                    <Checkbox checked={agree} onUpdate={setAgree} size="l">
                        I agree to the Terms and Privacy Policy (WIP)
                    </Checkbox>

                    <div className="auth-page__actions">
                        <Button view="action" size="l" disabled={!canSubmit} onClick={onSubmit}>
                            Create account
                        </Button>
                        {isCodeSent && (
                            <>
                                <Text variant="body-2" color="secondary">
                                    Enter the verification code sent to your email
                                </Text>
                                <TextInput
                                    value={confirmPassword}
                                    onUpdate={setConfirmPassword}
                                    size="l"
                                    placeholder="Code from Email"
                                />
                                <Button
                                    view="action"
                                    size="l"
                                    loading={isCodeLoading}
                                    onClick={handleSubmitCodeConfirmation}
                                >
                                    Verify Email
                                </Button>
                                <Button
                                    view="outlined"
                                    size="l"
                                    loading={isResendLoading}
                                    onClick={handleResendClick}
                                    disabled={resendCooldown > 0}
                                >
                                    {resendCooldown > 0
                                        ? `Send code again (${resendCooldown}s)`
                                        : 'Send code again'}
                                </Button>
                                {resendError && (
                                    <Text color="danger" variant="body-2">
                                        {resendError}
                                    </Text>
                                )}
                                {resendSuccess && (
                                    <Text color="positive" variant="body-2">
                                        {resendSuccess}
                                    </Text>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="auth-page__footer">
                    <Text variant="body-2" color="secondary">
                        Already have an account?
                    </Text>
                    <Button
                        view="flat"
                        size="s"
                        className="auth-page__link"
                        onClick={() => navigate('/login')}
                    >
                        Log in
                    </Button>
                </div>
            </Card>
        </div>
    );
}
