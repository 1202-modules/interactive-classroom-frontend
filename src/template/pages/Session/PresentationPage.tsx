import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {Button, Icon, Text} from '@gravity-ui/uikit';
import {
    ArrowsExpand,
    ArrowsRotateLeft,
    CircleQuestion,
    Clock,
    ListCheck,
    Square,
} from '@gravity-ui/icons';
import {QRCodeSVG} from 'qrcode.react';

import type {SessionDetail} from '../../types/sessionPage';
import {mockSessionDetail} from '../../data/mockSessionDetail';
// TODO: Replace with API call - import { getSessionDetail } from '../../api/sessions';
import './PresentationPage.css';

// Helper для иконок типов модулей
function getModuleIcon(type: 'questions' | 'poll' | 'quiz' | 'timer') {
    switch (type) {
        case 'questions':
            return CircleQuestion;
        case 'poll':
            return Square;
        case 'quiz':
            return ListCheck;
        case 'timer':
            return Clock;
        default:
            return CircleQuestion;
    }
}

// Мок-сообщения чата для демонстрации
const mockChatMessages = [
    {id: 1, author: 'Alice', text: 'Great explanation!', timestamp: Date.now()},
    {id: 2, author: 'Bob', text: 'Can you repeat that?', timestamp: Date.now() + 2000},
    {id: 3, author: 'Charlie', text: '👍', timestamp: Date.now() + 4000},
];

export default function PresentationPage() {
    const {workspaceId: _workspaceId, sessionId: _sessionId} = useParams();
    const [sessionDetail] = useState<SessionDetail>(mockSessionDetail);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [chatMessages, setChatMessages] = useState<typeof mockChatMessages>([]);

    const qrCodeUrl = `${window.location.origin}/s/${sessionDetail.passcode}`;
    const activeModule = sessionDetail.session_modules.find((m) => m.is_active);

    // Simulate chat messages appearing
    useEffect(() => {
        if (activeModule) {
            const timer = setTimeout(() => {
                if (chatMessages.length < mockChatMessages.length) {
                    setChatMessages((prev) => [...prev, mockChatMessages[prev.length]]);
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [chatMessages, activeModule]);

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div className="presentation-page">
            {/* Control buttons (hidden in fullscreen) */}
            {!isFullscreen && (
                <div className="presentation-page__controls">
                    <Button view="flat" size="s" onClick={handleRefresh}>
                        <Icon data={ArrowsRotateLeft} size={16} />
                        Refresh
                    </Button>
                    <Button view="flat" size="s" onClick={handleToggleFullscreen}>
                        <Icon data={ArrowsExpand} size={16} />
                        Fullscreen
                    </Button>
                </div>
            )}

            {/* No active module: Full screen QR code */}
            {!activeModule && (
                <div className="presentation-page__qr-fullscreen">
                    <div className="presentation-page__qr-container">
                        <Text variant="display-3" className="presentation-page__title">
                            {sessionDetail.name}
                        </Text>
                        <div className="presentation-page__qr-code-large">
                            <QRCodeSVG value={qrCodeUrl} size={400} level="M" />
                        </div>
                        <div className="presentation-page__passcode-container">
                            <Text variant="header-1" color="secondary">
                                Join at: {window.location.origin}/s/
                            </Text>
                            <Text variant="display-2" className="presentation-page__passcode">
                                {sessionDetail.passcode}
                            </Text>
                        </div>
                        <Text variant="subheader-1" color="secondary">
                            Scan QR code or enter passcode to join
                        </Text>
                    </div>
                </div>
            )}

            {/* With active module: 3/4 module + 1/4 sidebar */}
            {activeModule && (
                <div className="presentation-page__with-module">
                    {/* LEFT 3/4: Active Module */}
                    <div className="presentation-page__module-area">
                        <div className="presentation-page__module-content">
                            <Icon
                                data={getModuleIcon(activeModule.type)}
                                size={80}
                                className="presentation-page__module-icon"
                            />
                            <Text variant="display-2">{activeModule.name}</Text>
                            <Text variant="header-1" color="secondary">
                                Module Type:{' '}
                                {activeModule.type.charAt(0).toUpperCase() +
                                    activeModule.type.slice(1)}
                            </Text>

                            {/* Module-specific content preview */}
                            {activeModule.type === 'questions' && (
                                <div className="presentation-page__module-details">
                                    <Text variant="subheader-1">Questions & Answers</Text>
                                    <div className="presentation-page__question-placeholder">
                                        <Text variant="body-2" color="secondary">
                                            Questions from students will appear here...
                                        </Text>
                                    </div>
                                </div>
                            )}

                            {activeModule.type === 'poll' &&
                                activeModule.config.type === 'poll' && (
                                    <div className="presentation-page__module-details">
                                        <Text variant="header-2">
                                            {activeModule.config.question}
                                        </Text>
                                        <div className="presentation-page__wordcloud-placeholder">
                                            <Text variant="display-1" style={{opacity: 0.3}}>
                                                ☁️ Word Cloud
                                            </Text>
                                            <Text variant="body-2" color="secondary">
                                                Results will appear here as students respond
                                            </Text>
                                        </div>
                                    </div>
                                )}

                            {activeModule.type === 'quiz' &&
                                activeModule.config.type === 'quiz' && (
                                    <div className="presentation-page__module-details">
                                        <Text variant="header-2">
                                            {activeModule.config.question}
                                        </Text>
                                        <div className="presentation-page__quiz-options">
                                            {activeModule.config.options.map(
                                                (
                                                    option: {text: string; correct: boolean},
                                                    idx: number,
                                                ) => (
                                                    <div
                                                        key={idx}
                                                        className={`presentation-page__quiz-option ${
                                                            option.correct
                                                                ? 'presentation-page__quiz-option_correct'
                                                                : ''
                                                        }`}
                                                    >
                                                        <Text variant="subheader-1">
                                                            {String.fromCharCode(65 + idx)}.{' '}
                                                            {option.text}
                                                        </Text>
                                                        <div className="presentation-page__quiz-bar">
                                                            <div
                                                                className="presentation-page__quiz-bar-fill"
                                                                style={{
                                                                    width: `${
                                                                        Math.random() * 80 + 10
                                                                    }%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {activeModule.type === 'timer' && (
                                <div className="presentation-page__module-details">
                                    <div className="presentation-page__timer-display">
                                        <Text
                                            variant="display-3"
                                            className="presentation-page__timer-text"
                                        >
                                            05:00
                                        </Text>
                                    </div>
                                    <Text variant="body-1" color="secondary">
                                        Timer countdown in progress...
                                    </Text>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT 1/4: QR + Chat */}
                    <div className="presentation-page__sidebar">
                        {/* Small QR Code */}
                        <div className="presentation-page__qr-small">
                            <Text variant="subheader-1">Join Session</Text>
                            <div className="presentation-page__qr-code-small">
                                <QRCodeSVG value={qrCodeUrl} size={120} level="M" />
                            </div>
                            <Text variant="caption-1" color="secondary">
                                {sessionDetail.passcode}
                            </Text>
                        </div>

                        {/* Chat Messages */}
                        <div className="presentation-page__chat">
                            <Text variant="subheader-1">Live Chat</Text>
                            <div className="presentation-page__chat-messages">
                                {chatMessages.map((msg) => (
                                    <div key={msg.id} className="presentation-page__chat-message">
                                        <Text variant="body-short">
                                            <strong>{msg.author}:</strong> {msg.text}
                                        </Text>
                                    </div>
                                ))}
                                {chatMessages.length === 0 && (
                                    <Text variant="caption-1" color="secondary">
                                        No messages yet...
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
