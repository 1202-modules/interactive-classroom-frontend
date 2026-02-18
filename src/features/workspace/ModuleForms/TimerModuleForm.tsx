import {SegmentedRadioGroup, Switch, Text, TextInput} from '@gravity-ui/uikit';
import type {TimerDuration} from '@/shared/types/workspace';
import {ModuleFormCommon} from './ModuleFormCommon';

interface TimerModuleFormProps {
    name: string;
    onNameChange: (name: string) => void;
    duration: TimerDuration;
    onDurationChange: (duration: TimerDuration) => void;
    customDurationSec: string;
    onCustomDurationSecChange: (duration: string) => void;
    soundNotificationEnabled: boolean;
    onSoundNotificationEnabledChange: (enable: boolean) => void;
}

export function TimerModuleForm({
    name,
    onNameChange,
    duration,
    onDurationChange,
    customDurationSec,
    onCustomDurationSecChange,
    soundNotificationEnabled,
    onSoundNotificationEnabledChange,
}: TimerModuleFormProps) {
    return (
        <div className="workspace-page__module-form">
            <ModuleFormCommon
                name={name}
                onNameChange={onNameChange}
                showDescription={false}
                showEnabled={false}
            />
            <div className="workspace-page__module-form-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Duration
                </Text>
                <div className="workspace-page__settings-inline">
                    <SegmentedRadioGroup
                        size="l"
                        value={duration}
                        onUpdate={(v) => onDurationChange(v as TimerDuration)}
                        options={[
                            {value: '60', content: '1 min'},
                            {value: '300', content: '5 min'},
                            {value: '600', content: '10 min'},
                            {value: 'custom', content: 'Custom'},
                        ]}
                    />
                    {duration === 'custom' && (
                        <TextInput
                            value={customDurationSec}
                            onUpdate={onCustomDurationSecChange}
                            size="l"
                            type="number"
                            placeholder="180"
                            className="workspace-page__settings-inline-input"
                            endContent={
                                <Text variant="body-2" color="secondary">
                                    sec
                                </Text>
                            }
                        />
                    )}
                </div>
            </div>
            <div className="workspace-page__module-form-field">
                <Switch
                    checked={soundNotificationEnabled}
                    onUpdate={onSoundNotificationEnabledChange}
                    content="Enable sound"
                    size="l"
                />
                <Text variant="body-2" color="secondary">
                    Play a short sound when time is up.
                </Text>
            </div>
        </div>
    );
}
