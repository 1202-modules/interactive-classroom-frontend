import { useState, useEffect } from 'react';
import type {
  ActivityModuleType,
  ActivityModuleConfig,
  PollAnswerMode,
  QuizTimeLimit,
  TimerDuration,
} from '../types/workspace';
import { moduleService } from '../services/moduleService';

export function useModuleForm(moduleType: ActivityModuleType, isOpen: boolean, createModuleType?: ActivityModuleType) {
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
  const [quizOptions, setQuizOptions] = useState<Array<{ text: string; correct: boolean }>>([
    { text: 'Option 1', correct: true },
    { text: 'Option 2', correct: false },
    { text: 'Option 3', correct: false },
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
      { text: 'Option 1', correct: true },
      { text: 'Option 2', correct: false },
      { text: 'Option 3', correct: false },
    ]);

    setQuestionsAllowAnonymous(false);
    setQuestionsEnableUpvotes(true);
    setQuestionsMaxLength('240');
    setQuestionsCooldownSec('0');

    setTimerDuration('120');
    setTimerCustomDurationSec('180');
    setTimerEnableSound(true);
    setTimerAllowPause(true);
  }, [actualType, isOpen]);

  const getModuleConfig = (): ActivityModuleConfig => {
    switch (actualType) {
      case 'poll':
        return moduleService.buildPollConfig(pollQuestion, pollAnswerMode, pollWordCloud, pollOptions);
      case 'quiz':
        return moduleService.buildQuizConfig(quizQuestion, quizTimeLimit, quizCustomTimeLimit, quizShowCorrectAnswer, quizOptions);
      case 'questions':
        return moduleService.buildQuestionsConfig(questionsAllowAnonymous, questionsEnableUpvotes, questionsMaxLength, questionsCooldownSec);
      case 'timer':
        return moduleService.buildTimerConfig(timerDuration, timerCustomDurationSec, timerEnableSound, timerAllowPause);
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

