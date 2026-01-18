import {
    Button,
    Divider,
    Icon,
    RadioGroup,
    Switch,
    Text,
    TextArea,
    TextInput,
} from '@gravity-ui/uikit';
import {Plus} from '@gravity-ui/icons';
import type {PollAnswerMode} from '../../../types/workspace';
import {ModuleFormCommon} from './ModuleFormCommon';

interface PollModuleFormProps {
    name: string;
    onNameChange: (name: string) => void;
    description: string;
    onDescriptionChange: (description: string) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    question: string;
    onQuestionChange: (question: string) => void;
    answerMode: PollAnswerMode;
    onAnswerModeChange: (mode: PollAnswerMode) => void;
    wordCloud: boolean;
    onWordCloudChange: (wordCloud: boolean) => void;
    options: string[];
    onOptionsChange: (options: string[]) => void;
}

export function PollModuleForm({
    name,
    onNameChange,
    description,
    onDescriptionChange,
    enabled,
    onEnabledChange,
    question,
    onQuestionChange,
    answerMode,
    onAnswerModeChange,
    wordCloud,
    onWordCloudChange,
    options,
    onOptionsChange,
}: PollModuleFormProps) {
    const handleAddOption = () => {
        onOptionsChange([...options, `Option ${options.length + 1}`]);
    };

    const handleOptionChange = (index: number, value: string) => {
        onOptionsChange(options.map((opt, i) => (i === index ? value : opt)));
    };

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
            <div className="workspace-page__module-form-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Poll question
                </Text>
                <TextArea
                    value={question}
                    onUpdate={onQuestionChange}
                    size="l"
                    rows={3}
                    placeholder="Ask a question…"
                />
            </div>

            <div className="workspace-page__module-form-grid">
                <div className="workspace-page__module-form-field">
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Answer mode
                    </Text>
                    <RadioGroup
                        size="l"
                        value={answerMode}
                        onUpdate={(v) => onAnswerModeChange(v as PollAnswerMode)}
                        options={[
                            {value: 'options', content: 'Options'},
                            {value: 'free', content: 'Free text'},
                            {value: 'mixed', content: 'Mixed'},
                        ]}
                    />
                </div>

                <div className="workspace-page__module-form-field">
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Visualization
                    </Text>
                    <Switch
                        checked={wordCloud}
                        onUpdate={onWordCloudChange}
                        content="Word cloud"
                        size="l"
                    />
                </div>
            </div>

            {(answerMode === 'options' || answerMode === 'mixed') && (
                <div className="workspace-page__module-form-field">
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Options
                    </Text>
                    <div className="workspace-page__module-options">
                        {options.map((opt, idx) => (
                            <TextInput
                                key={idx}
                                value={opt}
                                onUpdate={(v) => handleOptionChange(idx, v)}
                                size="l"
                                placeholder={`Option ${idx + 1}`}
                            />
                        ))}
                        <Button view="outlined" size="l" onClick={handleAddOption}>
                            <Icon data={Plus} size={16} />
                            Add option
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
