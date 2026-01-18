import { Card, Text } from '@gravity-ui/uikit';

interface SettingsCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <Card view="outlined" className="workspace-page__settings-card">
      <div className="workspace-page__settings-head">
        <Text variant="subheader-2">{title}</Text>
        <Text variant="body-2" color="secondary">
          {description}
        </Text>
      </div>
      <div className="workspace-page__settings-fields">{children}</div>
    </Card>
  );
}

