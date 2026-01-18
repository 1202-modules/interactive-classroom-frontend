import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Checkbox, Divider, Text, TextInput } from '@gravity-ui/uikit';
import './Auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('You must accept the Terms to create an account.');
      return;
    }

    // UI-only registration prototype
    try {
      window.localStorage.setItem('mock_auth_email', e);
      window.localStorage.setItem('mock_auth_name', `${firstName.trim()} ${lastName.trim()}`.trim());
    } catch {
      // ignore
    }
    navigate('/template/dashboard');
  };

  return (
    <div className="auth-page">
      <Card view="outlined" className="auth-page__card">
        <div className="auth-page__header">
          <Text variant="display-1">Create account</Text>
          <Text variant="body-2" color="secondary">
            Set up your profile and start running interactive sessions.
          </Text>
        </div>

        {error && (
          <Alert theme="danger" title="Could not create account" message={error} />
        )}

        <div className="auth-page__form">
          <div className="auth-page__field">
            <Text variant="body-1">First name</Text>
            <TextInput value={firstName} onUpdate={setFirstName} size="l" placeholder="John" />
          </div>

          <div className="auth-page__field">
            <Text variant="body-1">Last name</Text>
            <TextInput value={lastName} onUpdate={setLastName} size="l" placeholder="Doe" />
          </div>

          <Divider />

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
          </div>
        </div>

        <div className="auth-page__footer">
          <Text variant="body-2" color="secondary">
            Already have an account?
          </Text>
          <Button view="flat" size="s" className="auth-page__link" onClick={() => navigate('/template/login')}>
            Log in
          </Button>
        </div>
      </Card>
    </div>
  );
}


