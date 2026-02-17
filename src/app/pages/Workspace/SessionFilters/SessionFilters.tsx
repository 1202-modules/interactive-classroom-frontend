import {Button, Card, Icon, SegmentedRadioGroup, TextInput} from '@gravity-ui/uikit';
import {Magnifier} from '@gravity-ui/icons';
import type {SessionStatus} from '../../../types/session';

interface SessionFiltersProps {
    query: string;
    onQueryChange: (query: string) => void;
    status: SessionStatus;
    onStatusChange: (status: SessionStatus) => void;
    onCreateSession: () => void;
}

export function SessionFilters({
    query,
    onQueryChange,
    status,
    onStatusChange,
    onCreateSession,
}: SessionFiltersProps) {
    return (
        <Card view="outlined" className="workspace-page__toolbar">
            <div className="workspace-page__toolbar-left">
                <TextInput
                    value={query}
                    onUpdate={onQueryChange}
                    size="l"
                    placeholder="Search sessions or passcode…"
                    startContent={<Icon data={Magnifier} size={16} />}
                    className="workspace-page__search"
                />
            </div>
            <div className="workspace-page__toolbar-right">
                <SegmentedRadioGroup
                    size="l"
                    value={status}
                    onUpdate={(v) => onStatusChange(v as SessionStatus)}
                    options={[
                        {value: 'active', content: 'Active'},
                        {value: 'archive', content: 'Archive'},
                        {value: 'trash', content: 'Trash'},
                    ]}
                    className={status === 'trash' ? 'workspace-page__filter-trash' : ''}
                />
                <Button view="action" size="l" onClick={onCreateSession}>
                    Create session
                </Button>
            </div>
        </Card>
    );
}
