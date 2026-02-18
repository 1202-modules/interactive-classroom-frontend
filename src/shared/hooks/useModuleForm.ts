import {useEffect, useState} from 'react';
import type {
    ActivityModuleConfig,
    ActivityModuleType,
    PollAnswerMode,
    QuestionsLengthLimitMode,
    QuizTimeLimit,
    TimerDuration,
    WorkspaceActivityModule,
} from '@/shared/types/workspace';
import {moduleService} from '@/features/workspace/services/moduleService';

const DEFAULT_PREFIX_BY_TYPE: Record<ActivityModuleType, string> = {
    questions: 'Questions',
    timer: 'Timer',
    poll: 'Poll',
    quiz: 'Quiz',
};

function getNextModuleName(
    type: ActivityModuleType,
    existingNames: string[],
): string {
    const prefix = DEFAULT_PREFIX_BY_TYPE[type];
    const usedNumbers = new Set<number>();
    for (const name of existingNames) {
        const match = name.match(new RegExp(`^${prefix}-(\\d+)$`));
        if (match) usedNumbers.add(parseInt(match[1], 10));
    }
    let n = 1;
    while (usedNumbers.has(n)) n++;
    return `${prefix}-${n}`;
}

export function useModuleForm(
    moduleType: ActivityModuleType,
    isOpen: boolean,
    createModuleType?: ActivityModuleType,
    existingModule?: WorkspaceActivityModule | null,
    existingModules?: WorkspaceActivityModule[],
) {
    const actualType = createModuleType ?? moduleType;
    const [moduleEnabled, setModuleEnabled] = useState(true);
    const [moduleName, setModuleName] = useState('');
    const [moduleDescription, setModuleDescription] = useState('');

    // Poll
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollAnswerMode, setPollAnswerMode] = useState<PollAnswerMode>('options');
    const [pollWordCloud, setPollWordCloud] = useState(true);
    const [pollOptions, setPollOptions] = useState<string[]>(['Option A', 'Option B', 'Option C']);

    // Quiz
    const [quizQuestion, setQuizQuestion] = useState('');
    const [quizShowCorrectAnswer, setQuizShowCorrectAnswer] = useState(true);
    const [quizTimeLimit, setQuizTimeLimit] = useState<QuizTimeLimit>('60');
    const [quizCustomTimeLimit, setQuizCustomTimeLimit] = useState('75');
    const [quizOptions, setQuizOptions] = useState<Array<{text: string; correct: boolean}>>([
        {text: 'Option 1', correct: true},
        {text: 'Option 2', correct: false},
        {text: 'Option 3', correct: false},
    ]);

    // Questions
    const [questionsLengthLimitMode, setQuestionsLengthLimitMode] =
        useState<QuestionsLengthLimitMode>('moderate');
    const [questionsLikesEnabled, setQuestionsLikesEnabled] = useState(true);
    const [questionsAllowAnonymous, setQuestionsAllowAnonymous] = useState(false);
    const [questionsCooldownEnabled, setQuestionsCooldownEnabled] = useState(false);
    const [questionsCooldownSeconds, setQuestionsCooldownSeconds] = useState(30);

    // Timer
    const [timerDuration, setTimerDuration] = useState<TimerDuration>('600');
    const [timerCustomDurationSec, setTimerCustomDurationSec] = useState('420');
    const [timerEnableSound, setTimerEnableSound] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        if (existingModule && existingModule.type === actualType) {
            // Load existing module data
            setModuleEnabled(existingModule.enabled);
            setModuleName(existingModule.name);
            setModuleDescription(existingModule.description);

            const config = existingModule.config;
            if (config.type === 'questions') {
                setQuestionsLengthLimitMode(config.length_limit_mode);
                setQuestionsLikesEnabled(config.likes_enabled);
                setQuestionsAllowAnonymous(config.allow_anonymous);
                setQuestionsCooldownEnabled(config.cooldown_enabled);
                setQuestionsCooldownSeconds(config.cooldown_seconds);
            } else if (config.type === 'timer') {
                const durationSec = config.duration_seconds;
                if ([60, 300, 600].includes(durationSec)) {
                    setTimerDuration(String(durationSec) as TimerDuration);
                } else {
                    setTimerDuration('custom');
                    setTimerCustomDurationSec(String(durationSec));
                }
                setTimerEnableSound(config.sound_notification_enabled);
            } else if (config.type === 'poll') {
                setPollQuestion(config.question);
                setPollAnswerMode(config.answer_mode);
                setPollWordCloud(config.word_cloud);
                setPollOptions(config.options);
            } else if (config.type === 'quiz') {
                setQuizQuestion(config.question);
                setQuizShowCorrectAnswer(config.show_correct_answer);
                const timeLimit = config.time_limit_sec;
                if ([30, 60, 90].includes(timeLimit)) {
                    setQuizTimeLimit(String(timeLimit) as QuizTimeLimit);
                } else {
                    setQuizTimeLimit('custom');
                    setQuizCustomTimeLimit(String(timeLimit));
                }
                setQuizOptions(config.options);
            }
            return;
        }

        // Default values for new module - unique name across all modules
        const existingNames = (existingModules ?? []).map((m) => m.name);
        const defaultName = getNextModuleName(actualType, existingNames);

        setModuleEnabled(true);
        setModuleName(defaultName);
        setModuleDescription('');

        setPollQuestion("What do you think about today's topic?");
        setPollAnswerMode('options');
        setPollWordCloud(true);
        setPollOptions(['Great', 'Okay', 'Confusing']);

        setQuizQuestion('Which statement is correct?');
        setQuizShowCorrectAnswer(true);
        setQuizTimeLimit('60');
        setQuizCustomTimeLimit('75');
        setQuizOptions([
            {text: 'Option 1', correct: true},
            {text: 'Option 2', correct: false},
            {text: 'Option 3', correct: false},
        ]);

        setQuestionsLengthLimitMode('moderate');
        setQuestionsLikesEnabled(true);
        setQuestionsAllowAnonymous(false);
        setQuestionsCooldownEnabled(false);
        setQuestionsCooldownSeconds(30);

        setTimerDuration('600');
        setTimerCustomDurationSec('180');
        setTimerEnableSound(true);
    }, [actualType, isOpen, existingModule, existingModules]);

    const getModuleConfig = (): ActivityModuleConfig => {
        switch (actualType) {
            case 'poll':
                return moduleService.buildPollConfig(
                    pollQuestion,
                    pollAnswerMode,
                    pollWordCloud,
                    pollOptions,
                );
            case 'quiz':
                return moduleService.buildQuizConfig(
                    quizQuestion,
                    quizTimeLimit,
                    quizCustomTimeLimit,
                    quizShowCorrectAnswer,
                    quizOptions,
                );
            case 'questions':
                return moduleService.buildQuestionsConfig(
                    questionsLengthLimitMode,
                    questionsLikesEnabled,
                    questionsAllowAnonymous,
                    questionsCooldownEnabled,
                    questionsCooldownSeconds,
                );
            case 'timer':
                return moduleService.buildTimerConfig(
                    timerDuration,
                    timerCustomDurationSec,
                    timerEnableSound,
                );
            default:
                throw new Error('Unknown module type');
        }
    };

    return {
        moduleEnabled,
        setModuleEnabled,
        moduleName,
        setModuleName,
        moduleDescription,
        setModuleDescription,
        pollQuestion,
        setPollQuestion,
        pollAnswerMode,
        setPollAnswerMode,
        pollWordCloud,
        setPollWordCloud,
        pollOptions,
        setPollOptions,
        quizQuestion,
        setQuizQuestion,
        quizShowCorrectAnswer,
        setQuizShowCorrectAnswer,
        quizTimeLimit,
        setQuizTimeLimit,
        quizCustomTimeLimit,
        setQuizCustomTimeLimit,
        quizOptions,
        setQuizOptions,
        questionsLengthLimitMode,
        setQuestionsLengthLimitMode,
        questionsLikesEnabled,
        setQuestionsLikesEnabled,
        questionsAllowAnonymous,
        setQuestionsAllowAnonymous,
        questionsCooldownEnabled,
        setQuestionsCooldownEnabled,
        questionsCooldownSeconds,
        setQuestionsCooldownSeconds,
        timerDuration,
        setTimerDuration,
        timerCustomDurationSec,
        setTimerCustomDurationSec,
        timerEnableSound,
        setTimerEnableSound,
        getModuleConfig,
    };
}
