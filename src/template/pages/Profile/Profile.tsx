import { useEffect, useState } from 'react';
import {
    Avatar,
    Button,
    Card,
    Divider,
    Icon,
    Label,
    RadioGroup,
    Select,
    Switch,
    Text,
    TextInput,
    Alert,
} from '@gravity-ui/uikit';
import { Camera, Clock, Lock, Shield, TrashBin } from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { setUser } from '@/store/userSlice';
import type { AppDispatch } from '@/store/store';
import './Profile.css';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { accessToken } = useAuth();
    const { data: user, loading: userLoading, error: userError } = useUser();
    const api = useApi();
    const dispatch = useDispatch<AppDispatch>();

    // Basic info state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState(''); // Read-only
    const [timezone, setTimezone] = useState('auto');
    const [customTimezone, setCustomTimezone] = useState('UTC');

    // Password change state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState('');

    // API state
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');

    // Security state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    // Timezone options
    const timezoneOptions = [
        { value: 'UTC', content: 'UTC (Coordinated Universal Time)' },
        { value: 'America/New_York', content: 'America/New_York (EST/EDT)' },
        { value: 'America/Chicago', content: 'America/Chicago (CST/CDT)' },
        { value: 'America/Denver', content: 'America/Denver (MST/MDT)' },
        { value: 'America/Los_Angeles', content: 'America/Los_Angeles (PST/PDT)' },
        { value: 'Europe/London', content: 'Europe/London (GMT/BST)' },
        { value: 'Europe/Paris', content: 'Europe/Paris (CET/CEST)' },
        { value: 'Europe/Moscow', content: 'Europe/Moscow (MSK)' },
        { value: 'Asia/Tokyo', content: 'Asia/Tokyo (JST)' },
        { value: 'Asia/Shanghai', content: 'Asia/Shanghai (CST)' },
        { value: 'Asia/Dubai', content: 'Asia/Dubai (GST)' },
        { value: 'Australia/Sydney', content: 'Australia/Sydney (AEDT/AEST)' },
    ];

    const parseBackendError = (data: any, fallback: string) => {
        if (!data) return fallback;
        if (typeof data === 'string') return data;
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail) && data.detail.length > 0) {
            return data.detail[0].msg || fallback;
        }
        return fallback;
    };

    const loadProfile = async () => {
        setProfileError('');
        setProfileLoading(true);
        try {
            const res = await api.get('/users/me');
            const payload = res.data;
            setFirstName(payload.first_name || '');
            setLastName(payload.last_name || '');
            setEmail(payload.email || '');
            setAvatarUrl(payload.avatar_url || '');
            dispatch(setUser(payload));
        } catch (err: any) {
            const status = err?.response?.status;
            const message = parseBackendError(err?.response?.data, 'Could not load profile');
            setProfileError(message);
            if (status === 401 || status === 403) {
                navigate('/login', { replace: true });
            }
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSave = async () => {
        setSaveError('');
        setSaveSuccess('');
        setSaveLoading(true);
        try {
            const body: Record<string, string> = {};
            if (firstName.trim().length > 0) body.first_name = firstName.trim();
            if (lastName.trim().length > 0) body.last_name = lastName.trim();
            if (avatarUrl.trim().length > 0) body.avatar_url = avatarUrl.trim();

            if (Object.keys(body).length === 0) {
                setSaveError('Nothing to update');
                setSaveLoading(false);
                return;
            }

            const res = await api.put('/users/me', body);
            const payload = res.data || {};
            setSaveSuccess('Profile updated successfully');
            if (payload.first_name !== undefined) setFirstName(payload.first_name || '');
            if (payload.last_name !== undefined) setLastName(payload.last_name || '');
            if (payload.avatar_url !== undefined) setAvatarUrl(payload.avatar_url || '');
            dispatch(setUser({ ...(user || {}), ...payload } as any));
        } catch (err: any) {
            const status = err?.response?.status;
            const message = parseBackendError(err?.response?.data, 'Could not update profile');
            setSaveError(message);
            if (status === 401 || status === 403) {
                navigate('/login', { replace: true });
            }
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        // TODO: Implement account deletion
    };

    useEffect(() => {
        if (!accessToken) {
            navigate('/login', { replace: true });
            return;
        }
        loadProfile();
    }, [accessToken, navigate]);

    useEffect(() => {
        if (!user) return;
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setEmail(user.email || '');
        setAvatarUrl(user.avatar_url || '');
    }, [user]);

    return (
        <div className="profile-page">
            <div className="profile-page__header">
                <Text variant="display-1">Profile Settings</Text>
            </div>

            {(userError || profileError) && (
                <Alert
                    theme="danger"
                    title="Could not load profile"
                    message={profileError || userError || 'Unknown error'}
                />
            )}
            {(userLoading || profileLoading) && !user && (
                <Alert theme="info" title="Loading profile" message="Fetching your info" />
            )}
            {saveSuccess && (
                <Alert theme="success" title="Profile saved" message={saveSuccess} />
            )}
            {saveError && <Alert theme="danger" title="Save failed" message={saveError} />}

            <div className="profile-page__content">
                {/* Basic Information */}
                <Card view="outlined" className="profile-page__card">
                    <div className="profile-page__card-header">
                        <Text variant="header-2">Basic Information</Text>
                        <Text variant="body-2" color="secondary">
                            Manage your personal information and account preferences.
                        </Text>
                    </div>

                    <div className="profile-page__card-content">
                        {/* Avatar */}
                        <div className="profile-page__field">
                            <Text variant="body-1" className="profile-page__label">
                                Profile Picture
                            </Text>
                            <Card view="outlined" className="profile-page__avatar-card">
                                <div className="profile-page__avatar-section">
                                    <div className="profile-page__avatar-wrapper">
                                        <Avatar
                                            size="xl"
                                            {...(avatarUrl ? { imgUrl: avatarUrl } : {})}
                                            text={`${firstName.charAt(0)}${lastName.charAt(0)}`}
                                            style={{ width: 150, height: 150, fontSize: '60px' }}
                                        />
                                    </div>
                                    <div className="profile-page__avatar-actions">
                                        <Button
                                            view="outlined"
                                            size="l"
                                            onClick={() => {
                                                // TODO: Implement avatar upload
                                            }}
                                        >
                                            <Icon data={Camera} size={16} />
                                            Change Photo
                                        </Button>
                                        {avatarUrl && (
                                            <Button
                                                view="flat"
                                                size="l"
                                                onClick={() => setAvatarUrl('')}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Divider />

                        {/* Email (read-only) */}
                        <div className="profile-page__field">
                            <Text variant="body-1" className="profile-page__label">
                                Email Address
                            </Text>
                            <TextInput
                                value={email}
                                disabled
                                size="l"
                                placeholder="email@example.com"
                                className="profile-page__input"
                            />
                            <Text variant="body-2" color="secondary" className="profile-page__hint">
                                Your email address cannot be changed.
                            </Text>
                        </div>

                        <div className="profile-page__name-password-row">
                            <div className="profile-page__name-column">
                                {/* First Name */}
                                <div className="profile-page__field">
                                    <Text variant="body-1" className="profile-page__label">
                                        First Name
                                    </Text>
                                    <TextInput
                                        value={firstName}
                                        onUpdate={setFirstName}
                                        size="l"
                                        placeholder="John"
                                        className="profile-page__input"
                                    />
                                </div>

                                {/* Last Name */}
                                <div className="profile-page__field">
                                    <Text variant="body-1" className="profile-page__label">
                                        Last Name
                                    </Text>
                                    <TextInput
                                        value={lastName}
                                        onUpdate={setLastName}
                                        size="l"
                                        placeholder="Doe"
                                        className="profile-page__input"
                                    />
                                </div>

                                {/* Save Button */}
                                <div className="profile-page__field">
                                    <Button
                                        view="action"
                                        size="l"
                                        className="profile-page__save-button"
                                        loading={saveLoading}
                                        onClick={handleSave}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>

                            <div className="profile-page__password-column">
                                {/* Old Password */}
                                <div className="profile-page__field">
                                    <Text variant="body-1" className="profile-page__label">
                                        Old Password
                                    </Text>
                                    <TextInput
                                        value={oldPassword}
                                        onUpdate={setOldPassword}
                                        size="l"
                                        type="password"
                                        placeholder="Enter old password"
                                        className="profile-page__input"
                                    />
                                </div>

                                {/* New Password */}
                                <div className="profile-page__field">
                                    <Text variant="body-1" className="profile-page__label">
                                        New Password
                                    </Text>
                                    <TextInput
                                        value={newPassword}
                                        onUpdate={setNewPassword}
                                        size="l"
                                        type="password"
                                        placeholder="Enter new password"
                                        className="profile-page__input"
                                    />
                                </div>

                                {/* Change Password Button */}
                                <div className="profile-page__field profile-page__change-password-field">
                                    <Button
                                        view="outlined"
                                        size="l"
                                        className="profile-page__change-password-button"
                                    >
                                        <Icon data={Lock} size={16} />
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* Timezone */}
                        <div className="profile-page__field">
                            <div className="profile-page__label-row">
                                <Text variant="body-1" className="profile-page__label">
                                    Timezone
                                </Text>
                                <Label
                                    theme="warning"
                                    size="s"
                                    className="profile-page__wip-label"
                                    title="Work In Progress - This feature is currently under development"
                                >
                                    <span className="profile-page__wip-icon-wrapper">
                                        <Icon data={Clock} size={14} />
                                    </span>
                                    <span>WIP</span>
                                </Label>
                            </div>
                            <RadioGroup
                                value={timezone}
                                onUpdate={setTimezone}
                                options={[
                                    { value: 'auto', content: 'Automatic (detect from browser)' },
                                    { value: 'manual', content: 'Manual selection' },
                                ]}
                                size="l"
                            />
                            {timezone === 'manual' && (
                                <div
                                    className="profile-page__field"
                                    style={{ marginTop: 'var(--g-spacing-3)' }}
                                >
                                    <Select
                                        value={[customTimezone]}
                                        onUpdate={(value) => setCustomTimezone(value[0])}
                                        options={timezoneOptions}
                                        size="l"
                                        filterable
                                        placeholder="Select timezone"
                                        className="profile-page__input"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Security */}
                <Card view="outlined" className="profile-page__card">
                    <div className="profile-page__card-header">
                        <Text variant="header-2">Security</Text>
                        <Text variant="body-2" color="secondary">
                            Manage your account security settings.
                        </Text>
                    </div>

                    <div className="profile-page__card-content">
                        <div className="profile-page__field">
                            <div className="profile-page__switch-field">
                                <div className="profile-page__switch-label-row">
                                    <Switch
                                        checked={twoFactorEnabled}
                                        onUpdate={setTwoFactorEnabled}
                                        content="Two-Factor Authentication"
                                        size="l"
                                    />
                                    <Label
                                        theme="warning"
                                        size="s"
                                        className="profile-page__wip-label"
                                        title="Work In Progress - This feature is currently under development"
                                    >
                                        <span className="profile-page__wip-icon-wrapper">
                                            <Icon data={Clock} size={14} />
                                        </span>
                                        <span>WIP</span>
                                    </Label>
                                </div>
                                <Text variant="body-2" color="secondary">
                                    Add an extra layer of security to your account.
                                </Text>
                            </div>
                            {twoFactorEnabled && (
                                <div
                                    className="profile-page__field"
                                    style={{ marginTop: 'var(--g-spacing-3)' }}
                                >
                                    <Button view="outlined" size="m">
                                        <Icon data={Shield} size={16} />
                                        Configure 2FA
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Delete Account */}
                <Card view="outlined" className="profile-page__card">
                    <div className="profile-page__card-header">
                        <Text variant="header-2">Delete Account</Text>
                        <Text variant="body-2" color="secondary">
                            Permanently delete your account and all associated data.
                        </Text>
                    </div>

                    <div className="profile-page__card-content">
                        <div className="profile-page__field">
                            <Text variant="body-2" color="secondary" className="profile-page__hint">
                                This action cannot be undone. All your workspaces, sessions, and
                                data will be permanently deleted.
                            </Text>
                            <div style={{ marginTop: 'var(--g-spacing-3)' }}>
                                <Button
                                    view="outlined-danger"
                                    size="l"
                                    onClick={handleDeleteAccount}
                                >
                                    <Icon data={TrashBin} size={16} />
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
