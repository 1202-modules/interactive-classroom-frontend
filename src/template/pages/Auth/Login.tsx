import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Checkbox, Text, TextInput } from '@gravity-ui/uikit';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0, [email, password]);

  const onSubmit = () => {
    setError(null);

    const e = email.trim();
    if (!e.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // UI-only auth prototype
    if (rememberMe) {
      try {
        window.localStorage.setItem('mock_auth_email', e);
      } catch {
        // ignore
      }
    }
    navigate('/template/dashboard');
  };

  return (
    <div className="auth-page">
      <Card view="outlined" className="auth-page__card">
        <div className="auth-page__header">
          <Text variant="display-1">Log in</Text>
          <Text variant="body-2" color="secondary">
            Access your workspaces and manage live sessions.
          </Text>
        </div>

        {error && (
          <Alert theme="danger" title="Could not log in" message={error} />
        )}

        <div className="auth-page__form">
          <div className="auth-page__field">
            <Text variant="body-1">Email</Text>
            <TextInput value={email} onUpdate={setEmail} size="l" placeholder="you@example.com" />
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
            <Button view="action" size="l" disabled={!canSubmit} onClick={onSubmit}>
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
          <Button view="flat" size="s" className="auth-page__link" onClick={() => navigate('/template/register')}>
            Create an account
          </Button>
        </div>
      </Card>
    </div>
  );
}


