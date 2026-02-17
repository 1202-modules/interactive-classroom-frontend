import {useEffect, useState} from 'react';
import type {
    ActivityModuleConfig,
    ActivityModuleType,
    PollAnswerMode,
    QuizTimeLimit,
    TimerDuration,
    WorkspaceActivityModule,
} from '@/shared/types/workspace';
import {moduleService} from '@/features/workspace/services/moduleService';

export function useModuleForm(
    moduleType: ActivityModuleType,
    isOpen: boolean,
    createModuleType?: ActivityModuleType,
    existingModule?: WorkspaceActivityModule | null,
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
    const [questionsAllowAnonymous, setQuestionsAllowAnonymous] = useState(false);
    const [questionsEnableUpvotes, setQuestionsEnableUpvotes] = useState(true);
    const [questionsMaxLength, setQuestionsMaxLength] = useState('240');
    const [questionsCooldownSec, setQuestionsCooldownSec] = useState('0');

    // Timer
    const [timerDuration, setTimerDuration] = useState<TimerDuration>('120');
    const [timerCustomDurationSec, setTimerCustomDurationSec] = useState('180');
    const [timerEnableSound, setTimerEnableSound] = useState(true);
    const [timerAllowPause, setTimerAllowPause] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        if (existingModule && existingModule.type === actualType) {
            // Load existing module data
            setModuleEnabled(existingModule.enabled);
            setModuleName(existingModule.name);
            setModuleDescription(existingModule.description);

            const config = existingModule.config;
            if (config.type === 'questions') {
                setQuestionsAllowAnonymous(config.allow_anonymous);
                setQuestionsEnableUpvotes(config.enable_upvotes);
                setQuestionsMaxLength(String(config.max_length));
                setQuestionsCooldownSec(String(config.cooldown_sec));
            } else if (config.type === 'timer') {
                const durationSec = config.duration_sec;
                if ([60, 120, 300].includes(durationSec)) {
                    setTimerDuration(String(durationSec) as TimerDuration);
                } else {
                    setTimerDuration('custom');
                    setTimerCustomDurationSec(String(durationSec));
                }
                setTimerEnableSound(config.enable_sound);
                setTimerAllowPause(config.allow_pause);
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

        // Default values for new module
        const defaultNameByType: Record<ActivityModuleType, string> = {
            questions: 'Questions-1',
            poll: 'Poll-2',
            quiz: 'Quiz-1',
            timer: 'Timer-2',
        };

        setModuleEnabled(true);
        setModuleName(defaultNameByType[actualType]);
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

        setQuestionsAllowAnonymous(false);
        setQuestionsEnableUpvotes(true);
        setQuestionsMaxLength('240');
        setQuestionsCooldownSec('0');

        setTimerDuration('120');
        setTimerCustomDurationSec('180');
        setTimerEnableSound(true);
        setTimerAllowPause(true);
    }, [actualType, isOpen, existingModule]);

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
                    questionsAllowAnonymous,
                    questionsEnableUpvotes,
                    questionsMaxLength,
                    questionsCooldownSec,
                );
            case 'timer':
                return moduleService.buildTimerConfig(
                    timerDuration,
                    timerCustomDurationSec,
                    timerEnableSound,
                    timerAllowPause,
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
        questionsAllowAnonymous,
        setQuestionsAllowAnonymous,
        questionsEnableUpvotes,
        setQuestionsEnableUpvotes,
        questionsMaxLength,
        setQuestionsMaxLength,
        questionsCooldownSec,
        setQuestionsCooldownSec,
        timerDuration,
        setTimerDuration,
        timerCustomDurationSec,
        setTimerCustomDurationSec,
        timerEnableSound,
        setTimerEnableSound,
        timerAllowPause,
        setTimerAllowPause,
        getModuleConfig,
    };
}
