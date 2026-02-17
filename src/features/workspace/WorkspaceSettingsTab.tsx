import { Alert, Button, Text, TextArea, TextInput } from '@gravity-ui/uikit';
import { SettingsCard, SessionDefaults, AutoStartSchedule } from '@/shared/components/Workspace';
import type { useWorkspaceSettings } from '@/shared/hooks/useWorkspaceSettings';

interface WorkspaceSettingsTabProps {
    workspaceSettings: ReturnType<typeof useWorkspaceSettings>;
    organizations: Array<{value: string; content: string}>;
    settingsError: string | null;
    isSavingSettings: boolean;
    onSave: () => void;
}

export function WorkspaceSettingsTab({
    workspaceSettings,
    organizations,
    settingsError,
    isSavingSettings,
    onSave,
}: WorkspaceSettingsTabProps) {
    return (
        <div className="workspace-page__section">
            <div className="workspace-page__settings-grid">
                <SettingsCard
                    title="Basics"
                    description="Configure basic workspace settings and preferences."
                >
                    <div className="workspace-page__settings-field">
                        <Text variant="body-1" className="workspace-page__settings-label">
                            Name
                        </Text>
                        <TextInput
                            value={workspaceSettings.workspaceName}
                            onUpdate={workspaceSettings.setWorkspaceName}
                            size="l"
                            placeholder="Enter workspace name"
                        />
                    </div>
                    <div className="workspace-page__settings-field">
                        <Text variant="body-1" className="workspace-page__settings-label">
                            Description
                        </Text>
                        <TextArea
                            value={workspaceSettings.workspaceDescription}
                            onUpdate={workspaceSettings.setWorkspaceDescription}
                            size="l"
                            placeholder="Add a description for your workspace"
                            rows={4}
                        />
                    </div>
                </SettingsCard>

                <SessionDefaults
                    defaultSessionDuration={workspaceSettings.defaultSessionDuration}
                    onDefaultSessionDurationChange={workspaceSettings.setDefaultSessionDuration}
                    customSessionDuration={workspaceSettings.customSessionDuration}
                    onCustomSessionDurationChange={workspaceSettings.setCustomSessionDuration}
                    maxParticipants={workspaceSettings.maxParticipants}
                    onMaxParticipantsChange={workspaceSettings.setMaxParticipants}
                    customMaxParticipants={workspaceSettings.customMaxParticipants}
                    onCustomMaxParticipantsChange={workspaceSettings.setCustomMaxParticipants}
                    enableChat={workspaceSettings.enableChat}
                    onEnableChatChange={workspaceSettings.setEnableChat}
                    enableModeration={workspaceSettings.enableModeration}
                    onEnableModerationChange={workspaceSettings.setEnableModeration}
                    autoExpireDays={workspaceSettings.autoExpireDays}
                    onAutoExpireDaysChange={workspaceSettings.setAutoExpireDays}
                    autoExpireEnabled={workspaceSettings.autoExpireEnabled}
                    onAutoExpireEnabledChange={workspaceSettings.setAutoExpireEnabled}
                    autostartEnabled={workspaceSettings.autostartEnabled}
                    onAutostartEnabledChange={workspaceSettings.setAutostartEnabled}
                    autostartSchedule={workspaceSettings.autostartSchedule}
                    onSetDay={workspaceSettings.setDay}
                    parseIntSafe={workspaceSettings.parseIntSafe}
                    clamp={workspaceSettings.clamp}
                    timeOptions={workspaceSettings.timeOptions}
                    weekDays={workspaceSettings.weekDays}
                    participantEntryMode={workspaceSettings.participantEntryMode}
                    onParticipantEntryModeChange={workspaceSettings.setParticipantEntryMode}
                    ssoOrganizationId={workspaceSettings.ssoOrganizationId}
                    onSsoOrganizationIdChange={workspaceSettings.setSsoOrganizationId}
                    organizations={organizations}
                    emailCodeDomainsWhitelist={workspaceSettings.emailCodeDomainsWhitelist}
                    onEmailCodeDomainsWhitelistChange={workspaceSettings.setEmailCodeDomainsWhitelist}
                />
                {workspaceSettings.autostartEnabled && (
                    <AutoStartSchedule
                        schedule={workspaceSettings.autostartSchedule}
                        onSetDay={workspaceSettings.setDay}
                        timeOptions={workspaceSettings.timeOptions}
                        weekDays={workspaceSettings.weekDays}
                        parseIntSafe={workspaceSettings.parseIntSafe}
                    />
                )}
                {settingsError && (
                    <Alert theme="danger" title="Failed to save settings" message={settingsError} />
                )}
                <div className="workspace-page__settings-actions">
                    <Button view="outlined" size="l">
                        Reset to defaults
                    </Button>
                    <Button view="action" size="l" onClick={onSave} loading={isSavingSettings}>
                        Save changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
