import { Card, Icon, Text } from '@gravity-ui/uikit';
import { Plus } from '@gravity-ui/icons';
import type { ActivityModuleType } from '../../../types/workspace';

interface ModulePlusCardProps {
  type: ActivityModuleType;
  title: string;
  onClick: () => void;
}

export function ModulePlusCard({ type, title, onClick }: ModulePlusCardProps) {
  return (
    <div
      className="workspace-page__module-plus-wrap"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <Card view="outlined" className="workspace-page__module-plus-card">
        <div className="workspace-page__module-plus-inner">
          <Icon data={Plus} size={28} />
          <Text variant="body-1">Create {title}</Text>
          <Text variant="body-2" color="secondary">
            Open form
          </Text>
        </div>
      </Card>
    </div>
  );
}

