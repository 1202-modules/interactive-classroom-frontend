import {Card, Icon, Label, Text, TextInput} from '@gravity-ui/uikit';
import type {Participant, SessionModule} from '@/shared/types/sessionPage';
import {formatShortDate} from '@/shared/utils/date';
import {getModuleIcon} from '@/shared/utils/sessionModuleUtils';

type SessionPreviewTabProps = {
    activeModule?: SessionModule | undefined;
    participants: Participant[];
    participantSearch: string;
    onParticipantSearchChange: (value: string) => void;
    filteredParticipants: Participant[];
    /** When true, only show Participants (for Inspect & Participants tab) */
    participantsOnly?: boolean;
};

export function SessionPreviewTab({
    activeModule,
    participants,
    participantSearch,
    onParticipantSearchChange,
    filteredParticipants,
    participantsOnly = false,
}: SessionPreviewTabProps) {
    if (participantsOnly) {
        return (
            <div className="session-page__inspect-panel">
                <Card view="outlined" className="session-page__participants-card">
                    <Text variant="subheader-1">Participants ({participants.length})</Text>
                    <TextInput
                        placeholder="Search participants..."
                        value={participantSearch}
                        onUpdate={onParticipantSearchChange}
                        size="l"
                        className="session-page__search"
                    />
                    <div className="session-page__participants-list">
                        {filteredParticipants.map((participant) => (
                            <Card
                                key={participant.id}
                                view="outlined"
                                className="session-page__participant-card"
                            >
                                <div className="session-page__participant-info">
                                    <Text variant="body-2">{participant.name}</Text>
                                    <div className="session-page__participant-meta">
                                        <Label
                                            theme={participant.is_active ? 'success' : 'normal'}
                                            size="xs"
                                        >
                                            {participant.is_active ? 'Active' : 'Inactive'}
                                        </Label>
                                        <Label theme="utility" size="xs">
                                            {participant.auth_type}
                                        </Label>
                                        <Text variant="caption-2" color="secondary">
                                            Joined {formatShortDate(participant.joined_at)}
                                        </Text>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="session-page__preview-grid">
            <Card view="outlined" className="session-page__preview-card">
                <Text variant="subheader-1">Preview</Text>
                <Text variant="body-2" color="secondary">
                    How it looks on participant phones
                </Text>
                <div className="session-page__preview-content">
                    {activeModule ? (
                        <>
                            <Icon data={getModuleIcon(activeModule.type)} size={48} />
                            <Text variant="header-2">{activeModule.name}</Text>
                            <Text variant="body-1" color="secondary">
                                Students see this module on their devices
                            </Text>
                            <Label theme="info" size="m">
                                WIP: Module rendering
                            </Label>
                        </>
                    ) : (
                        <>
                            <Text variant="display-1" color="secondary">
                                No active module
                            </Text>
                            <Text variant="body-1" color="secondary">
                                Activate a module to show content to students
                            </Text>
                        </>
                    )}
                </div>
            </Card>

            <Card view="outlined" className="session-page__participants-card">
                <Text variant="subheader-1">
                    Participants ({participants.length})
                </Text>
                <TextInput
                    placeholder="Search participants..."
                    value={participantSearch}
                    onUpdate={onParticipantSearchChange}
                    size="l"
                    className="session-page__search"
                />
                <div className="session-page__participants-list">
                    {filteredParticipants.map((participant) => (
                        <Card
                            key={participant.id}
                            view="outlined"
                            className="session-page__participant-card"
                        >
                            <div className="session-page__participant-info">
                                <Text variant="body-2">{participant.name}</Text>
                                <div className="session-page__participant-meta">
                                    <Label
                                        theme={participant.is_active ? 'success' : 'normal'}
                                        size="xs"
                                    >
                                        {participant.is_active ? 'Active' : 'Inactive'}
                                    </Label>
                                    <Label theme="utility" size="xs">
                                        {participant.auth_type}
                                    </Label>
                                    <Text variant="caption-2" color="secondary">
                                        Joined {formatShortDate(participant.joined_at)}
                                    </Text>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>
        </div>
    );
}
