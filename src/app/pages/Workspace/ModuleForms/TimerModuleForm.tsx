import {Divider, SegmentedRadioGroup, Switch, Text, TextInput} from '@gravity-ui/uikit';
import type {TimerDuration} from '../../../types/workspace';
import {ModuleFormCommon} from './ModuleFormCommon';

interface TimerModuleFormProps {
    name: string;
    onNameChange: (name: string) => void;
    description: string;
    onDescriptionChange: (description: string) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    duration: TimerDuration;
    onDurationChange: (duration: TimerDuration) => void;
    customDurationSec: string;
    onCustomDurationSecChange: (duration: string) => void;
    enableSound: boolean;
    onEnableSoundChange: (enable: boolean) => void;
    allowPause: boolean;
    onAllowPauseChange: (allow: boolean) => void;
}

export function TimerModuleForm({
    name,
    onNameChange,
    description,
    onDescriptionChange,
    enabled,
    onEnabledChange,
    duration,
    onDurationChange,
    customDurationSec,
    onCustomDurationSecChange,
    enableSound,
    onEnableSoundChange,
    allowPause,
    onAllowPauseChange,
}: TimerModuleFormProps) {
    return (
        <div className="workspace-page__module-form">
            <ModuleFormCommon
                name={name}
                onNameChange={onNameChange}
                description={description}
                onDescriptionChange={onDescriptionChange}
                enabled={enabled}
                onEnabledChange={onEnabledChange}
            />
            <Divider />
            <div className="workspace-page__module-form-grid">
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
                                {value: '120', content: '2 min'},
                                {value: '300', content: '5 min'},
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
                        checked={enableSound}
                        onUpdate={onEnableSoundChange}
                        content="Enable sound"
                        size="l"
                    />
                    <Text variant="body-2" color="secondary">
                        Play a short sound when time is up.
                    </Text>
                </div>
            </div>

            <div className="workspace-page__module-form-field">
                <Switch
                    checked={allowPause}
                    onUpdate={onAllowPauseChange}
                    content="Allow pause/resume"
                    size="l"
                />
                <Text variant="body-2" color="secondary">
                    Let the teacher pause and resume the timer.
                </Text>
            </div>
        </div>
    );
}
