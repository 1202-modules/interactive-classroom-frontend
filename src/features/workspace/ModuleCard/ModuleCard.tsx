import {Button, Card, DropdownMenu, Icon, Label, Text} from '@gravity-ui/uikit';
import {EllipsisVertical} from '@gravity-ui/icons';
import type {WorkspaceActivityModule} from '@/shared/types/workspace';
import {formatShortDate} from '@/shared/utils/date';

interface ModuleCardProps {
    module: WorkspaceActivityModule;
    onOpenDetails: (moduleId: number) => void;
    onToggleEnabled: (moduleId: number) => void;
    onRename: (module: WorkspaceActivityModule) => void;
    onDuplicate: (module: WorkspaceActivityModule) => void;
    onDelete: (moduleId: number) => void;
}

export function ModuleCard({
    module,
    onOpenDetails,
    onToggleEnabled,
    onRename,
    onDuplicate,
    onDelete,
}: ModuleCardProps) {
    return (
        <div
            className="workspace-page__module-card-wrap"
            role="button"
            tabIndex={0}
            onClick={() => onOpenDetails(module.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenDetails(module.id);
                }
            }}
        >
            <Card view="outlined" className="workspace-page__module-card">
                <div className="workspace-page__module-card-head">
                    <div className="workspace-page__module-card-title">
                        <Text variant="subheader-3" ellipsis>
                            {module.name}
                        </Text>
                        <div
                            className="workspace-page__module-card-title-right"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Label theme={module.enabled ? 'success' : 'info'} size="s">
                                {module.enabled ? 'Enabled' : 'Disabled'}
                            </Label>
                            <DropdownMenu
                                items={[
                                    [
                                        {
                                            text: module.enabled ? 'Disable' : 'Enable',
                                            action: () => onToggleEnabled(module.id),
                                        },
                                        {text: 'Rename', action: () => onRename(module)},
                                        {text: 'Duplicate', action: () => onDuplicate(module)},
                                    ],
                                    [
                                        {
                                            text: 'Delete permanently',
                                            theme: 'danger' as const,
                                            action: () => onDelete(module.id),
                                        },
                                    ],
                                ]}
                                renderSwitcher={(props) => (
                                    <Button {...props} view="flat" size="s" title="More options">
                                        <Icon data={EllipsisVertical} size={16} />
                                    </Button>
                                )}
                            />
                        </div>
                    </div>
                    <Text variant="body-2" color="secondary">
                        {module.description}
                    </Text>
                </div>
                <div className="workspace-page__module-card-meta">
                    <div className="workspace-page__module-card-meta-item">
                        <Text variant="body-2" color="secondary">
                            Used in sessions:
                        </Text>
                        <Text variant="body-2">{module.used_in_sessions}</Text>
                    </div>
                    <div className="workspace-page__module-card-meta-item">
                        <Text variant="body-2" color="secondary">
                            Updated:
                        </Text>
                        <Text variant="body-2">{formatShortDate(module.updated_at)}</Text>
                    </div>
                </div>
            </Card>
        </div>
    );
}
