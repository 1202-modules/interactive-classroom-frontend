import {Card, Label, Text, TextInput} from '@gravity-ui/uikit';
import type {Participant} from '@/shared/types/sessionPage';
import {formatShortDate} from '@/shared/utils/date';

type SessionPreviewTabProps = {
    participants: Participant[];
    participantSearch: string;
    onParticipantSearchChange: (value: string) => void;
    filteredParticipants: Participant[];
    /** When true, only show Participants (for Inspect & Participants tab) */
    participantsOnly?: boolean;
};

export function SessionPreviewTab({
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
        <div className="session-page__inspect-panel">
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

