import { Text } from '@gravity-ui/uikit';
import type { ActivityModuleType, WorkspaceActivityModule } from '../../../types/workspace';
import { ModuleCard } from '../ModuleCard/ModuleCard';
import { ModulePlusCard } from '../ModulePlusCard/ModulePlusCard';

interface ModuleClusterProps {
  type: ActivityModuleType;
  title: string;
  subtitle: string;
  modules: WorkspaceActivityModule[];
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
        <Text variant="subheader-2">{title}</Text>
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

        <ModulePlusCard type={type} title={title} onClick={() => onCreate(type)} />
      </div>
    </div>
  );
}

