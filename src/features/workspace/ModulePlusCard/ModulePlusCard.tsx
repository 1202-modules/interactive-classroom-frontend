import {Card, Icon, Text} from '@gravity-ui/uikit';
import {Plus} from '@gravity-ui/icons';
import type {ActivityModuleType} from '@/shared/types/workspace';

interface ModulePlusCardProps {
    type: ActivityModuleType;
    title: string;
    onClick: () => void;
    disabled?: boolean;
}

export function ModulePlusCard({type: _type, title, onClick, disabled}: ModulePlusCardProps) {
    return (
        <div
            className={`workspace-page__module-plus-wrap${
                disabled ? ' workspace-page__module-plus-wrap_disabled' : ''
            }`}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={disabled ? undefined : onClick}
            onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <Card
                view="outlined"
                className={`workspace-page__module-plus-card${
                    disabled ? ' workspace-page__module-plus-card_disabled' : ''
                }`}
            >
                <div className="workspace-page__module-plus-inner">
                    <Icon data={Plus} size={28} />
                    <Text variant="body-1">Create {title}</Text>
                    <Text variant="body-2" color="secondary">
                        {disabled ? 'Coming soon' : 'Open form'}
                    </Text>
                </div>
            </Card>
        </div>
    );
}
