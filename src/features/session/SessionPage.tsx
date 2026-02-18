import { useState } from 'react';
import {
    Button,
    Divider,
    DropdownMenu,
    Icon,
    Label,
    Tab,
    TabList,
    TabProvider,
    Text,
    Tooltip,
} from '@gravity-ui/uikit';
import {ArrowLeft, ArrowsRotateLeft, ChevronDown, Copy, Play, Stop, Tv} from '@gravity-ui/icons';

import { AutoStartSchedule, SessionDefaults } from '@/shared/components/Workspace';
import {SessionModulesTab} from './SessionModulesTab';
import {SessionPreviewTab} from './SessionPreviewTab';
import {SessionInviteModal} from './SessionInviteModal';
import {useSessionDetail, type MainTab} from '@/shared/hooks/useSessionDetail';
import '../workspace/Workspace.css';
import './SessionPage.css';

export default function SessionPage() {
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [passcodeCopied, setPasscodeCopied] = useState(false);
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
        handleCopySessionLink,
        handleRegeneratePasscode,
        regeneratePasscodeLoading,
        filteredParticipants,
        handleStartStop,
        handleOpenPresentation,
        handleCopyPresentationLink,
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
                        <div className="session-page__header-title-row">
                            <Text
                                variant="header-1"
                                className={`session-page__header-title ${canCopyPasscode ? 'session-page__header-title_clickable' : ''}`}
                                onClick={() => canCopyPasscode && setInviteModalOpen(true)}
                                as="span"
                            >
                                {sessionTitle}
                            </Text>
                            {canCopyPasscode && (
                                <Button
                                    view="flat"
                                    size="s"
                                    onClick={() => setInviteModalOpen(true)}
                                    title="Copy session link"
                                    aria-label="Copy session link"
                                >
                                    <Icon data={Copy} size={16} />
                                </Button>
                            )}
                        </div>
                        <div className="session-page__header-meta">
                            <Label theme={sessionInfo?.is_stopped ? 'normal' : 'danger'} size="m">
                                {sessionInfo?.is_stopped ? 'Stopped' : 'Live'}
                            </Label>
                            <Text variant="body-1" color="secondary">
                                {sessionInfo?.is_stopped
                                    ? `${participants.length} participants`
                                    : `${activeParticipantsCount} active · ${participants.length} total participants`}
                            </Text>
                            <Tooltip
                                content="Link copied!"
                                open={passcodeCopied}
                                onOpenChange={(o) => !o && setPasscodeCopied(false)}
                            >
                                <button
                                    type="button"
                                    className={`session-page__passcode-badge${canCopyPasscode ? ' session-page__passcode-badge_clickable' : ''}`}
                                    onClick={canCopyPasscode ? async () => {
                                        await handleCopySessionLink();
                                        setPasscodeCopied(true);
                                        setTimeout(() => setPasscodeCopied(false), 2000);
                                    } : undefined}
                                    disabled={!canCopyPasscode}
                                    title={canCopyPasscode ? 'Copy session link' : undefined}
                                >
                                    Code: {sessionPasscode}
                                </button>
                            </Tooltip>
                            {canCopyPasscode && (
                                <Tooltip content="Regenerate code (current link will stop working)">
                                    <span>
                                        <Button
                                            view="flat"
                                            size="s"
                                            onClick={handleRegeneratePasscode}
                                            loading={regeneratePasscodeLoading}
                                            disabled={regeneratePasscodeLoading}
                                            title="Regenerate code"
                                            aria-label="Regenerate code"
                                        >
                                            <Icon data={ArrowsRotateLeft} size={16} />
                                        </Button>
                                    </span>
                                </Tooltip>
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
                    <div className="session-page__presentation-split">
                        <button
                            type="button"
                            className="session-page__presentation-main"
                            onClick={handleOpenPresentation}
                        >
                            <Icon data={Tv} size={18} />
                            Presentation
                        </button>
                        <div className="session-page__presentation-divider" aria-hidden />
                        <DropdownMenu
                            items={[[{text: 'Copy link', action: handleCopyPresentationLink}]]}
                            switcherWrapperClassName="session-page__presentation-dropdown-wrap"
                            renderSwitcher={(props) => (
                                <button
                                    type="button"
                                    className="session-page__presentation-chevron"
                                    {...props}
                                    title="More options"
                                >
                                    <Icon data={ChevronDown} size={18} />
                                </button>
                            )}
                        />
                    </div>
                </div>
            </div>

            <SessionInviteModal
                open={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                sessionName={sessionTitle}
                passcode={sessionPasscode}
            />

            <Divider />

            <div className="session-page__content">
                <TabProvider value={mainTab} onUpdate={(v: string) => setMainTab(v as MainTab)}>
                    <TabList size="l" className="session-page__main-tabs">
                        <Tab value="modules">Session modules</Tab>
                        <Tab value="inspect">Inspect & Participants</Tab>
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

                {mainTab === 'inspect' && (
                    <SessionPreviewTab
                        participants={participants}
                        participantSearch={participantSearch}
                        onParticipantSearchChange={setParticipantSearch}
                        filteredParticipants={filteredParticipants}
                        participantsOnly
                    />
                )}

                {mainTab === 'settings' && (
                    <div className="session-page__settings-grid">
                        <SessionDefaults
                            title="Session settings"
                            description="Configure preferences for this session (inherited from workspace defaults)."
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
