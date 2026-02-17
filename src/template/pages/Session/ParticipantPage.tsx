import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Label, Loader, Text, TextInput } from '@gravity-ui/uikit';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import type { SessionByPasscodeResponse, ParticipantEntryMode } from '@/types/sessionJoin';
import {
    getSessionByPasscode,
    joinAnonymous,
    joinRegistered,
    joinGuest,
    requestEmailCode,
    verifyEmailCode,
    sendHeartbeat,
} from '@/api/sessionJoin';
import { setParticipantToken, setGuestToken, getParticipantToken } from '@/utils/tokenStorage';
import { AnonymousJoinForm } from '../../components/SessionJoin/AnonymousJoinForm';
import { EmailCodeJoinForm } from '../../components/SessionJoin/EmailCodeJoinForm';
import { EmailCodeVerifyForm } from '../../components/SessionJoin/EmailCodeVerifyForm';
import './ParticipantPage.css';

type JoinState =
    | { type: 'loading' }
    | { type: 'session_info'; data: SessionByPasscodeResponse }
    | { type: 'email_request'; email: string; verificationCode?: string }
    | { type: 'joined'; sessionId: number; participantId: number }
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
                
                // If guest is already authenticated, join immediately
                if (sessionInfo.guest_authenticated) {
                    await handleJoinGuest(sessionInfo);
                    return;
                }
                
                setJoinState({ type: 'session_info', data: sessionInfo });
            } catch (err: any) {
                const message =
                    err?.response?.data?.detail ||
                    err?.response?.data ||
                    err?.message ||
                    'Failed to load session';
                setJoinState({ type: 'error', message });
            }
        };

        loadSessionInfo();
    }, [code, api]);

    // Page Visibility API for heartbeat
    useEffect(() => {
        const handleVisibilityChange = () => {
            isPageVisibleRef.current = !document.hidden;
            // Restart heartbeat with appropriate interval
            if (joinState.type === 'joined') {
                startHeartbeat();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [joinState.type, startHeartbeat]);

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
                const response = await joinAnonymous(api, code, { display_name: displayName });
                setParticipantToken(response.participant_token);
                setJoinState({
                    type: 'joined',
                    sessionId: response.session_id,
                    participantId: response.participant_id,
                });
                startHeartbeat();
            } catch (err: any) {
                const message =
                    err?.response?.data?.detail ||
                    err?.response?.data ||
                    err?.message ||
                    'Failed to join session';
                setError(message);
            } finally {
                setIsJoining(false);
            }
        },
        [code, api, joinState],
    );

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
            });
            startHeartbeat();
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data ||
                err?.message ||
                'Failed to join session';
            setError(message);
        } finally {
            setIsJoining(false);
        }
    }, [code, api, accessToken, navigate, joinState]);

    const handleJoinGuest = useCallback(
        async (sessionInfo?: SessionByPasscodeResponse) => {
            if (!code) return;

            setIsJoining(true);
            setError(null);
            try {
                const response = await joinGuest(api, code);
                setJoinState({
                    type: 'joined',
                    sessionId: response.session_id,
                    participantId: response.participant_id,
                });
                startHeartbeat();
            } catch (err: any) {
                const message =
                    err?.response?.data?.detail ||
                    err?.response?.data ||
                    err?.message ||
                    'Failed to join session';
                setError(message);
            } finally {
                setIsJoining(false);
            }
        },
        [code, api],
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
            } catch (err: any) {
                const message =
                    err?.response?.data?.detail ||
                    err?.response?.data ||
                    err?.message ||
                    'Failed to send verification code';
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
                await handleJoinGuest();
            } catch (err: any) {
                const message =
                    err?.response?.data?.detail ||
                    err?.response?.data ||
                    err?.message ||
                    'Invalid verification code';
                setError(message);
            } finally {
                setIsJoining(false);
            }
        },
        [code, api, joinState, handleJoinGuest],
    );

    const startHeartbeat = useCallback(() => {
        if (!code) return;

        // Clear existing interval
        if (heartbeatIntervalRef.current !== null) {
            clearInterval(heartbeatIntervalRef.current);
        }

        const sendHeartbeatRequest = async () => {
            try {
                const participantToken = getParticipantToken();
                await sendHeartbeat(api, code, participantToken);
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
    }, [code, api]);

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
        // TODO: Show actual session interface with modules (Questions, Timer, etc.)
        // This will be implemented in the second half
        return (
            <div className="participant-page">
                <Card view="outlined" className="participant-page__card">
                    <Text variant="header-2">Successfully joined session!</Text>
                    <Text variant="body-1" style={{ marginTop: '16px' }}>
                        Session interface will be implemented in the next phase.
                    </Text>
                    <Text variant="body-2" color="secondary" style={{ marginTop: '8px' }}>
                        Session ID: {joinState.sessionId}, Participant ID: {joinState.participantId}
                    </Text>
                </Card>
            </div>
        );
    }

    return null;
}
