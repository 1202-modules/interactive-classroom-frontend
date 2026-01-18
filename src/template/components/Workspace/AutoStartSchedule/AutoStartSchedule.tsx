import { Card, Checkbox, Select, Text } from '@gravity-ui/uikit';
import type { WeekDay } from '../../../types/workspace';

interface AutoStartScheduleProps {
  schedule: Record<WeekDay, { enabled: boolean; start: string; end: string }>;
  onSetDay: (day: WeekDay, patch: Partial<{ enabled: boolean; start: string; end: string }>) => void;
  timeOptions: Array<{ value: string; content: string }>;
  weekDays: Array<{ key: WeekDay; label: string }>;
  parseIntSafe: (value: string, fallback?: number) => number;
}

export function AutoStartSchedule({
  schedule,
  onSetDay,
  timeOptions,
  weekDays,
  parseIntSafe,
}: AutoStartScheduleProps) {
  return (
    <div className="workspace-page__settings-field">
      <Card view="outlined" className="workspace-page__autostart-card">
        <div className="workspace-page__autostart-head">
          <Text variant="body-1" className="workspace-page__settings-label">
            Weekly schedule
          </Text>
        </div>

        <div className="workspace-page__autostart-grid">
          {weekDays.map(({ key, label }) => {
            const day = schedule[key];
            const startMin = parseIntSafe(day.start.replace(':', ''), 0);
            const endMin = parseIntSafe(day.end.replace(':', ''), 0);
            const invalid = day.enabled && endMin <= startMin;

            return (
              <div key={key} className="workspace-page__autostart-row">
                <Text variant="body-2" className="workspace-page__autostart-day">
                  {label}
                </Text>

                <Checkbox
                  checked={day.enabled}
                  onUpdate={(checked) => onSetDay(key, { enabled: checked })}
                  size="l"
                  title={`${label} enabled`}
                />

                <Select
                  size="l"
                  filterable
                  placeholder="Start"
                  value={[day.start]}
                  onUpdate={(value) => onSetDay(key, { start: value[0] })}
                  options={timeOptions}
                  disabled={!day.enabled}
                  className="workspace-page__autostart-time"
                />

                <Select
                  size="l"
                  filterable
                  placeholder="End"
                  value={[day.end]}
                  onUpdate={(value) => onSetDay(key, { end: value[0] })}
                  options={timeOptions}
                  disabled={!day.enabled}
                  className="workspace-page__autostart-time"
                />

                {invalid ? (
                  <Text variant="body-2" color="danger" className="workspace-page__autostart-hint">
                    End must be after start
                  </Text>
                ) : (
                  <span className="workspace-page__autostart-hint" />
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

