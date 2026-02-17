import {Button, ClipboardButton, Divider, Icon, Label, Tab, TabList, TabProvider, Text} from '@gravity-ui/uikit';
import {ArrowLeft, Gear, Play, Stop, Tv} from '@gravity-ui/icons';

import { AutoStartSchedule, SessionDefaults } from '@/shared/components/Workspace';
import {SessionModulesTab} from './SessionModulesTab';
import {SessionPreviewTab} from './SessionPreviewTab';
import {useSessionDetail} from '@/shared/hooks/useSessionDetail';
import '../workspace/Workspace.css';
import './SessionPage.css';

export default function SessionPage() {
    const {
        sessionInfo,
        sessionLoading,
        sessionModules,
        sessionModulesLoading,
        participants,
        mainTab,
        setMainTab,
        participantSearch,
        setParticipantSearch,
        activeId,
        sessionSettings,
        workspaceModules,
        sensors,
        activeModule,
        queueModules,
        isModuleSupported,
        activeParticipantsCount,
        sessionPasscode,
        canCopyPasscode,
        filteredParticipants,
        handleStartStop,
        handleOpenPresentation,
        handleBackToWorkspace,
        handleActivateModule,
        handleRemoveModule,
        handleAddFromWorkspace,
        handleDragStart,
        handleDragEnd,
    } = useSessionDetail();

    const sessionTitle = sessionLoading ? 'Loading…' : sessionInfo?.name || 'Session';

    return (
        <div className="session-page">
            {/* Header (layout from commit 1860575) */}
            <div className="session-page__header">
                <div className="session-page__header-main">
                    <Button view="flat" size="l" onClick={handleBackToWorkspace}>
                        <Icon data={ArrowLeft} size={20} />
                    </Button>
                    <div className="session-page__header-info">
                        <Text variant="header-1">
                            {sessionTitle}
                        </Text>
                        <div className="session-page__header-meta">
                            <Label theme={sessionInfo?.is_stopped ? 'normal' : 'success'} size="m">
                                {sessionInfo?.is_stopped ? 'Stopped' : 'Live'}
                            </Label>
                            <Text variant="body-1" color="secondary">
                                {activeParticipantsCount} active participants
                            </Text>
                            <Text variant="caption-2" color="secondary">
                                Code: {sessionPasscode}
                            </Text>
                            {canCopyPasscode && (
                                <ClipboardButton
                                    text={`${window.location.origin}/s/${sessionPasscode}`}
                                    size="s"
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="session-page__header-actions">
                    <Button
                        view={sessionInfo?.is_stopped ? 'action' : 'outlined-danger'}
                        size="l"
                        onClick={handleStartStop}
                    >
                        <Icon data={sessionInfo?.is_stopped ? Play : Stop} size={18} />
                        {sessionInfo?.is_stopped ? 'Start Session' : 'Stop Session'}
                    </Button>
                    <Button view="flat" size="l">
                        <Icon data={Gear} size={18} />
                    </Button>
                    <Button view="outlined" size="l" onClick={handleOpenPresentation}>
                        <Icon data={Tv} size={18} />
                        Presentation
                    </Button>
                </div>
            </div>

            <Divider />

            <div className="session-page__content">
                <TabProvider value={mainTab} onUpdate={(v: string) => setMainTab(v as 'modules' | 'preview' | 'settings')}>
                    <TabList className="session-page__main-tabs">
                        <Tab value="modules">Session modules</Tab>
                        <Tab value="preview">Preview & Participants</Tab>
                        <Tab value="settings">Settings</Tab>
                    </TabList>
                </TabProvider>

                {mainTab === 'modules' && (
                    <SessionModulesTab
                        sensors={sensors}
                        activeModule={activeModule}
                        queueModules={queueModules}
                        sessionModulesLoading={sessionModulesLoading}
                        workspaceModules={workspaceModules}
                        isModuleSupported={isModuleSupported}
                        activeId={activeId}
                        sessionModules={sessionModules}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onActivateModule={handleActivateModule}
                        onRemoveModule={handleRemoveModule}
                        onAddFromWorkspace={(id) => handleAddFromWorkspace(id)}
                    />
                )}

                {mainTab === 'preview' && (
                    <SessionPreviewTab
                        activeModule={activeModule}
                        participants={participants}
                        participantSearch={participantSearch}
                        onParticipantSearchChange={setParticipantSearch}
                        filteredParticipants={filteredParticipants}
                    />
                )}

                {mainTab === 'settings' && (
                    <div className="session-page__settings-grid">
                        <SessionDefaults
                            defaultSessionDuration={sessionSettings.defaultSessionDuration}
                            onDefaultSessionDurationChange={
                                sessionSettings.setDefaultSessionDuration
                            }
                            customSessionDuration={sessionSettings.customSessionDuration}
                            onCustomSessionDurationChange={
                                sessionSettings.setCustomSessionDuration
                            }
                            maxParticipants={sessionSettings.maxParticipants}
                            onMaxParticipantsChange={sessionSettings.setMaxParticipants}
                            customMaxParticipants={sessionSettings.customMaxParticipants}
                            onCustomMaxParticipantsChange={
                                sessionSettings.setCustomMaxParticipants
                            }
                            enableChat={sessionSettings.enableChat}
                            onEnableChatChange={sessionSettings.setEnableChat}
                            enableModeration={sessionSettings.enableModeration}
                            onEnableModerationChange={sessionSettings.setEnableModeration}
                            autoExpireDays={sessionSettings.autoExpireDays}
                            onAutoExpireDaysChange={sessionSettings.setAutoExpireDays}
                            autoExpireEnabled={sessionSettings.autoExpireEnabled}
                            onAutoExpireEnabledChange={sessionSettings.setAutoExpireEnabled}
                            autostartEnabled={sessionSettings.autostartEnabled}
                            onAutostartEnabledChange={sessionSettings.setAutostartEnabled}
                            autostartSchedule={sessionSettings.autostartSchedule}
                            onSetDay={sessionSettings.setDay}
                            parseIntSafe={sessionSettings.parseIntSafe}
                            clamp={sessionSettings.clamp}
                            timeOptions={sessionSettings.timeOptions}
                            weekDays={sessionSettings.weekDays}
                            participantEntryMode={sessionSettings.participantEntryMode}
                            onParticipantEntryModeChange={sessionSettings.setParticipantEntryMode}
                            ssoOrganizationId={sessionSettings.ssoOrganizationId}
                            onSsoOrganizationIdChange={sessionSettings.setSsoOrganizationId}
                            organizations={[]}
                            emailCodeDomainsWhitelist={sessionSettings.emailCodeDomainsWhitelist}
                            onEmailCodeDomainsWhitelistChange={
                                sessionSettings.setEmailCodeDomainsWhitelist
                            }
                        />
                        {sessionSettings.autostartEnabled && (
                            <AutoStartSchedule
                                schedule={sessionSettings.autostartSchedule}
                                onSetDay={sessionSettings.setDay}
                                timeOptions={sessionSettings.timeOptions}
                                weekDays={sessionSettings.weekDays}
                                parseIntSafe={sessionSettings.parseIntSafe}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
