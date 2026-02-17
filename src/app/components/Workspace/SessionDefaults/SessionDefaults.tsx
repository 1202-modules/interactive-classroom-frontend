import {useState, useCallback} from 'react';
import {
    Divider,
    Icon,
    Label,
    SegmentedRadioGroup,
    Select,
    Switch,
    Text,
    TextInput,
} from '@gravity-ui/uikit';
import {Clock, Xmark} from '@gravity-ui/icons';
import type {WeekDay} from '../../../types/workspace';
import {SettingsCard} from '../SettingsCard/SettingsCard';

interface SessionDefaultsProps {
    defaultSessionDuration: '30' | '60' | '90' | '120' | '240' | 'custom';
    onDefaultSessionDurationChange: (
        duration: '30' | '60' | '90' | '120' | '240' | 'custom',
    ) => void;
    customSessionDuration: string;
    onCustomSessionDurationChange: (duration: string) => void;
    maxParticipants: '10' | '50' | '100' | '200' | '400' | 'custom';
    onMaxParticipantsChange: (max: '10' | '50' | '100' | '200' | '400' | 'custom') => void;
    customMaxParticipants: string;
    onCustomMaxParticipantsChange: (max: string) => void;
    enableChat: boolean;
    onEnableChatChange: (enable: boolean) => void;
    enableModeration: boolean;
    onEnableModerationChange: (enable: boolean) => void;
    autoExpireDays: string;
    onAutoExpireDaysChange: (days: string) => void;
    autoExpireEnabled: boolean;
    onAutoExpireEnabledChange: (enabled: boolean) => void;
    autostartEnabled: boolean;
    onAutostartEnabledChange: (enabled: boolean) => void;
    autostartSchedule: Record<WeekDay, {enabled: boolean; start: string; end: string}>;
    onSetDay: (
        day: WeekDay,
        patch: Partial<{enabled: boolean; start: string; end: string}>,
    ) => void;
    parseIntSafe: (value: string, fallback?: number) => number;
    clamp: (value: number, min: number, max: number) => number;
    timeOptions: Array<{value: string; content: string}>;
    weekDays: Array<{key: WeekDay; label: string}>;
    participantEntryMode: 'anonymous' | 'registered' | 'sso' | 'email_code';
    onParticipantEntryModeChange: (mode: 'anonymous' | 'registered' | 'sso' | 'email_code') => void;
    ssoOrganizationId: number | null;
    onSsoOrganizationIdChange: (orgId: number | null) => void;
    organizations: Array<{value: string; content: string}>;
    emailCodeDomainsWhitelist: string[];
    onEmailCodeDomainsWhitelistChange: (domains: string[]) => void;
}

export function SessionDefaults({
    defaultSessionDuration,
    onDefaultSessionDurationChange,
    customSessionDuration,
    onCustomSessionDurationChange,
    maxParticipants,
    onMaxParticipantsChange,
    customMaxParticipants,
    onCustomMaxParticipantsChange,
    enableChat,
    onEnableChatChange,
    enableModeration,
    onEnableModerationChange,
    autoExpireDays,
    onAutoExpireDaysChange,
    autoExpireEnabled,
    onAutoExpireEnabledChange,
    autostartEnabled,
    onAutostartEnabledChange,
    autostartSchedule: _autostartSchedule,
    onSetDay: _onSetDay,
    parseIntSafe,
    clamp,
    timeOptions: _timeOptions,
    weekDays: _weekDays,
    participantEntryMode,
    onParticipantEntryModeChange,
    ssoOrganizationId,
    onSsoOrganizationIdChange,
    organizations,
    emailCodeDomainsWhitelist,
    onEmailCodeDomainsWhitelistChange,
}: SessionDefaultsProps) {
    const [domainInput, setDomainInput] = useState('');

    const handleAddDomain = useCallback(() => {
        const trimmed = domainInput.trim().toLowerCase();
        if (!trimmed) return;
        // Remove @ if present
        const domain = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
        // Basic validation
        if (!domain.match(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i)) {
            return;
        }
        if (!emailCodeDomainsWhitelist.includes(domain)) {
            onEmailCodeDomainsWhitelistChange([...emailCodeDomainsWhitelist, domain]);
        }
        setDomainInput('');
    }, [domainInput, emailCodeDomainsWhitelist, onEmailCodeDomainsWhitelistChange]);

    const handleRemoveDomain = useCallback(
        (domain: string) => {
            onEmailCodeDomainsWhitelistChange(emailCodeDomainsWhitelist.filter((d) => d !== domain));
        },
        [emailCodeDomainsWhitelist, onEmailCodeDomainsWhitelistChange],
    );

    const handleDomainInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddDomain();
            }
        },
        [handleAddDomain],
    );
    return (
        <SettingsCard
            title="Session defaults"
            description="Set default values and preferences for new sessions in this workspace."
        >
            <div className="workspace-page__settings-field">
                <div className="workspace-page__settings-label-row">
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Default session duration
                    </Text>
                    <Label
                        theme="warning"
                        size="s"
                        className="workspace-page__wip-label"
                        title="Work In Progress - This feature is currently under development"
                    >
                        <span className="workspace-page__wip-icon-wrapper">
                            <Icon data={Clock} size={14} />
                        </span>
                        <span>WIP</span>
                    </Label>
                </div>
                <div className="workspace-page__settings-inline">
                    <SegmentedRadioGroup
                        size="l"
                        value={defaultSessionDuration}
                        onUpdate={(v) =>
                            onDefaultSessionDurationChange(
                                v as '30' | '60' | '90' | '120' | '240' | 'custom',
                            )
                        }
                        options={[
                            {value: '30', content: '30 min'},
                            {value: '60', content: '60 min'},
                            {value: '90', content: '90 min'},
                            {value: '120', content: '2 h'},
                            {value: '240', content: '4 h'},
                            {value: 'custom', content: 'Custom'},
                        ]}
                    />
                    {defaultSessionDuration === 'custom' && (
                        <TextInput
                            value={customSessionDuration}
                            onUpdate={(v) =>
                                onCustomSessionDurationChange(
                                    String(clamp(parseIntSafe(v, 0), 1, 420)),
                                )
                            }
                            size="l"
                            type="number"
                            placeholder="75"
                            className="workspace-page__settings-inline-input"
                            endContent={
                                <Text variant="body-2" color="secondary">
                                    min
                                </Text>
                            }
                        />
                    )}
                </div>
            </div>

            <div className="workspace-page__settings-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Maximum participants per session
                </Text>
                <div className="workspace-page__settings-inline">
                    <SegmentedRadioGroup
                        size="l"
                        value={maxParticipants}
                        onUpdate={(v) =>
                            onMaxParticipantsChange(
                                v as '10' | '50' | '100' | '200' | '400' | 'custom',
                            )
                        }
                        options={[
                            {value: '10', content: '10'},
                            {value: '50', content: '50'},
                            {value: '100', content: '100'},
                            {value: '200', content: '200'},
                            {value: '400', content: '400'},
                            {value: 'custom', content: 'Custom'},
                        ]}
                    />
                    {maxParticipants === 'custom' && (
                        <TextInput
                            value={customMaxParticipants}
                            onUpdate={(v) =>
                                onCustomMaxParticipantsChange(
                                    String(clamp(parseIntSafe(v, 0), 1, 500)),
                                )
                            }
                            size="l"
                            type="number"
                            placeholder="150"
                            className="workspace-page__settings-inline-input"
                        />
                    )}
                </div>
            </div>

            <div className="workspace-page__settings-field">
                <div className="workspace-page__settings-switch-grid">
                    <div className="workspace-page__settings-switch">
                        <div className="workspace-page__settings-switch-row">
                            <Switch
                                checked={enableChat}
                                onUpdate={(v) => {
                                    onEnableChatChange(v);
                                    if (!v) onEnableModerationChange(false);
                                }}
                                content="Enable chat"
                                size="l"
                            />
                            <Label
                                theme="warning"
                                size="s"
                                className="workspace-page__wip-label"
                                title="Work In Progress - This feature is currently under development"
                            >
                                <span className="workspace-page__wip-icon-wrapper">
                                    <Icon data={Clock} size={14} />
                                </span>
                                <span>WIP</span>
                            </Label>
                        </div>
                        <Text variant="body-1" color="secondary">
                            Chat will be enabled by default for new sessions.
                        </Text>
                    </div>
                    <div className="workspace-page__settings-switch">
                        <div className="workspace-page__settings-switch-row">
                            <Switch
                                checked={enableModeration}
                                onUpdate={onEnableModerationChange}
                                content="Enable moderation"
                                size="l"
                                disabled={!enableChat}
                            />
                            <Label
                                theme="warning"
                                size="s"
                                className="workspace-page__wip-label"
                                title="Work In Progress - This feature is currently under development"
                            >
                                <span className="workspace-page__wip-icon-wrapper">
                                    <Icon data={Clock} size={14} />
                                </span>
                                <span>WIP</span>
                            </Label>
                        </div>
                        <Text variant="body-1" color="secondary">
                            Require approval before messages appear in chat.
                        </Text>
                    </div>
                </div>
            </div>

            <div className="workspace-page__settings-field">
                <div className="workspace-page__settings-label-row">
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Auto-expire sessions after (days)
                    </Text>
                    <Label
                        theme="warning"
                        size="s"
                        className="workspace-page__wip-label"
                        title="Work In Progress - This feature is currently under development"
                    >
                        <span className="workspace-page__wip-icon-wrapper">
                            <Icon data={Clock} size={14} />
                        </span>
                        <span>WIP</span>
                    </Label>
                </div>
                <Switch
                    checked={autoExpireEnabled}
                    onUpdate={(v) => {
                        onAutoExpireEnabledChange(v);
                        if (!v) onAutoExpireDaysChange('0');
                        if (v && parseIntSafe(autoExpireDays, 0) === 0)
                            onAutoExpireDaysChange('30');
                    }}
                    content="Enable auto-expire"
                    size="l"
                />
                {autoExpireEnabled && (
                    <div
                        className="workspace-page__settings-field"
                        style={{marginTop: 'var(--g-spacing-3)'}}
                    >
                        <TextInput
                            value={autoExpireDays}
                            onUpdate={(v) =>
                                onAutoExpireDaysChange(String(clamp(parseIntSafe(v, 0), 0, 3650)))
                            }
                            size="l"
                            type="number"
                            placeholder="30"
                            className="workspace-page__auto-expire-input"
                        />
                    </div>
                )}
            </div>

            <Divider />

            <div className="workspace-page__settings-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Participant entry mode
                </Text>
                <Select
                    size="l"
                    value={[participantEntryMode]}
                    onUpdate={(value) => {
                        const mode = value[0] as 'anonymous' | 'registered' | 'sso' | 'email_code';
                        onParticipantEntryModeChange(mode);
                        // Reset dependent fields when mode changes
                        if (mode !== 'sso') {
                            onSsoOrganizationIdChange(null);
                        }
                        if (mode !== 'email_code') {
                            onEmailCodeDomainsWhitelistChange([]);
                        }
                    }}
                    options={[
                        {value: 'anonymous', content: 'Anonymous'},
                        {value: 'registered', content: 'Registered users only'},
                        {value: 'sso', content: 'SSO'},
                        {value: 'email_code', content: 'Email code'},
                    ]}
                />
                {participantEntryMode === 'sso' && (
                    <div className="workspace-page__settings-field" style={{marginTop: 'var(--g-spacing-3)'}}>
                        <Text variant="body-1" className="workspace-page__settings-label">
                            Organization <span style={{color: 'var(--g-color-text-danger)'}}>*</span>
                        </Text>
                        <Select
                            size="l"
                            value={ssoOrganizationId !== null ? [String(ssoOrganizationId)] : []}
                            onUpdate={(value) => {
                                onSsoOrganizationIdChange(value[0] ? Number(value[0]) : null);
                            }}
                            options={organizations}
                            placeholder="Select organization"
                            error={
                                participantEntryMode === 'sso' && ssoOrganizationId === null
                                    ? 'Organization is required for SSO mode'
                                    : undefined
                            }
                        />
                    </div>
                )}
                {participantEntryMode === 'email_code' && (
                    <div className="workspace-page__settings-field" style={{marginTop: 'var(--g-spacing-3)'}}>
                        <Text variant="body-1" className="workspace-page__settings-label">
                            Allowed email domains
                        </Text>
                        <Text variant="body-2" color="secondary" style={{marginBottom: 'var(--g-spacing-2)'}}>
                            {emailCodeDomainsWhitelist.length === 0
                                ? 'If the list is empty, any email domain will be accepted.'
                                : 'Only emails from the listed domains will be accepted.'}
                        </Text>
                        <div style={{display: 'flex', gap: 'var(--g-spacing-2)', alignItems: 'flex-start'}}>
                            <div style={{position: 'relative', flex: 1}}>
                                <TextInput
                                    size="l"
                                    value={domainInput}
                                    onUpdate={setDomainInput}
                                    onKeyDown={handleDomainInputKeyDown}
                                    placeholder="example.com"
                                    startContent={
                                        <Text variant="body-2" color="secondary">
                                            @
                                        </Text>
                                    }
                                />
                            </div>
                            <Button
                                view="action"
                                size="l"
                                onClick={handleAddDomain}
                                disabled={!domainInput.trim()}
                            >
                                Add
                            </Button>
                        </div>
                        {emailCodeDomainsWhitelist.length > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 'var(--g-spacing-2)',
                                    marginTop: 'var(--g-spacing-2)',
                                }}
                            >
                                {emailCodeDomainsWhitelist.map((domain) => (
                                    <div
                                        key={domain}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--g-spacing-1)',
                                            padding: 'var(--g-spacing-1) var(--g-spacing-2)',
                                            backgroundColor: 'var(--g-color-base-float)',
                                            border: '1px solid var(--g-color-line-generic)',
                                            borderRadius: 'var(--g-border-radius-m)',
                                        }}
                                    >
                                        <Text variant="body-2">@{domain}</Text>
                                        <Button
                                            view="flat"
                                            size="xs"
                                            onClick={() => handleRemoveDomain(domain)}
                                            title="Remove domain"
                                        >
                                            <Icon data={Xmark} size={12} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Divider />

            <div className="workspace-page__settings-field">
                <div className="workspace-page__settings-switch-row">
                    <Switch
                        checked={autostartEnabled}
                        onUpdate={onAutostartEnabledChange}
                        content="Auto-start sessions on schedule"
                        size="l"
                    />
                    <Label
                        theme="warning"
                        size="s"
                        className="workspace-page__wip-label"
                        title="Work In Progress - This feature is currently under development"
                    >
                        <span className="workspace-page__wip-icon-wrapper">
                            <Icon data={Clock} size={14} />
                        </span>
                        <span>WIP</span>
                    </Label>
                </div>
                <Text variant="body-2" color="secondary" className="workspace-page__autostart-desc">
                    Automatically start sessions on selected days within the configured time window.
                </Text>
            </div>
        </SettingsCard>
    );
}
