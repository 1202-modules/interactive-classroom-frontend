import { Text } from '@gravity-ui/uikit';
import type { useWorkspaceSettings } from '@/shared/hooks/useWorkspaceSettings';

interface SessionDefaultsSummaryProps {
    workspaceSettings: ReturnType<typeof useWorkspaceSettings>;
}

const ENTRY_MODE_LABELS: Record<string, string> = {
    anonymous: 'Anonymous',
    registered: 'Registered users only',
    sso: 'SSO',
    email_code: 'Email code',
};

function getDurationDisplay(ws: ReturnType<typeof useWorkspaceSettings>): string {
    if (ws.defaultSessionDuration === 'custom') {
        return `${ws.customSessionDuration} min`;
    }
    return `${ws.defaultSessionDuration} min`;
}

function getMaxParticipantsDisplay(ws: ReturnType<typeof useWorkspaceSettings>): string {
    if (ws.maxParticipants === 'custom') {
        return ws.customMaxParticipants;
    }
    return ws.maxParticipants;
}

export function SessionDefaultsSummary({
    workspaceSettings: ws,
}: SessionDefaultsSummaryProps) {
    return (
        <div className="workspace-page__module-form-field">
            <Text variant="body-1" className="workspace-page__settings-label">
                Session settings
            </Text>
            <Text variant="body-2" color="secondary">
                From workspace defaults: Duration {getDurationDisplay(ws)} · Max participants{' '}
                {getMaxParticipantsDisplay(ws)} · Entry {ENTRY_MODE_LABELS[ws.participantEntryMode] || ws.participantEntryMode}
            </Text>
        </div>
    );
}
