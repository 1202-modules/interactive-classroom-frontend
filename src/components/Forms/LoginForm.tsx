import { Button, PasswordInput, Text, TextInput } from '@gravity-ui/uikit';
import React, { useState } from 'react';
import styles from './Forms.module.css';
import axios, { AxiosError } from 'axios';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { setCredentials } from '@/store/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { setUser, setUserError, setUserLoading } from '@/store/userSlice';
import { api } from '@/api/api';
import { useUser } from '@/hooks/useUser';

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

const baseUrl = 'https://api-icplatform.cloudpub.ru';

export default function LoginForm() {
  const navigate = useNavigate();

  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';
  
  const { accessToken } = useAuth();
  
  const dispatch = useDispatch<AppDispatch>();

  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
  });

  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
      const res = await axios.post(`${baseUrl}/api/v1/auth/login`, {
        email: form.email,
        password: form.password,
      });
  
      const { access_token, user_id, email } = res.data as {
        access_token: string;
        token_type: string;
        user_id: number;
        email: string;
      };
  
      dispatch(
        setCredentials({
          accessToken: access_token,
          userId: user_id,
          email,
        }),
      );
  
      try {
        dispatch(setUserLoading(true));
        const userRes = await api.get('/users/me');
        dispatch(setUser(userRes.data));
        dispatch(setUserError(''));
  
        const profile = userRes.data as {
          first_name?: string;
          last_name?: string;
        };
  
        localStorage.setItem(
          'auth',
          JSON.stringify({
            accessToken: access_token,
            userId: user_id,
            email,
          }),
        );
  
        setIsLoading(false);
  
        if (!profile.first_name || !profile.last_name) {
          navigate('/profile/edit', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } catch {
        dispatch(setUserError('Failed to load user'));
        setIsLoading(false);
        navigate(from, { replace: true }); // fallback
      } finally {
        dispatch(setUserLoading(false));
      }
    } catch (err) {
      const error = err as AxiosError<BackendError | string>;
      const message = parseBackendError(
        error.response?.data,
        'Invalid email or password',
      );
      setError(message);
      setIsLoading(false);
    }
  };

  if (accessToken) {
    return (<Navigate to="/logout" replace state={from}/>)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formFlex}>
      <Text variant="header-2">Authorization</Text>

      <TextInput
        placeholder="Email"
        name="email"
        value={form.email}
        onChange={handleChange}
        size="l"
        validationState={error ? 'invalid' : undefined}
        errorMessage={error}
        type='email'
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
