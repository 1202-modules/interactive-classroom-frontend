import {Button, Dialog} from '@gravity-ui/uikit';
import type {ActivityModuleType} from '@/shared/types/workspace';
import {PollModuleForm} from '../ModuleForms/PollModuleForm';
import {QuizModuleForm} from '../ModuleForms/QuizModuleForm';
import {QuestionsModuleForm} from '../ModuleForms/QuestionsModuleForm';
import {TimerModuleForm} from '../ModuleForms/TimerModuleForm';
import type {useModuleForm} from '@/shared/hooks/useModuleForm';

type ModuleFormHook = ReturnType<typeof useModuleForm>;

interface CreateModuleDialogProps {
    open: boolean;
    onClose: () => void;
    moduleType: ActivityModuleType;
    formState: ModuleFormHook;
    onCreate: () => void;
    isEdit?: boolean;
}

export function CreateModuleDialog({
    open,
    onClose,
    moduleType,
    formState,
    onCreate,
    isEdit = false,
}: CreateModuleDialogProps) {
    const getDialogCaption = () => {
        const prefix = isEdit ? 'Edit' : 'Create';
        switch (moduleType) {
            case 'questions':
                return `${prefix} Questions module`;
            case 'poll':
                return `${prefix} Poll module`;
            case 'quiz':
                return `${prefix} Quiz module`;
            case 'timer':
                return `${prefix} Timer module`;
        }
    };

    const renderForm = () => {
        switch (moduleType) {
            case 'poll':
                return (
                    <PollModuleForm
                        name={formState.moduleName}
                        onNameChange={formState.setModuleName}
                        description={formState.moduleDescription}
                        onDescriptionChange={formState.setModuleDescription}
                        enabled={formState.moduleEnabled}
                        onEnabledChange={formState.setModuleEnabled}
                        question={formState.pollQuestion}
                        onQuestionChange={formState.setPollQuestion}
                        answerMode={formState.pollAnswerMode}
                        onAnswerModeChange={formState.setPollAnswerMode}
                        wordCloud={formState.pollWordCloud}
                        onWordCloudChange={formState.setPollWordCloud}
                        options={formState.pollOptions}
                        onOptionsChange={formState.setPollOptions}
                    />
                );
            case 'quiz':
                return (
                    <QuizModuleForm
                        name={formState.moduleName}
                        onNameChange={formState.setModuleName}
                        description={formState.moduleDescription}
                        onDescriptionChange={formState.setModuleDescription}
                        enabled={formState.moduleEnabled}
                        onEnabledChange={formState.setModuleEnabled}
                        question={formState.quizQuestion}
                        onQuestionChange={formState.setQuizQuestion}
                        timeLimit={formState.quizTimeLimit}
                        onTimeLimitChange={formState.setQuizTimeLimit}
                        customTimeLimit={formState.quizCustomTimeLimit}
                        onCustomTimeLimitChange={formState.setQuizCustomTimeLimit}
                        showCorrectAnswer={formState.quizShowCorrectAnswer}
                        onShowCorrectAnswerChange={formState.setQuizShowCorrectAnswer}
                        options={formState.quizOptions}
                        onOptionsChange={formState.setQuizOptions}
                    />
                );
            case 'questions':
                return (
                    <QuestionsModuleForm
                        name={formState.moduleName}
                        onNameChange={formState.setModuleName}
                        description={formState.moduleDescription}
                        onDescriptionChange={formState.setModuleDescription}
                        likesEnabled={formState.questionsLikesEnabled}
                        onLikesEnabledChange={formState.setQuestionsLikesEnabled}
                        allowAnonymous={formState.questionsAllowAnonymous}
                        onAllowAnonymousChange={formState.setQuestionsAllowAnonymous}
                        lengthLimitMode={formState.questionsLengthLimitMode}
                        onLengthLimitModeChange={formState.setQuestionsLengthLimitMode}
                        cooldownEnabled={formState.questionsCooldownEnabled}
                        onCooldownEnabledChange={formState.setQuestionsCooldownEnabled}
                        cooldownSeconds={formState.questionsCooldownSeconds}
                        onCooldownSecondsChange={formState.setQuestionsCooldownSeconds}
                    />
                );
            case 'timer':
                return (
                    <TimerModuleForm
                        name={formState.moduleName}
                        onNameChange={formState.setModuleName}
                        duration={formState.timerDuration}
                        onDurationChange={formState.setTimerDuration}
                        customDurationSec={formState.timerCustomDurationSec}
                        onCustomDurationSecChange={formState.setTimerCustomDurationSec}
                        soundNotificationEnabled={formState.timerEnableSound}
                        onSoundNotificationEnabledChange={formState.setTimerEnableSound}
                    />
                );
        }
    };

    return (
        <Dialog open={open} onClose={onClose} size="m" className="workspace-page__module-dialog">
            <Dialog.Header caption={getDialogCaption()} />
            <Dialog.Body>{renderForm()}</Dialog.Body>
            <Dialog.Footer>
                <Button view="flat" onClick={onClose}>
                    Cancel
                </Button>
                <Button view="action" onClick={onCreate}>
                    {isEdit ? 'Save' : 'Create'}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
}
