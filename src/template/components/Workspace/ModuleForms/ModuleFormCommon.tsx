import {Switch, Text, TextArea, TextInput} from '@gravity-ui/uikit';

interface ModuleFormCommonProps {
    name: string;
    onNameChange: (name: string) => void;
    description: string;
    onDescriptionChange: (description: string) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

export function ModuleFormCommon({
    name,
    onNameChange,
    description,
    onDescriptionChange,
    enabled,
    onEnabledChange,
}: ModuleFormCommonProps) {
    return (
        <div className="workspace-page__module-form">
            <div className="workspace-page__module-form-grid">
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
                        Enabled
                    </Text>
                    <Switch
                        checked={enabled}
                        onUpdate={onEnabledChange}
                        content="Enable this module"
                        size="l"
                    />
                </div>
            </div>

            <div className="workspace-page__module-form-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Description
                </Text>
                <TextArea
                    value={description}
                    onUpdate={onDescriptionChange}
                    size="l"
                    rows={3}
                    placeholder="Add a short description for this module"
                />
            </div>
        </div>
    );
}
