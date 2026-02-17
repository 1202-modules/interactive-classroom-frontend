import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@gravity-ui/uikit';
import Layout from '@/shared/components/Layout';
import Dashboard from '@/features/dashboard/Dashboard';
import Oops from '@/features/oops/Oops';
import WorkspacePage from '@/features/workspace/Workspace';
import CreateWorkspacePage from '@/features/workspace/CreateWorkspace';
import SessionPage from '@/features/session/SessionPage';
import PresentationPage from '@/features/session/PresentationPage';
import ParticipantPage from '@/features/session/ParticipantPage';
import ProfilePage from '@/features/profile/Profile';
import SettingsPage from '@/features/settings/Settings';
import LoginPage from '@/features/auth/pages/Login';
import RegisterPage from '@/features/auth/pages/Register';
import { useFetchUser } from '@/features/auth/useFetchUser';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

function AppRouter() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
    useFetchUser();

    return (
        <ThemeProvider theme={theme}>
            <Layout theme={theme} onToggleTheme={toggleTheme}>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/s/:code" element={<ParticipantPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/workspace/create"
                        element={
                            <ProtectedRoute>
                                <CreateWorkspacePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/workspace/:workspaceId/session/:sessionId/presentation"
                        element={
                            <ProtectedRoute>
                                <PresentationPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/workspace/:workspaceId/session/:sessionId"
                        element={
                            <ProtectedRoute>
                                <SessionPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/workspace/:id"
                        element={
                            <ProtectedRoute>
                                <WorkspacePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <SettingsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/terms" element={<Oops />} />
                    <Route path="/privacy" element={<Oops />} />
                    <Route path="/support" element={<Oops />} />
                </Routes>
            </Layout>
        </ThemeProvider>
    );
}

export default AppRouter;
