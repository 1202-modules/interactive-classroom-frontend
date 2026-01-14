import {Button, PasswordInput, Text, TextInput} from '@gravity-ui/uikit';
import React, {useEffect, useState} from 'react';
import styles from './Forms.module.css';
import axios, {AxiosError} from 'axios';
import {Link, Navigate, useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';

type RegisterForm = {
    email: string;
    password: string;
    confirmPassword: string;
    code: string;
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

const baseUrl = 'https://api-icplatform.cloudpub.ru';
const RESEND_COOLDOWN_SECONDS = 60;

export default function RegisterForm() {
    const navigate = useNavigate();

    const location = useLocation();
    const from = (location.state as {from?: string})?.from || '/';

    const {accessToken} = useAuth();

    if (accessToken) {
        return <Navigate to="/logout" replace state={from} />;
    }

    const [form, setForm] = useState<RegisterForm>({
        email: '',
        password: '',
        confirmPassword: '',
        code: '',
    });

    const [regError, setRegError] = useState<string>('');
    const [confirmError, setConfirmError] = useState<string>('');
    const [resendError, setResendError] = useState<string>('');
    const [resendSuccess, setResendSuccess] = useState<string>('');

    const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
    const [isCodeLoading, setIsCodeLoading] = useState<boolean>(false);
    const [isResendLoading, setIsResendLoading] = useState<boolean>(false);

    const [resendCooldown, setResendCooldown] = useState<number>(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === 'password' || name === 'confirmPassword') {
            setRegError('');
        }
        if (name === 'code') {
            setConfirmError('');
        }
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

        if (form.password !== form.confirmPassword) {
            setRegError('Пароли не совпадают');
            return;
        }

        const res = await registerRequest();
        console.log(res);
    };

    const registerRequest = async () => {
        try {
            const res = await axios.post(`${baseUrl}/api/v1/auth/register`, {
                email: form.email,
                password: form.password,
                confirmPassword: form.confirmPassword,
            });
            setRegError('');
            setIsCodeSent(true);
            // сразу запускаем кулдаун на повторную отправку
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            return res.data;
        } catch (err) {
            const error = err as AxiosError<BackendError | string>;
            const message = parseBackendError(error.response?.data, 'Ошибка регистрации');
            setRegError(message);
            console.error(message);
            return error;
        }
    };

    const handleSubmitCodeConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!form.code) {
            setConfirmError('Code must be not empty');
            return;
        }
        setIsCodeLoading(true);
        await verifyEmailRequest();
    };

    const verifyEmailRequest = async () => {
        try {
            const res = await axios.post(`${baseUrl}/api/v1/auth/verify-email`, {
                email: form.email,
                code: form.code,
            });
            setConfirmError('');
            setIsCodeLoading(false);
            navigate('/auth/login');
            return res;
        } catch (err) {
            const error = err as AxiosError<BackendError | string>;
            const message = parseBackendError(error.response?.data, 'Error');
            setConfirmError(message);
            setIsCodeLoading(false);
            return error;
        }
    };

    const resendCodeRequest = async () => {
        try {
            const res = await axios.post(`${baseUrl}/api/v1/auth/resend-code`, {
                email: form.email,
            });

            setResendError('');
            setResendSuccess('Verification code resent to your email');
            // при успешной отправке снова запускаем кулдаун
            setResendCooldown(RESEND_COOLDOWN_SECONDS);

            return res.data;
        } catch (err) {
            const error = err as AxiosError<BackendError | string>;
            const message = parseBackendError(error.response?.data, 'Error');
            setResendSuccess('');
            setResendError(message);
            return error;
        } finally {
            setIsResendLoading(false);
        }
    };

    const handleResendClick = async () => {
        if (!form.email) {
            setResendError('Email is empty');
            return;
        }
        if (resendCooldown > 0) {
            return; // защита от двойного клика
        }
        setIsResendLoading(true);
        await resendCodeRequest();
    };

    // таймер обратного отсчёта
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

    return (
        <>
            {isCodeSent ? (
                <form onSubmit={handleSubmitCodeConfirmation} className={styles.formFlex}>
                    <Text variant="header-2">Verify your Email</Text>

                    <TextInput
                        placeholder="Code from Email"
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        size="l"
                        validationState={confirmError ? 'invalid' : undefined}
                        errorMessage={confirmError}
                    />

                    <Button
                        type="submit"
                        view="action"
                        size="l"
                        color="primary"
                        loading={isCodeLoading}
                    >
                        Verify Email
                    </Button>

                    <Button
                        type="button"
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

                    <Link to="/auth/login">Authorize</Link>
                </form>
            ) : (
                <form onSubmit={handleSubmit} className={styles.formFlex}>
                    <Text variant="header-2">Registration</Text>

                    <TextInput
                        placeholder="Email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        size="l"
                        validationState={regError ? 'invalid' : undefined}
                        errorMessage={regError}
                        type="email"
                    />

                    <PasswordInput
                        placeholder="Password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        size="l"
                        validationState={regError ? 'invalid' : undefined}
                        errorMessage={regError}
                    />

                    <PasswordInput
                        placeholder="Confirm Password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        size="l"
                        validationState={regError ? 'invalid' : undefined}
                        errorMessage={regError}
                    />

                    <Button type="submit" view="action" size="l" color="primary">
                        Get code from email
                    </Button>

                    <Link to="/auth/login">Authorize</Link>
                </form>
            )}
        </>
    );
}
