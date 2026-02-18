import {useState} from 'react';
import {Button, Dialog} from '@gravity-ui/uikit';
import type {ActivityModuleType} from '@/shared/types/workspace';
import type {SessionModule} from '@/shared/types/sessionPage';
import type {useModuleForm} from '@/shared/hooks/useModuleForm';
import {useApi} from '@/shared/hooks/useApi';
import {PollModuleForm} from '@/features/workspace/ModuleForms/PollModuleForm';
import {QuizModuleForm} from '@/features/workspace/ModuleForms/QuizModuleForm';
import {QuestionsModuleForm} from '@/features/workspace/ModuleForms/QuestionsModuleForm';
import {TimerModuleForm} from '@/features/workspace/ModuleForms/TimerModuleForm';

type ModuleFormHook = ReturnType<typeof useModuleForm>;

type EditSessionModuleDialogProps = {
    open: boolean;
    sessionId: string;
    module: SessionModule | null;
    formState: ModuleFormHook;
    onClose: () => void;
    onSaved: () => void;
};

export function EditSessionModuleDialog({
    open,
    sessionId,
    module,
    formState,
    onClose,
    onSaved,
}: EditSessionModuleDialogProps) {
    const api = useApi();
    const [saving, setSaving] = useState(false);

    const sessionIdNum = Number(sessionId);
    const moduleIdNum = module ? Number(module.id) : 0;

    const handleSave = async () => {
        if (!module || !Number.isFinite(sessionIdNum) || !Number.isFinite(moduleIdNum)) return;
        setSaving(true);
        try {
            await api.put(
                `/sessions/${sessionIdNum}/modules/${moduleIdNum}`,
                {
                    name: formState.moduleName.trim() || module.name,
                    module_type: module.type,
                    settings: formState.getModuleConfig(),
                },
            );
            onSaved();
            onClose();
        } finally {
            setSaving(false);
        }
    };

    if (!module) return null;

    const moduleType: ActivityModuleType = module.type;

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

    const getDialogCaption = () => {
        switch (moduleType) {
            case 'questions':
                return 'Edit Questions module';
            case 'poll':
                return 'Edit Poll module';
            case 'quiz':
                return 'Edit Quiz module';
            case 'timer':
                return 'Edit Timer module';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} size="m" className="workspace-page__module-dialog">
            <Dialog.Header caption={getDialogCaption()} />
            <Dialog.Body>{renderForm()}</Dialog.Body>
            <Dialog.Footer>
                <Button view="flat" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button view="action" onClick={handleSave} loading={saving}>
                    Save
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
}
