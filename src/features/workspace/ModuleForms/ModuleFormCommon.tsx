import {Switch, Text, TextInput} from '@gravity-ui/uikit';

interface ModuleFormCommonProps {
    name: string;
    onNameChange: (name: string) => void;
    description: string;
    onDescriptionChange: (description: string) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    /** Optional slot to the right of Enabled (e.g. Enable upvotes for Questions) */
    rightOfEnabled?: React.ReactNode;
}

export function ModuleFormCommon({
    name,
    onNameChange,
    description,
    onDescriptionChange,
    enabled,
    onEnabledChange,
    rightOfEnabled,
}: ModuleFormCommonProps) {
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
                {rightOfEnabled}
            </div>
        </div>
    );
}
