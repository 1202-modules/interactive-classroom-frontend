import {Icon, Label, Text} from '@gravity-ui/uikit';
import {Clock} from '@gravity-ui/icons';
import type {ActivityModuleType, WorkspaceActivityModule} from '../../../types/workspace';
import {ModuleCard} from '../ModuleCard/ModuleCard';
import {ModulePlusCard} from '../ModulePlusCard/ModulePlusCard';

interface ModuleClusterProps {
    type: ActivityModuleType;
    title: string;
    subtitle: string;
    modules: WorkspaceActivityModule[];
    isWip?: boolean;
    onOpenDetails: (moduleId: number) => void;
    onToggleEnabled: (moduleId: number) => void;
    onRename: (module: WorkspaceActivityModule) => void;
    onDuplicate: (module: WorkspaceActivityModule) => void;
    onDelete: (moduleId: number) => void;
    onCreate: (type: ActivityModuleType) => void;
}

export function ModuleCluster({
    type,
    title,
    subtitle,
    modules,
    isWip,
    onOpenDetails,
    onToggleEnabled,
    onRename,
    onDuplicate,
    onDelete,
    onCreate,
}: ModuleClusterProps) {
    return (
        <div className="workspace-page__modules-cluster">
            <div className="workspace-page__modules-cluster-head">
                <div className="workspace-page__modules-cluster-title-row">
                    <Text variant="subheader-2">{title}</Text>
                    {isWip && (
                        <Label theme="warning" size="s" className="workspace-page__wip-label">
                            <span className="workspace-page__wip-icon-wrapper">
                                <Icon data={Clock} size={14} />
                            </span>
                            <span>WIP</span>
                        </Label>
                    )}
                </div>
                <Text variant="body-2" color="secondary">
                    {subtitle}
                </Text>
            </div>

            <div className="workspace-page__modules-cards">
                {modules.map((m) => (
                    <ModuleCard
                        key={m.id}
                        module={m}
                        onOpenDetails={onOpenDetails}
                        onToggleEnabled={onToggleEnabled}
                        onRename={onRename}
                        onDuplicate={onDuplicate}
                        onDelete={onDelete}
                    />
                ))}

                <ModulePlusCard
                    type={type}
                    title={title}
                    onClick={() => onCreate(type)}
                    disabled={isWip}
                />
            </div>
        </div>
    );
}
