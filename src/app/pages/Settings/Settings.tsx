import {useState} from 'react';
import {Card, Divider, Icon, RadioGroup, Select, Switch, Text} from '@gravity-ui/uikit';
import {Bell, Globe, Palette, Shield} from '@gravity-ui/icons';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import {WipLabel} from '../../components/WipLabel/WipLabel';
import './Settings.css';

export default function SettingsPage() {
    // Appearance state
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
    const [animationsEnabled, setAnimationsEnabled] = useState(true);

    // Language & Region state
    const [language, setLanguage] = useState('en');
    const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
    const [timeFormat, setTimeFormat] = useState('12h');

    // Notifications state
    const [browserNotifications, setBrowserNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [notificationSound, setNotificationSound] = useState('default');

    // Privacy & Security state
    const [trackingEnabled, setTrackingEnabled] = useState(true);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
    const [crashReports, setCrashReports] = useState(true);

    // Language options
    const languageOptions = [
        {value: 'en', content: 'English'},
        {value: 'ru', content: 'Русский'},
        {value: 'es', content: 'Español'},
        {value: 'fr', content: 'Français'},
        {value: 'de', content: 'Deutsch'},
        {value: 'zh', content: '中文'},
        {value: 'ja', content: '日本語'},
    ];

    // Date format options
    const dateFormatOptions = [
        {value: 'MM/DD/YYYY', content: 'MM/DD/YYYY (US)'},
        {value: 'DD/MM/YYYY', content: 'DD/MM/YYYY (EU)'},
        {value: 'YYYY-MM-DD', content: 'YYYY-MM-DD (ISO)'},
    ];

    // Time format options
    const timeFormatOptions = [
        {value: '12h', content: '12-hour (AM/PM)'},
        {value: '24h', content: '24-hour'},
    ];

    // Notification sound options
    const soundOptions = [
        {value: 'default', content: 'Default'},
        {value: 'gentle', content: 'Gentle'},
        {value: 'classic', content: 'Classic'},
        {value: 'none', content: 'None'},
    ];

    return (
        <div className="settings-page">
            <PageHeader title="Application Settings" />

            <div className="settings-page__content">
                {/* Appearance */}
                <Card view="outlined" className="settings-page__card">
                    <div className="settings-page__card-header">
                        <div className="settings-page__card-title">
                            <Icon data={Palette} size={20} />
                            <Text variant="header-2">Appearance</Text>
                        </div>
                        <Text variant="body-2" color="secondary">
                            Customize the look and feel of the application.
                        </Text>
                    </div>

                    <div className="settings-page__card-content">
                        <div className="settings-page__field">
                            <Text variant="body-1" className="settings-page__label">
                                Theme
                            </Text>
                            <RadioGroup
                                value={theme}
                                onUpdate={(value: string) =>
                                    setTheme(value as 'light' | 'dark' | 'auto')
                                }
                                options={[
                                    {value: 'light', content: 'Light'},
                                    {value: 'dark', content: 'Dark'},
                                    {value: 'auto', content: 'Auto (follow system)'},
                                ]}
                                size="l"
                            />
                        </div>

                        <div className="settings-page__field">
                            <div className="settings-page__switch-field">
                                <div className="settings-page__switch-label-row">
                                    <Switch
                                        checked={animationsEnabled}
                                        onUpdate={setAnimationsEnabled}
                                        content="Enable Animations"
                                        size="l"
                                    />
                                    <WipLabel />
                                </div>
                                <Text variant="body-2" color="secondary">
                                    Show animations and transitions throughout the interface.
                                </Text>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Language & Region */}
                <Card view="outlined" className="settings-page__card">
                    <div className="settings-page__card-header">
                        <div className="settings-page__card-title">
                            <Icon data={Globe} size={20} />
                            <Text variant="header-2">Language & Region</Text>
                        </div>
                        <Text variant="body-2" color="secondary">
                            Configure language, date, and time formats.
                        </Text>
                    </div>

                    <div className="settings-page__card-content">
                        <div className="settings-page__field">
                            <div className="settings-page__label-row">
                                <Text variant="body-1" className="settings-page__label">
                                    Interface Language
                                </Text>
                                <WipLabel />
                            </div>
                            <Select
                                value={[language]}
                                onUpdate={(value) => setLanguage(value[0])}
                                options={languageOptions}
                                size="l"
                                filterable
                                placeholder="Select language"
                                className="settings-page__input"
                            />
                        </div>

                        <Divider />

                        <div className="settings-page__field">
                            <div className="settings-page__label-row">
                                <Text variant="body-1" className="settings-page__label">
                                    Date Format
                                </Text>
                                <WipLabel />
                            </div>
                            <Select
                                value={[dateFormat]}
                                onUpdate={(value) => setDateFormat(value[0])}
                                options={dateFormatOptions}
                                size="l"
                                placeholder="Select date format"
                                className="settings-page__input"
                            />
                        </div>

                        <div className="settings-page__field">
                            <div className="settings-page__label-row">
                                <Text variant="body-1" className="settings-page__label">
                                    Time Format
                                </Text>
                                <WipLabel />
                            </div>
                            <RadioGroup
                                value={timeFormat}
                                onUpdate={setTimeFormat}
                                options={timeFormatOptions}
                                size="l"
                            />
                        </div>
                    </div>
                </Card>

                {/* Notifications */}
                <Card view="outlined" className="settings-page__card">
                    <div className="settings-page__card-header">
                        <div className="settings-page__card-title">
                            <Icon data={Bell} size={20} />
                            <Text variant="header-2">Notifications</Text>
                        </div>
                        <Text variant="body-2" color="secondary">
                            Manage browser notifications and sounds.
                        </Text>
                    </div>

                    <div className="settings-page__card-content">
                        <div className="settings-page__field">
                            <div className="settings-page__switch-field">
                                <div className="settings-page__switch-label-row">
                                    <Switch
                                        checked={browserNotifications}
                                        onUpdate={setBrowserNotifications}
                                        content="Browser Notifications"
                                        size="l"
                                    />
                                    <WipLabel />
                                </div>
                                <Text variant="body-2" color="secondary">
                                    Show browser notifications for important events.
                                </Text>
                            </div>
                        </div>

                        <Divider />

                        <div className="settings-page__field">
                            <div className="settings-page__switch-field">
                                <div className="settings-page__switch-label-row">
                                    <Switch
                                        checked={soundEnabled}
                                        onUpdate={setSoundEnabled}
                                        content="Sound Notifications"
                                        size="l"
                                    />
                                    <WipLabel />
                                </div>
                                <Text variant="body-2" color="secondary">
                                    Play sounds for notifications.
                                </Text>
                            </div>
                        </div>

                        {soundEnabled && (
                            <div className="settings-page__field">
                                <div className="settings-page__label-row">
                                    <Text variant="body-1" className="settings-page__label">
                                        Notification Sound
                                    </Text>
                                    <WipLabel />
                                </div>
                                <Select
                                    value={[notificationSound]}
                                    onUpdate={(value) => setNotificationSound(value[0])}
                                    options={soundOptions}
                                    size="l"
                                    placeholder="Select sound"
                                    className="settings-page__input"
                                />
                            </div>
                        )}
                    </div>
                </Card>

                {/* Privacy & Security */}
                <Card view="outlined" className="settings-page__card">
                    <div className="settings-page__card-header">
                        <div className="settings-page__card-title">
                            <Icon data={Shield} size={20} />
                            <Text variant="header-2">Privacy & Security</Text>
                        </div>
                        <Text variant="body-2" color="secondary">
                            Control data collection and privacy settings.
                        </Text>
                    </div>

                    <div className="settings-page__card-content">
                        <div className="settings-page__field">
                            <div className="settings-page__switch-field">
                                <div className="settings-page__switch-label-row">
                                    <Switch
                                        checked={trackingEnabled}
                                        onUpdate={setTrackingEnabled}
                                        content="Usage Tracking"
                                        size="l"
                                    />
                                    <WipLabel />
                                </div>
                                <Text variant="body-2" color="secondary">
                                    Allow tracking of how you use the application to improve
                                    features.
                                </Text>
                            </div>
                        </div>

                        <div className="settings-page__field">
                            <div className="settings-page__switch-field">
                                <div className="settings-page__switch-label-row">
                                    <Switch
                                        checked={analyticsEnabled}
                                        onUpdate={setAnalyticsEnabled}
                                        content="Analytics"
                                        size="l"
                                    />
                                    <WipLabel />
                                </div>
                                <Text variant="body-2" color="secondary">
                                    Share anonymous usage data to help improve the platform.
                                </Text>
                            </div>
                        </div>

                        <div className="settings-page__field">
                            <div className="settings-page__switch-field">
                                <div className="settings-page__switch-label-row">
                                    <Switch
                                        checked={crashReports}
                                        onUpdate={setCrashReports}
                                        content="Crash Reports"
                                        size="l"
                                    />
                                    <WipLabel />
                                </div>
                                <Text variant="body-2" color="secondary">
                                    Automatically send crash reports to help fix bugs.
                                </Text>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
