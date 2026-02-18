import {useState, useCallback} from 'react';
import {Button, Icon, SegmentedRadioGroup, Select, Text, TextInput} from '@gravity-ui/uikit';
import {Xmark} from '@gravity-ui/icons';
import type {useWorkspaceSettings} from '@/shared/hooks/useWorkspaceSettings';

interface CreateSessionSettingsFormProps {
    workspaceSettings: ReturnType<typeof useWorkspaceSettings>;
    sessionSettings: {
        defaultSessionDuration: '30' | '60' | '90' | '120' | '240' | 'custom';
        customSessionDuration: string;
        maxParticipants: '10' | '50' | '100' | '200' | '400' | 'custom';
        customMaxParticipants: string;
        participantEntryMode: 'anonymous' | 'registered' | 'sso' | 'email_code';
        ssoOrganizationId: number | null;
        emailCodeDomainsWhitelist: string[];
    };
    onSessionSettingsChange: (settings: CreateSessionSettingsFormProps['sessionSettings']) => void;
    organizations: Array<{value: string; content: string}>;
    parseIntSafe: (value: string, fallback?: number) => number;
    clamp: (value: number, min: number, max: number) => number;
}

export function CreateSessionSettingsForm({
    workspaceSettings,
    sessionSettings,
    onSessionSettingsChange,
    organizations,
    parseIntSafe,
    clamp,
}: CreateSessionSettingsFormProps) {
    const [domainInput, setDomainInput] = useState('');

    const updateSettings = (updates: Partial<CreateSessionSettingsFormProps['sessionSettings']>) => {
        onSessionSettingsChange({...sessionSettings, ...updates});
    };

    const handleAddDomain = useCallback(() => {
        const trimmed = domainInput.trim().toLowerCase();
        if (!trimmed) return;
        const domain = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
        if (!domain.match(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i)) {
            return;
        }
        if (!sessionSettings.emailCodeDomainsWhitelist.includes(domain)) {
            updateSettings({
                emailCodeDomainsWhitelist: [...sessionSettings.emailCodeDomainsWhitelist, domain],
            });
        }
        setDomainInput('');
    }, [domainInput, sessionSettings.emailCodeDomainsWhitelist, updateSettings]);

    const handleRemoveDomain = useCallback(
        (domain: string) => {
            updateSettings({
                emailCodeDomainsWhitelist: sessionSettings.emailCodeDomainsWhitelist.filter((d) => d !== domain),
            });
        },
        [sessionSettings.emailCodeDomainsWhitelist, updateSettings],
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
        <>
            <div className="workspace-page__module-form-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Session duration
                </Text>
                <div className="workspace-page__settings-inline">
                    <SegmentedRadioGroup
                        size="l"
                        value={sessionSettings.defaultSessionDuration}
                        onUpdate={(v) =>
                            updateSettings({
                                defaultSessionDuration: v as '30' | '60' | '90' | '120' | '240' | 'custom',
                            })
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
                    {sessionSettings.defaultSessionDuration === 'custom' && (
                        <TextInput
                            value={sessionSettings.customSessionDuration}
                            onUpdate={(v) =>
                                updateSettings({
                                    customSessionDuration: String(clamp(parseIntSafe(v, 0), 1, 420)),
                                })
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

            <div className="workspace-page__module-form-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Maximum participants
                </Text>
                <div className="workspace-page__settings-inline">
                    <SegmentedRadioGroup
                        size="l"
                        value={sessionSettings.maxParticipants}
                        onUpdate={(v) =>
                            updateSettings({
                                maxParticipants: v as '10' | '50' | '100' | '200' | '400' | 'custom',
                            })
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
                    {sessionSettings.maxParticipants === 'custom' && (
                        <TextInput
                            value={sessionSettings.customMaxParticipants}
                            onUpdate={(v) =>
                                updateSettings({
                                    customMaxParticipants: String(clamp(parseIntSafe(v, 0), 1, 500)),
                                })
                            }
                            size="l"
                            type="number"
                            placeholder="150"
                            className="workspace-page__settings-inline-input"
                        />
                    )}
                </div>
            </div>

            <div className="workspace-page__module-form-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Participant entry mode
                </Text>
                <Select
                    size="l"
                    value={[sessionSettings.participantEntryMode]}
                    onUpdate={(value) => {
                        const mode = value[0] as 'anonymous' | 'registered' | 'sso' | 'email_code';
                        updateSettings({
                            participantEntryMode: mode,
                            ssoOrganizationId: mode !== 'sso' ? null : sessionSettings.ssoOrganizationId,
                            emailCodeDomainsWhitelist: mode !== 'email_code' ? [] : sessionSettings.emailCodeDomainsWhitelist,
                        });
                    }}
                    options={[
                        {value: 'anonymous', content: 'Anonymous'},
                        {value: 'registered', content: 'Registered users only'},
                        {value: 'sso', content: 'SSO'},
                        {value: 'email_code', content: 'Email code'},
                    ]}
                />
                {sessionSettings.participantEntryMode === 'sso' && (
                    <div className="workspace-page__settings-field" style={{marginTop: 'var(--g-spacing-3)'}}>
                        <Text variant="body-1" className="workspace-page__settings-label">
                            Organization <span style={{color: 'var(--g-color-text-danger)'}}>*</span>
                        </Text>
                        <Select
                            size="l"
                            value={sessionSettings.ssoOrganizationId !== null ? [String(sessionSettings.ssoOrganizationId)] : []}
                            onUpdate={(value) => {
                                updateSettings({
                                    ssoOrganizationId: value[0] ? Number(value[0]) : null,
                                });
                            }}
                            options={organizations}
                            placeholder="Select organization"
                        />
                    </div>
                )}
                {sessionSettings.participantEntryMode === 'email_code' && (
                    <div className="workspace-page__settings-field" style={{marginTop: 'var(--g-spacing-3)'}}>
                        <Text variant="body-1" className="workspace-page__settings-label">
                            Allowed email domains
                        </Text>
                        <Text variant="body-2" color="secondary" style={{marginBottom: 'var(--g-spacing-2)'}}>
                            {sessionSettings.emailCodeDomainsWhitelist.length === 0
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
                        {sessionSettings.emailCodeDomainsWhitelist.length > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 'var(--g-spacing-2)',
                                    marginTop: 'var(--g-spacing-2)',
                                }}
                            >
                                {sessionSettings.emailCodeDomainsWhitelist.map((domain) => (
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
        </>
    );
}
