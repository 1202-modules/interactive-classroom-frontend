import { useEffect, useState } from 'react';
import { Card, Label, Text } from '@gravity-ui/uikit';
import { getParticipantsByPasscode } from '@/api/sessionParticipants';
import type { AxiosInstance } from 'axios';
import type { SessionParticipantItem } from '@/types/sessionParticipants';

interface ParticipantsListProps {
    api: AxiosInstance;
    passcode: string;
    authToken: string;
}

export function ParticipantsList({ api, passcode, authToken }: ParticipantsListProps) {
    const [participants, setParticipants] = useState<SessionParticipantItem[]>([]);
    const [activeCount, setActiveCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchParticipants = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getParticipantsByPasscode(api, passcode, authToken);
            setParticipants(response.participants || []);
            setActiveCount(response.active_count || 0);
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data ||
                err?.message ||
                'Failed to load participants';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipants();
        // Poll every 10 seconds for updates
        const interval = setInterval(fetchParticipants, 10000);
        return () => clearInterval(interval);
    }, [api, passcode, authToken]);

    const getDisplayName = (name: string | null) => name || 'Participant';

    if (isLoading) {
        return (
            <Card view="outlined" className="participant-page__card">
                <Text variant="header-2">Participants</Text>
                <Text variant="body-1" color="secondary">Loading...</Text>
            </Card>
        );
    }

    if (error) {
        return (
            <Card view="outlined" className="participant-page__card">
                <Text variant="header-2">Participants</Text>
                <Text variant="body-2" color="danger">{error}</Text>
            </Card>
        );
    }

    return (
        <Card view="outlined" className="participant-page__card">
            <div className="participant-page__card-head">
                <Text variant="header-2">Participants</Text>
                <Text variant="body-2" color="secondary">
                    {activeCount} active / {participants.length} total
                </Text>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {participants.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text variant="body-1">{getDisplayName(p.display_name)}</Text>
                        {p.is_active && (
                            <Label theme="success" size="s">
                                Active
                            </Label>
                        )}
                        <Text variant="body-2" color="secondary">
                            ({p.participant_type})
                        </Text>
                    </div>
                ))}
            </div>
        </Card>
    );
}
