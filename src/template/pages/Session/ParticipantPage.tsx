import {useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';
import {Button, Card, Label, Text, TextInput} from '@gravity-ui/uikit';
import type {SessionModule} from '../../types/sessionPage';
import {mockSessionDetail} from '../../data/mockSessionDetail';
import './ParticipantPage.css';

type TimerConfig = {
    duration_sec?: number;
};

const formatDuration = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const remaining = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

type QuestionItem = {
    id: number;
    text: string;
    likes: number;
    isMine: boolean;
    isLiked: boolean;
};

export default function ParticipantPage() {
    const {code} = useParams();
    const sessionDetail = mockSessionDetail;
    const [questionText, setQuestionText] = useState('');
    const [questions, setQuestions] = useState<QuestionItem[]>([
        {
            id: 1,
            text: 'Can we get the slides after the session?',
            likes: 4,
            isMine: false,
            isLiked: false,
        },
        {
            id: 2,
            text: 'What is the deadline for the next task?',
            likes: 2,
            isMine: false,
            isLiked: false,
        },
    ]);

    const activeModule = useMemo(
        () => sessionDetail.session_modules.find((m) => m.is_active),
        [sessionDetail.session_modules],
    );

    const timerConfig = (activeModule?.config ?? {}) as TimerConfig;
    const remainingTime = formatDuration(timerConfig.duration_sec ?? 0);
    const statusLabel = sessionDetail.is_stopped ? 'stopped' : 'active';

    const sortedQuestions = useMemo(
        () => [...questions].sort((a, b) => b.likes - a.likes),
        [questions],
    );

    const handleSubmitQuestion = () => {
        const trimmed = questionText.trim();
        if (!trimmed) return;
        setQuestions((prev) => [
            {id: Date.now(), text: trimmed, likes: 0, isMine: true, isLiked: false},
            ...prev,
        ]);
        setQuestionText('');
    };

    const handleLikeQuestion = (id: number) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== id) return q;
                const nextLiked = !q.isLiked;
                const delta = nextLiked ? 1 : -1;
                return {
                    ...q,
                    isLiked: nextLiked,
                    likes: Math.max(0, q.likes + delta),
                };
            }),
        );
    };

    return (
        <div className="participant-page">
            <div className="participant-page__header">
                <Text variant="display-1">Session</Text>
                <Text variant="body-2" color="secondary">
                    Code: {code || '—'}
                </Text>
            </div>

            {!activeModule && (
                <Card view="outlined" className="participant-page__card">
                    <Text variant="header-1">No active module</Text>
                    <Text variant="body-1" color="secondary">
                        Please wait for the host to start a module.
                    </Text>
                </Card>
            )}

            {activeModule && activeModule.type === 'timer' && (
                <Card view="outlined" className="participant-page__card">
                    <div className="participant-page__card-head">
                        <Text variant="header-2">Timer</Text>
                        <Label theme={sessionDetail.is_stopped ? 'normal' : 'success'} size="m">
                            {statusLabel}
                        </Label>
                    </div>
                    <Text variant="display-3" className="participant-page__timer">
                        {remainingTime}
                    </Text>
                    <Text variant="body-2" color="secondary">
                        Countdown to the end of the timer.
                    </Text>
                </Card>
            )}

            {activeModule && activeModule.type === 'questions' && (
                <Card view="outlined" className="participant-page__card">
                    <div className="participant-page__card-head">
                        <Text variant="header-2">Questions</Text>
                        <Label theme={sessionDetail.is_stopped ? 'normal' : 'success'} size="m">
                            {statusLabel}
                        </Label>
                    </div>
                    <div className="participant-page__question-form">
                        <TextInput
                            placeholder="Ask a question"
                            size="l"
                            value={questionText}
                            onUpdate={setQuestionText}
                        />
                        <Button view="action" size="l" onClick={handleSubmitQuestion}>
                            Send
                        </Button>
                    </div>
                    <div className="participant-page__questions-list">
                        {sortedQuestions.length === 0 ? (
                            <div className="participant-page__questions-empty">
                                <Text variant="body-1" color="secondary">
                                    Be the first to ask a question.
                                </Text>
                            </div>
                        ) : (
                            sortedQuestions.map((question) => (
                                <div key={question.id} className="participant-page__question-item">
                                    <div className="participant-page__question-text">
                                        <Text variant="body-1">{question.text}</Text>
                                    </div>
                                    <div className="participant-page__question-actions">
                                        <Text variant="body-2" color="secondary">
                                            {question.likes}
                                        </Text>
                                        <Button
                                            view="flat"
                                            size="s"
                                            disabled={question.isMine}
                                            onClick={() => handleLikeQuestion(question.id)}
                                        >
                                            {question.isLiked ? 'Unlike' : 'Like'}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            )}

            {activeModule && activeModule.type !== 'timer' && activeModule.type !== 'questions' && (
                <Card view="outlined" className="participant-page__card">
                    <Text variant="header-2">{activeModule.name}</Text>
                    <Text variant="body-1" color="secondary">
                        Module type: {activeModule.type}
                    </Text>
                </Card>
            )}
        </div>
    );
}
