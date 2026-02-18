import { useMemo, useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Checkbox, Divider, Text, TextInput } from '@gravity-ui/uikit';
import { AxiosError } from 'axios';
import { useAuth } from '../useAuth';
import { api } from '@/shared/api/api';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import { validateEmail, validatePasswordMinLength } from '@/shared/utils/validation';
import { PageHeader } from '@/shared/components/PageHeader';
import { PasswordInput } from '../components/PasswordInput';
import './Auth.css';

const RESEND_COOLDOWN_SECONDS = 60;
const ALREADY_PENDING_MARKER = 'already pending';
const ALREADY_EXISTS_MARKER = 'already exists';
const EMAIL_ALREADY_TAKEN_MESSAGE = 'This email is already taken.';
const EMAIL_UNAVAILABLE_MESSAGE =
    'This email address is unavailable or cannot receive mail. Please use a different address.';

function trySaveCredentials(email: string, password: string) {
    if (typeof window !== 'undefined' && 'PasswordCredential' in window && 'credentials' in navigator && password) {
        try {
            const Cred = (window as unknown as { PasswordCredential: new (o: { id: string; password: string }) => Credential }).PasswordCredential;
            const cred = new Cred({ id: email, password });
            void navigator.credentials.store(cred);
        } catch {
            // Ignore - browser may reject or API not fully supported
        }
    }
}

function isEmailDeliveryError(message: string): boolean {
    const lower = message.toLowerCase();
    return (
        lower.includes('could not send') ||
        lower.includes('domain') ||
        lower.includes('unavailable') ||
        lower.includes('does not accept') ||
        lower.includes('recipient') ||
        lower.includes('rejected')
    );
}

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
    const [verificationCode, setVerificationCode] = useState('');
    const [agree, setAgree] = useState(false);

    const [regError, setRegError] = useState<string>('');
    const [emailFieldError, setEmailFieldError] = useState<string>('');
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
            email.trim().length > 0 &&
            password.length > 0 &&
            confirmPassword.length > 0 &&
            password === confirmPassword &&
            agree
        );
    }, [firstName, email, password, confirmPassword, agree]);

    const registerRequest = async () => {
        try {
            const res = await api.post('/auth/register', {
                email: email.trim(),
                password,
                confirmPassword,
            });
            setRegError('');
            setEmailFieldError('');
            setIsCodeSent(true);
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            return res.data;
        } catch (err) {
            const axiosErr = err as AxiosError<{ detail?: string | Array<{ msg?: string }> }>;
            const message = parseBackendError(axiosErr.response?.data, 'Ошибка регистрации');
            const isAlreadyPending =
                typeof message === 'string' && message.toLowerCase().includes(ALREADY_PENDING_MARKER);
            const isAlreadyTaken =
                typeof message === 'string' && message.toLowerCase().includes(ALREADY_EXISTS_MARKER);
            const isEmailUnavailable =
                typeof message === 'string' && isEmailDeliveryError(message);

            if (isAlreadyPending) {
                setRegError('');
                setEmailFieldError('');
                setVerificationCode('');
                setIsCodeSent(true);
                setResendCooldown(0);
                setIsResendLoading(true);
                await resendCodeRequest();
            } else if (isAlreadyTaken) {
                setRegError('');
                setEmailFieldError(EMAIL_ALREADY_TAKEN_MESSAGE);
            } else if (isEmailUnavailable) {
                setRegError('');
                setEmailFieldError(EMAIL_UNAVAILABLE_MESSAGE);
            } else {
                setRegError(message);
                setEmailFieldError('');
            }
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
            setEmailFieldError('');

            return res.data;
        } catch (err) {
            const axiosErr = err as AxiosError<{ detail?: string | Array<{ msg?: string }> }>;
            const message = parseBackendError(axiosErr.response?.data, 'Error');
            setResendSuccess('');
            if (typeof message === 'string' && isEmailDeliveryError(message)) {
                setResendError('');
                setEmailFieldError(EMAIL_UNAVAILABLE_MESSAGE);
            } else {
                setResendError(message);
                setEmailFieldError('');
            }
            return err;
        } finally {
            setIsResendLoading(false);
        }
    };

    const onSubmit = async () => {
        setRegError('');
        setEmailFieldError('');

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
        setConfirmError('');
        await api
            .post('/auth/verify-email', { email: email.trim(), code: verificationCode })
            .then(() => {
                setConfirmError('');
                setIsCodeLoading(false);
                trySaveCredentials(email.trim(), password);
                navigate('/login', { state: { prefilledEmail: email.trim() } });
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

    const handleBackToSignUp = () => {
        setIsCodeSent(false);
        setVerificationCode('');
        setConfirmError('');
        setResendError('');
        setResendSuccess('');
    };

    if (isCodeSent) {
        return (
            <div className="auth-page">
                <Card view="outlined" className="auth-page__card">
                    <PageHeader
                        title="Verify email"
                        subtitle={`We sent a verification code to ${email}`}
                    />

                    {confirmError && (
                        <Alert theme="danger" title="Verification failed" message={confirmError} />
                    )}

                    <div className="auth-page__form">
                        <div className="auth-page__field">
                            <Text variant="body-1">Verification code</Text>
                            <TextInput
                                value={verificationCode}
                                onUpdate={(v) => {
                                    setVerificationCode(v);
                                    if (confirmError) setConfirmError('');
                                }}
                                size="l"
                                placeholder="Enter the code from your email"
                                autoComplete="off"
                            />
                        </div>

                        <div className="auth-page__actions">
                            <Button
                                view="action"
                                size="l"
                                width="max"
                                loading={isCodeLoading}
                                disabled={!verificationCode.trim()}
                                onClick={handleSubmitCodeConfirmation}
                            >
                                Verify Email
                            </Button>
                            <Button
                                view="outlined"
                                size="l"
                                width="max"
                                loading={isResendLoading}
                                disabled={resendCooldown > 0}
                                onClick={handleResendClick}
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
                        </div>
                    </div>

                    <div className="auth-page__footer">
                        <Text variant="body-2" color="secondary">
                            Didn&apos;t receive the code?
                        </Text>
                        <Button
                            view="outlined"
                            size="l"
                            width="max"
                            className="auth-page__link auth-page__link--primary"
                            onClick={handleBackToSignUp}
                        >
                            Back to Sign Up
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <Card view="outlined" className="auth-page__card">
                <PageHeader
                    title="Sign Up"
                    subtitle="Set up your profile and start running interactive sessions."
                />

                {regError && (
                    <Alert theme="danger" title="Could not sign up" message={regError} />
                )}

                <div className="auth-page__form">
                    <div className="auth-page__field">
                        <Text variant="body-1">First name *</Text>
                        <TextInput
                            value={firstName}
                            onUpdate={setFirstName}
                            size="l"
                            placeholder="John"
                            autoComplete="off"
                        />
                    </div>

                    <div className="auth-page__field">
                        <Text variant="body-1">Last name</Text>
                        <TextInput
                            value={lastName}
                            onUpdate={setLastName}
                            size="l"
                            placeholder="Doe"
                            autoComplete="off"
                        />
                    </div>

                    <Divider />

                    <div className="auth-page__field">
                        <Text variant="body-1">Email *</Text>
                        <TextInput
                            value={email}
                            onUpdate={(v) => {
                                setEmail(v);
                                if (emailFieldError) setEmailFieldError('');
                            }}
                            size="l"
                            placeholder="you@example.com"
                            autoComplete="off"
                        />
                        {emailFieldError && (
                            <Text variant="body-2" color="danger" className="auth-page__field-error">
                                {emailFieldError}
                            </Text>
                        )}
                    </div>

                    <div className="auth-page__field">
                        <Text variant="body-1">Password *</Text>
                        <PasswordInput
                            value={password}
                            onUpdate={setPassword}
                            size="l"
                            placeholder="Create a password"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="auth-page__field">
                        <Text variant="body-1">Confirm password *</Text>
                        <PasswordInput
                            value={confirmPassword}
                            onUpdate={setConfirmPassword}
                            size="l"
                            placeholder="Repeat the password"
                            autoComplete="new-password"
                        />
                    </div>

                    <Checkbox checked={agree} onUpdate={setAgree} size="l">
                        I agree to the{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            Terms
                        </a>
                        {' '}and{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            Privacy Policy
                        </a>
                        {' '}(WIP) *
                    </Checkbox>

                    <div className="auth-page__actions">
                        <Button view="action" size="l" width="max" disabled={!canSubmit} onClick={onSubmit}>
                            Sign Up
                        </Button>
                    </div>
                </div>

                <div className="auth-page__footer">
                    <Text variant="body-2" color="secondary">
                        Already have an account?
                    </Text>
                    <Button
                        view="outlined"
                        size="l"
                        width="max"
                        className="auth-page__link auth-page__link--primary"
                        onClick={() => navigate('/login')}
                    >
                        Log in
                    </Button>
                </div>
            </Card>
        </div>
    );
}
