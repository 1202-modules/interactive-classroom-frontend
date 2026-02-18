import {SegmentedRadioGroup, Switch, Text, TextInput} from '@gravity-ui/uikit';
import type {QuestionsLengthLimitMode} from '@/shared/types/workspace';

interface QuestionsModuleFormProps {
    name: string;
    onNameChange: (name: string) => void;
    description: string;
    onDescriptionChange: (description: string) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    likesEnabled: boolean;
    onLikesEnabledChange: (enable: boolean) => void;
    allowAnonymous: boolean;
    onAllowAnonymousChange: (enable: boolean) => void;
    lengthLimitMode: QuestionsLengthLimitMode;
    onLengthLimitModeChange: (mode: QuestionsLengthLimitMode) => void;
    cooldownEnabled: boolean;
    onCooldownEnabledChange: (enable: boolean) => void;
    cooldownSeconds: number;
    onCooldownSecondsChange: (seconds: number) => void;
}

export function QuestionsModuleForm({
    name,
    onNameChange,
    description,
    onDescriptionChange,
    enabled,
    onEnabledChange,
    likesEnabled,
    onLikesEnabledChange,
    allowAnonymous,
    onAllowAnonymousChange,
    lengthLimitMode,
    onLengthLimitModeChange,
    cooldownEnabled,
    onCooldownEnabledChange,
    cooldownSeconds,
    onCooldownSecondsChange,
}: QuestionsModuleFormProps) {
    return (
        <div className="workspace-page__module-form">
            <div className="workspace-page__module-form-row-2">
                <div className="workspace-page__module-form-field">
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Name
                    </Text>
                    <TextInput
                        value={name}
                        onUpdate={onNameChange}
                        size="l"
                        placeholder="Module name"
                    />
                </div>
                <div className="workspace-page__module-form-field">
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Description
                    </Text>
                    <TextInput
                        value={description}
                        onUpdate={onDescriptionChange}
                        size="l"
                        placeholder="Short description"
                    />
                </div>
            </div>
            <div className="workspace-page__module-form-switches">
                <Switch
                    checked={enabled}
                    onUpdate={onEnabledChange}
                    content="Enabled"
                    size="l"
                />
                <Switch
                    checked={likesEnabled}
                    onUpdate={onLikesEnabledChange}
                    content="Enable upvotes"
                    size="l"
                />
                <Switch
                    checked={allowAnonymous}
                    onUpdate={onAllowAnonymousChange}
                    content="Allow semi-anonymous questions"
                    size="l"
                />
            </div>
            <div className="workspace-page__module-form-field workspace-page__module-form-field-inline">
                <Switch
                    checked={cooldownEnabled}
                    onUpdate={onCooldownEnabledChange}
                    content="Cooldown"
                    size="l"
                />
                {cooldownEnabled && (
                    <TextInput
                        value={String(cooldownSeconds)}
                        onUpdate={(v) =>
                            onCooldownSecondsChange(
                                Math.min(300, Math.max(0, parseInt(v, 10) || 0)),
                            )
                        }
                        size="l"
                        type="number"
                        placeholder="30"
                        className="workspace-page__settings-inline-input"
                        endContent={
                            <Text variant="body-2" color="secondary">
                                sec
                            </Text>
                        }
                    />
                )}
            </div>
            <div className="workspace-page__module-form-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Max message length
                </Text>
                <SegmentedRadioGroup
                    size="l"
                    value={lengthLimitMode}
                    onUpdate={(v) => onLengthLimitModeChange(v as QuestionsLengthLimitMode)}
                    options={[
                        {value: 'compact', content: 'Compact (100)'},
                        {value: 'moderate', content: 'Moderate (250)'},
                        {value: 'extended', content: 'Extended (500)'},
                    ]}
                />
            </div>
        </div>
    );
}
