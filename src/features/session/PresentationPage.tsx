import {useCallback, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {Button, Icon, Text} from '@gravity-ui/uikit';
import { ArrowsExpand, ArrowsRotateLeft } from '@gravity-ui/icons';
import {QRCodeSVG} from 'qrcode.react';

import type {SessionInfo, SessionModule, SessionModuleApi} from '@/shared/types/sessionPage';
import {getModuleIcon} from '@/shared/utils/sessionModuleUtils';
import {useApi} from '@/shared/hooks/useApi';
import {SESSION_FIELDS, SESSION_MODULE_FIELDS, fieldsToString} from '@/shared/api/fields';
import './PresentationPage.css';


const mapSessionModule = (module: SessionModuleApi, index: number): SessionModule => ({
    id: String(module.id),
    module_id: 0,
    order: index,
    is_active: module.is_active,
    name: module.name ?? 'Untitled module',
    type: module.module_type,
    config: module.settings ?? {},
});

export default function PresentationPage() {
    const {sessionId} = useParams();
    const api = useApi();
    const sessionIdNumber = Number(sessionId);
    const isSessionIdValid = Number.isFinite(sessionIdNumber);
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const [sessionModules, setSessionModules] = useState<SessionModule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const fetchSessionInfo = useCallback(async () => {
        if (!isSessionIdValid) return;
        setIsLoading(true);
        try {
            const res = await api.get<SessionInfo>(`/sessions/${sessionIdNumber}`, {
                params: {fields: fieldsToString(SESSION_FIELDS.PRESENTATION)},
            });
            setSessionInfo(res.data);
        } catch (err) {
            setSessionInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, [api, isSessionIdValid, sessionIdNumber]);

    const fetchSessionModules = useCallback(async () => {
        if (!isSessionIdValid) return;
        try {
            const res = await api.get<SessionModuleApi[]>(
                `/sessions/${sessionIdNumber}/modules`,
                {
                    params: {fields: fieldsToString(SESSION_MODULE_FIELDS.LIST)},
                },
            );
            setSessionModules((res.data || []).map(mapSessionModule));
        } catch (err) {
            setSessionModules([]);
        }
    }, [api, isSessionIdValid, sessionIdNumber]);

    useEffect(() => {
        fetchSessionInfo();
    }, [fetchSessionInfo]);

    useEffect(() => {
        fetchSessionModules();
    }, [fetchSessionModules]);

    useEffect(() => {
        document.body.classList.add('presentation-mode');
        return () => {
            document.body.classList.remove('presentation-mode');
        };
    }, []);

    useEffect(() => {
        if (!isSessionIdValid) return;
        const intervalId = window.setInterval(() => {
            fetchSessionModules();
        }, 5000);
        return () => window.clearInterval(intervalId);
    }, [fetchSessionModules, isSessionIdValid]);

    const passcode = sessionInfo?.passcode ?? '';
    const qrCodeUrl = passcode ? `${window.location.origin}/s/${passcode}` : '';
    const activeModule = sessionModules.find((m) => m.is_active);


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
                            {isLoading ? 'Loading…' : sessionInfo?.name || 'Session'}
                        </Text>
                        <div className="presentation-page__qr-code-large">
                            {qrCodeUrl ? (
                                <QRCodeSVG value={qrCodeUrl} size={400} level="M" />
                            ) : (
                                <div className="presentation-page__qr-placeholder" />
                            )}
                        </div>
                        <div className="presentation-page__passcode-container">
                            <Text variant="header-1" color="secondary">
                                Join at: {window.location.origin}/s/
                            </Text>
                            <Text variant="display-2" className="presentation-page__passcode">
                                {passcode || '—'}
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
                                            {String((activeModule.config as { question?: unknown }).question ?? '')}
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
                                            {String((activeModule.config as { question?: unknown }).question ?? '')}
                                        </Text>
                                        <div className="presentation-page__quiz-options">
                                            {((activeModule.config as { options?: Array<{ text: string; correct: boolean }> }).options ?? []).map(
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

                    {/* RIGHT 1/4: QR */}
                    <div className="presentation-page__sidebar">
                        {/* Small QR Code */}
                        <div className="presentation-page__qr-small">
                            <Text variant="display-2">Join Session</Text>
                            <Text variant="header-1" color="secondary">
                                {passcode || '—'}
                            </Text>
                            <div className="presentation-page__qr-code-small">
                                {qrCodeUrl ? (
                                    <QRCodeSVG value={qrCodeUrl} size={1000} level="M" />
                                ) : (
                                    <div className="presentation-page__qr-placeholder" />
                                )}
                            </div>
                        </div>

                        {/* Chat removed for presentation mode */}
                    </div>
                </div>
            )}
        </div>
    );
}
