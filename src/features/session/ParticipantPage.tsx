import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Label, Loader, SegmentedRadioGroup, Text, TextInput } from '@gravity-ui/uikit';
import { useApi } from '@/shared/hooks/useApi';
import { useAuth } from '@/features/auth/useAuth';
import type { SessionByPasscodeResponse, ParticipantEntryMode } from '@/shared/types/sessionJoin';
import {
    getSessionByPasscode,
    joinAnonymous,
    joinRegistered,
    joinGuest,
    requestEmailCode,
    verifyEmailCode,
    sendHeartbeat,
} from '@/shared/api/sessionJoin';
import { setParticipantToken, setGuestToken, getParticipantToken, getGuestToken } from '@/shared/utils/tokenStorage';
import { parseBackendError } from '@/shared/utils/parseBackendError';
import { getModulesByPasscode } from '@/shared/api/sessionModules';
import type { SessionModuleItem } from '@/shared/types/sessionModulesByPasscode';
import { buildJoinFingerprint } from '@/shared/utils/joinFingerprint';
import { AnonymousJoinForm } from './SessionJoin/AnonymousJoinForm';
import { EmailCodeJoinForm } from './SessionJoin/EmailCodeJoinForm';
import { EmailCodeVerifyForm } from './SessionJoin/EmailCodeVerifyForm';
import { QuestionsModule } from './SessionParticipant/QuestionsModule';
import { TimerModule } from './SessionParticipant/TimerModule';
import { ParticipantsList } from './SessionParticipant/ParticipantsList';
import './ParticipantPage.css';

type JoinState =
    | { type: 'loading' }
    | { type: 'session_info'; data: SessionByPasscodeResponse }
    | { type: 'email_request'; email: string; verificationCode?: string }
    | { type: 'joined'; sessionId: number; participantId: number; entryMode: ParticipantEntryMode }
    | { type: 'error'; message: string };

export default function ParticipantPage() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const api = useApi();
    const { accessToken } = useAuth();
    const [joinState, setJoinState] = useState<JoinState>({ type: 'loading' });
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Heartbeat interval
    const heartbeatIntervalRef = useRef<number | null>(null);
    const isPageVisibleRef = useRef(true);

    // Load session info on mount
    useEffect(() => {
        if (!code) {
            setJoinState({ type: 'error', message: 'Invalid session code' });
            return;
        }

        const loadSessionInfo = async () => {
            try {
                setError(null);
                const sessionInfo = await getSessionByPasscode(api, code);

                if (!sessionInfo.is_started) {
                    setJoinState({ type: 'session_info', data: sessionInfo });
                    return;
                }
                
                // If guest is already authenticated (email_code), join immediately
                if (sessionInfo.guest_authenticated) {
                    await handleJoinGuest(sessionInfo.participant_entry_mode);
                    return;
                }
                
                // If anonymous participant token is valid, restore joined state (return after refresh)
                if (
                    sessionInfo.participant_entry_mode === 'anonymous' &&
                    sessionInfo.participant_authenticated &&
                    sessionInfo.participant_id != null &&
                    sessionInfo.id != null
                ) {
                    setJoinState({
                        type: 'joined',
                        sessionId: sessionInfo.id,
                        participantId: sessionInfo.participant_id,
                        entryMode: sessionInfo.participant_entry_mode,
                    });
                    startHeartbeat(sessionInfo.participant_entry_mode);
                    return;
                }
                
                setJoinState({ type: 'session_info', data: sessionInfo });
            } catch (err: unknown) {
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to load session'
                );
                setJoinState({ type: 'error', message });
            }
        };

        loadSessionInfo();
    }, [code, api]);

    const startHeartbeat = useCallback((entryMode: ParticipantEntryMode) => {
        if (!code) return;

        // Clear existing interval
        if (heartbeatIntervalRef.current !== null) {
            clearInterval(heartbeatIntervalRef.current);
        }

        const sendHeartbeatRequest = async () => {
            try {
                await sendHeartbeat(api, code, entryMode, accessToken);
            } catch (err) {
                // Silently fail - heartbeat errors shouldn't break the UI
                console.error('Heartbeat failed:', err);
            }
        };

        // Send immediately
        sendHeartbeatRequest();

        // Set interval based on page visibility
        const getInterval = () => (isPageVisibleRef.current ? 15000 : 60000); // 15s visible, 60s hidden

        const intervalId = window.setInterval(() => {
            sendHeartbeatRequest();
        }, getInterval());

        heartbeatIntervalRef.current = intervalId;
    }, [code, api, accessToken]);

    const handleJoinRegistered = useCallback(async () => {
        if (!code || joinState.type !== 'session_info') return;

        if (!accessToken) {
            navigate('/login', { state: { from: `/s/${code}` } });
            return;
        }

        setIsJoining(true);
        setError(null);
        try {
            const response = await joinRegistered(api, code);
            setJoinState({
                type: 'joined',
                sessionId: response.session_id,
                participantId: response.participant_id,
                entryMode: 'registered',
            });
            startHeartbeat('registered');
        } catch (err: unknown) {
            const message = parseBackendError(
                (err as { response?: { data?: unknown } })?.response?.data,
                'Failed to join session'
            );
            setError(message);
        } finally {
            setIsJoining(false);
        }
    }, [code, api, accessToken, navigate, joinState, startHeartbeat]);

    // Page Visibility API for heartbeat
    useEffect(() => {
        const handleVisibilityChange = () => {
            isPageVisibleRef.current = !document.hidden;
            // Restart heartbeat with appropriate interval
            if (joinState.type === 'joined') {
                startHeartbeat(joinState.entryMode);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [joinState, startHeartbeat]);

    // Auto-join for registered mode
    useEffect(() => {
        if (
            joinState.type === 'session_info' &&
            joinState.data.participant_entry_mode === 'registered'
        ) {
            if (accessToken) {
                handleJoinRegistered();
            } else {
                navigate('/login', { state: { from: `/s/${code}` } });
            }
        }
    }, [joinState, accessToken, handleJoinRegistered, navigate, code]);

    const handleJoinAnonymous = useCallback(
        async (displayName?: string) => {
            if (!code || joinState.type !== 'session_info') return;

            setIsJoining(true);
            setError(null);
            try {
                const fingerprint = await buildJoinFingerprint();
                const response = await joinAnonymous(api, code, {
                    display_name: displayName,
                    fingerprint,
                });
                setParticipantToken(response.participant_token);
                setJoinState({
                    type: 'joined',
                    sessionId: response.session_id,
                    participantId: response.participant_id,
                    entryMode: 'anonymous',
                });
                startHeartbeat('anonymous');
            } catch (err: unknown) {
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to join session'
                );
                setError(message);
            } finally {
                setIsJoining(false);
            }
        },
        [code, api, joinState, startHeartbeat],
    );

    const handleJoinGuest = useCallback(
        async (entryMode: ParticipantEntryMode = 'email_code') => {
            if (!code) return;

            setIsJoining(true);
            setError(null);
            try {
                const fingerprint = await buildJoinFingerprint();
                const response = await joinGuest(api, code, { fingerprint });
                setJoinState({
                    type: 'joined',
                    sessionId: response.session_id,
                    participantId: response.participant_id,
                    entryMode,
                });
                startHeartbeat(entryMode);
            } catch (err: unknown) {
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to join session'
                );
                setError(message);
            } finally {
                setIsJoining(false);
            }
        },
        [code, api, startHeartbeat],
    );

    const handleRequestEmailCode = useCallback(
        async (email: string) => {
            if (!code || joinState.type !== 'session_info') return;

            setIsJoining(true);
            setError(null);
            try {
                const response = await requestEmailCode(api, code, { email });
                setJoinState({
                    type: 'email_request',
                    email,
                    verificationCode: response.code,
                });
            } catch (err: unknown) {
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to send verification code'
                );
                setError(message);
            } finally {
                setIsJoining(false);
            }
        },
        [code, api, joinState],
    );

    const handleVerifyEmailCode = useCallback(
        async (verificationCode: string, displayName?: string) => {
            if (!code || joinState.type !== 'email_request') return;

            setIsJoining(true);
            setError(null);
            try {
                const response = await verifyEmailCode(api, code, {
                    email: joinState.email,
                    code: verificationCode,
                    display_name: displayName,
                });
                setGuestToken(response.access_token);
                await handleJoinGuest('email_code');
            } catch (err: unknown) {
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Invalid verification code'
                );
                setError(message);
            } finally {
                setIsJoining(false);
            }
        },
        [code, api, joinState, handleJoinGuest],
    );

    // Cleanup heartbeat on unmount
    useEffect(() => {
        return () => {
            if (heartbeatIntervalRef.current !== null) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, []);

    // Render based on join state
    if (joinState.type === 'loading') {
        return (
            <div className="participant-page">
                <Card view="outlined" className="participant-page__card">
                    <Loader size="l" />
                    <Text variant="body-1" style={{ marginTop: '16px' }}>
                        Loading session...
                    </Text>
                </Card>
            </div>
        );
    }

    if (joinState.type === 'error') {
        return (
            <div className="participant-page">
                <Card view="outlined" className="participant-page__card">
                    <Text variant="header-2" color="danger">
                        Error
                    </Text>
                    <Text variant="body-1" style={{ marginTop: '16px' }}>
                        {joinState.message}
                    </Text>
                    <Button
                        view="action"
                        size="l"
                        className="participant-page__retry-btn"
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '16px' }}
                    >
                        Retry
                    </Button>
                </Card>
            </div>
        );
    }

    if (joinState.type === 'session_info') {
        const { data: sessionInfo } = joinState;
        const mode: ParticipantEntryMode = sessionInfo.participant_entry_mode;

        if (!sessionInfo.is_started) {
            return (
                <div className="participant-page">
                    <Card view="outlined" className="participant-page__card participant-page__empty-card">
                        <Text variant="header-2">Session Not Started</Text>
                        <Text variant="body-1" color="secondary" style={{ marginTop: '16px' }}>
                            You will be able to join when the lecturer starts this session.
                        </Text>
                    </Card>
                </div>
            );
        }

        // Handle different entry modes
        if (mode === 'anonymous') {
            return (
                <div className="participant-page">
                    <Card view="outlined" className="participant-page__card">
                        <AnonymousJoinForm onSubmit={handleJoinAnonymous} isLoading={isJoining} />
                        {error && (
                            <Text variant="body-2" color="danger" style={{ marginTop: '16px' }}>
                                {error}
                            </Text>
                        )}
                    </Card>
                </div>
            );
        }

        if (mode === 'registered') {
            return (
                <div className="participant-page">
                    <Card view="outlined" className="participant-page__card">
                        <Loader size="l" />
                        <Text variant="body-1" style={{ marginTop: '16px' }}>
                            Joining session...
                        </Text>
                    </Card>
                </div>
            );
        }

        if (mode === 'sso') {
            return (
                <div className="participant-page">
                    <Card view="outlined" className="participant-page__card">
                        <Text variant="header-2">SSO Authentication</Text>
                        <Text variant="body-1" style={{ marginTop: '16px' }}>
                            SSO authentication is not yet implemented.
                        </Text>
                    </Card>
                </div>
            );
        }

        if (mode === 'email_code') {
            return (
                <div className="participant-page">
                    <Card view="outlined" className="participant-page__card">
                        <EmailCodeJoinForm
                            onSubmit={handleRequestEmailCode}
                            isLoading={isJoining}
                            error={error}
                            emailCodeDomainsWhitelist={sessionInfo.email_code_domains_whitelist}
                        />
                    </Card>
                </div>
            );
        }
    }

    if (joinState.type === 'email_request') {
        return (
            <div className="participant-page">
                <Card view="outlined" className="participant-page__card">
                    <EmailCodeVerifyForm
                        email={joinState.email}
                        onSubmit={handleVerifyEmailCode}
                        isLoading={isJoining}
                        error={error}
                        verificationCode={joinState.verificationCode}
                    />
                </Card>
            </div>
        );
    }

    if (joinState.type === 'joined') {
        return (
            <JoinedSessionView
                code={code!}
                api={api}
                participantId={joinState.participantId}
                entryMode={joinState.entryMode}
            />
        );
    }

    return null;
}

interface JoinedSessionViewProps {
    code: string;
    api: ReturnType<typeof useApi>;
    participantId: number;
    entryMode: ParticipantEntryMode;
}

function JoinedSessionView({ code, api, participantId, entryMode }: JoinedSessionViewProps) {
    const [modules, setModules] = useState<SessionModuleItem[]>([]);
    const [activeModule, setActiveModule] = useState<SessionModuleItem | null>(null);
    const [activeTab, setActiveTab] = useState<'module' | 'participants'>('module');
    const [isLoadingModules, setIsLoadingModules] = useState(true);
    const [modulesError, setModulesError] = useState<string | null>(null);
    const initialModulesLoadRef = useRef(true);
    const { accessToken: userToken } = useAuth();
    const guestToken = getGuestToken();
    const participantToken = getParticipantToken();

    // Use only token type that matches entry mode.
    const authToken = useMemo(() => {
        if (entryMode === 'anonymous') return participantToken || null;
        if (entryMode === 'email_code') return guestToken || null;
        return userToken || null;
    }, [entryMode, guestToken, userToken, participantToken]);

    useEffect(() => {
        if (!authToken) {
            setModulesError('Authentication required');
            setIsLoadingModules(false);
            return;
        }

        initialModulesLoadRef.current = true;

        const fetchModules = async () => {
            const isInitial = initialModulesLoadRef.current;
            if (isInitial) {
                setIsLoadingModules(true);
                setModulesError(null);
            }
            try {
                const response = await getModulesByPasscode(api, code, authToken);
                initialModulesLoadRef.current = false;
                setModules(response.modules || []);
                setActiveModule(response.active_module || null);
            } catch (err: unknown) {
                initialModulesLoadRef.current = false;
                const message = parseBackendError(
                    (err as { response?: { data?: unknown } })?.response?.data,
                    'Failed to load modules'
                );
                setModulesError(message);
            } finally {
                setIsLoadingModules(false);
            }
        };

        fetchModules();
        // Poll every 5 seconds for module updates (no full-page loading, only data refresh)
        const interval = setInterval(fetchModules, 3000);
        return () => clearInterval(interval);
    }, [code, api, authToken]);

    if (!authToken) {
        return (
            <div className="participant-page">
                <Card view="outlined" className="participant-page__card">
                    <Text variant="header-2" color="danger">Authentication Error</Text>
                    <Text variant="body-1" style={{ marginTop: '16px' }}>
                        Unable to authenticate. Please refresh the page.
                    </Text>
                </Card>
            </div>
        );
    }

    if (isLoadingModules) {
        return (
            <div className="participant-page">
                <Card view="outlined" className="participant-page__card">
                    <Loader size="l" />
                    <Text variant="body-1" style={{ marginTop: '16px' }}>
                        Loading session modules...
                    </Text>
                </Card>
            </div>
        );
    }

    if (modulesError) {
        return (
            <div className="participant-page">
                <Card view="outlined" className="participant-page__card">
                    <Text variant="header-2" color="danger">Error</Text>
                    <Text variant="body-1" style={{ marginTop: '16px' }}>
                        {modulesError}
                    </Text>
                    <Button
                        view="action"
                        size="l"
                        className="participant-page__retry-btn"
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '16px' }}
                    >
                        Retry
                    </Button>
                </Card>
            </div>
        );
    }

    const moduleContent = (
        <>
            {activeModule && activeModule.module_type === 'questions' && (
                <QuestionsModule
                    api={api}
                    passcode={code}
                    moduleId={activeModule.id}
                    authToken={authToken}
                    participantId={participantId}
                />
            )}

            {activeModule && activeModule.module_type === 'timer' && (
                <TimerModule api={api} passcode={code} moduleId={activeModule.id} />
            )}

            {!activeModule && (
                <Card view="outlined" className="participant-page__card participant-page__empty-card">
                    <Text variant="header-2">No Active Module</Text>
                    <Text variant="body-1" color="secondary" style={{ marginTop: '16px' }}>
                        Waiting for lecturer to activate a module...
                    </Text>
                </Card>
            )}
        </>
    );

    return (
        <div className="participant-page">
            <div className="participant-page__tabs-shell">
                <div className="participant-page__switch">
                    <SegmentedRadioGroup
                        size="xl"
                        value={activeTab}
                        onUpdate={(value) => setActiveTab(value as 'module' | 'participants')}
                        options={[
                            { value: 'module', content: 'Module' },
                            { value: 'participants', content: 'Participants' },
                        ]}
                    />
                </div>
            </div>

            <div className={activeTab === 'module' ? 'participant-page__tab-panel' : 'participant-page__tab-panel participant-page__tab-panel_hidden'}>
                {moduleContent}
            </div>

            <div className={activeTab === 'participants' ? 'participant-page__tab-panel' : 'participant-page__tab-panel participant-page__tab-panel_hidden'}>
                <ParticipantsList
                    api={api}
                    passcode={code}
                    authToken={authToken}
                    participantId={participantId}
                    entryMode={entryMode}
                />
            </div>
        </div>
    );
}
