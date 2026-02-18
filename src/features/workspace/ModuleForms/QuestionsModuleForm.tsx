import {Divider, Switch, Text, TextInput} from '@gravity-ui/uikit';
import {ModuleFormCommon} from './ModuleFormCommon';

interface QuestionsModuleFormProps {
    name: string;
    onNameChange: (name: string) => void;
    description: string;
    onDescriptionChange: (description: string) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    allowAnonymous: boolean;
    onAllowAnonymousChange: (allow: boolean) => void;
    enableUpvotes: boolean;
    onEnableUpvotesChange: (enable: boolean) => void;
    maxLength: string;
    onMaxLengthChange: (length: string) => void;
    cooldownSec: string;
    onCooldownSecChange: (cooldown: string) => void;
}

export function QuestionsModuleForm({
    name,
    onNameChange,
    description,
    onDescriptionChange,
    enabled,
    onEnabledChange,
    allowAnonymous,
    onAllowAnonymousChange,
    enableUpvotes,
    onEnableUpvotesChange,
    maxLength,
    onMaxLengthChange,
    cooldownSec,
    onCooldownSecChange,
}: QuestionsModuleFormProps) {
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
                    <Switch
                        checked={allowAnonymous}
                        onUpdate={onAllowAnonymousChange}
                        content="Allow semi-anonymous questions"
                        size="l"
                    />
                    <Text variant="body-2" color="secondary">
                        When enabled, participants can choose to submit questions semi-anonymously. You will still see who wrote each question in the Inspect Module tab.
                    </Text>
                </div>
                <div className="workspace-page__module-form-field">
                    <Switch
                        checked={enableUpvotes}
                        onUpdate={onEnableUpvotesChange}
                        content="Enable upvotes"
                        size="l"
                    />
                    <Text variant="body-2" color="secondary">
                        Participants can upvote questions to raise popular ones.
                    </Text>
                </div>
            </div>

            <div className="workspace-page__module-form-grid">
                <div className="workspace-page__module-form-field">
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Max message length
                    </Text>
                    <TextInput
                        value={maxLength}
                        onUpdate={onMaxLengthChange}
                        size="l"
                        type="number"
                        placeholder="240"
                        endContent={
                            <Text variant="body-2" color="secondary">
                                chars
                            </Text>
                        }
                    />
                </div>
                <div className="workspace-page__module-form-field">
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Cooldown
                    </Text>
                    <TextInput
                        value={cooldownSec}
                        onUpdate={onCooldownSecChange}
                        size="l"
                        type="number"
                        placeholder="0"
                        endContent={
                            <Text variant="body-2" color="secondary">
                                sec
                            </Text>
                        }
                    />
                </div>
            </div>
        </div>
    );
}
