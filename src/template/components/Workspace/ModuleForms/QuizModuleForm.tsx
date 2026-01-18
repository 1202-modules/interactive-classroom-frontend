import {
    Button,
    Checkbox,
    Divider,
    Icon,
    SegmentedRadioGroup,
    Switch,
    Text,
    TextArea,
    TextInput,
} from '@gravity-ui/uikit';
import {Plus} from '@gravity-ui/icons';
import type {QuizTimeLimit} from '../../../types/workspace';
import {ModuleFormCommon} from './ModuleFormCommon';

interface QuizModuleFormProps {
    name: string;
    onNameChange: (name: string) => void;
    description: string;
    onDescriptionChange: (description: string) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    question: string;
    onQuestionChange: (question: string) => void;
    timeLimit: QuizTimeLimit;
    onTimeLimitChange: (limit: QuizTimeLimit) => void;
    customTimeLimit: string;
    onCustomTimeLimitChange: (limit: string) => void;
    showCorrectAnswer: boolean;
    onShowCorrectAnswerChange: (show: boolean) => void;
    options: Array<{text: string; correct: boolean}>;
    onOptionsChange: (options: Array<{text: string; correct: boolean}>) => void;
}

export function QuizModuleForm({
    name,
    onNameChange,
    description,
    onDescriptionChange,
    enabled,
    onEnabledChange,
    question,
    onQuestionChange,
    timeLimit,
    onTimeLimitChange,
    customTimeLimit,
    onCustomTimeLimitChange,
    showCorrectAnswer,
    onShowCorrectAnswerChange,
    options,
    onOptionsChange,
}: QuizModuleFormProps) {
    const handleAddOption = () => {
        onOptionsChange([...options, {text: `Option ${options.length + 1}`, correct: false}]);
    };

    const handleOptionTextChange = (index: number, text: string) => {
        onOptionsChange(options.map((opt, i) => (i === index ? {...opt, text} : opt)));
    };

    const handleOptionCorrectChange = (index: number, correct: boolean) => {
        onOptionsChange(options.map((opt, i) => (i === index ? {...opt, correct} : opt)));
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
                    Quiz question
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
                        Time limit
                    </Text>
                    <div className="workspace-page__settings-inline">
                        <SegmentedRadioGroup
                            size="l"
                            value={timeLimit}
                            onUpdate={(v) => onTimeLimitChange(v as QuizTimeLimit)}
                            options={[
                                {value: '30', content: '30s'},
                                {value: '60', content: '60s'},
                                {value: '90', content: '90s'},
                                {value: 'custom', content: 'Custom'},
                            ]}
                        />
                        {timeLimit === 'custom' && (
                            <TextInput
                                value={customTimeLimit}
                                onUpdate={onCustomTimeLimitChange}
                                size="l"
                                type="number"
                                placeholder="75"
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
                    <Text variant="body-1" className="workspace-page__settings-label">
                        Results
                    </Text>
                    <Switch
                        checked={showCorrectAnswer}
                        onUpdate={onShowCorrectAnswerChange}
                        content="Show correct answer after voting"
                        size="l"
                    />
                </div>
            </div>

            <div className="workspace-page__module-form-field">
                <Text variant="body-1" className="workspace-page__settings-label">
                    Options
                </Text>
                <div className="workspace-page__module-quiz-options">
                    {options.map((opt, idx) => (
                        <div key={idx} className="workspace-page__module-quiz-row">
                            <Checkbox
                                checked={opt.correct}
                                onUpdate={(checked) => handleOptionCorrectChange(idx, checked)}
                                size="l"
                                title="Correct"
                            />
                            <TextInput
                                value={opt.text}
                                onUpdate={(v) => handleOptionTextChange(idx, v)}
                                size="l"
                                placeholder={`Option ${idx + 1}`}
                            />
                        </div>
                    ))}
                    <Button view="outlined" size="l" onClick={handleAddOption}>
                        <Icon data={Plus} size={16} />
                        Add option
                    </Button>
                </div>
                <Text variant="body-2" color="secondary" className="workspace-page__module-hint">
                    Tip: mark one or more correct options.
                </Text>
            </div>
        </div>
    );
}
