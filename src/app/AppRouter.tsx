import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@gravity-ui/uikit';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Oops from './pages/Oops/Oops';
import WorkspacePage from './pages/Workspace/Workspace';
import CreateWorkspacePage from './pages/Workspace/CreateWorkspace';
import SessionPage from './pages/Session/SessionPage';
import PresentationPage from './pages/Session/PresentationPage';
import ParticipantPage from './pages/Session/ParticipantPage';
import ProfilePage from './pages/Profile/Profile';
import SettingsPage from './pages/Settings/Settings';
import LoginPage from './pages/Auth/Login';
import RegisterPage from './pages/Auth/Register';
import { useFetchUser } from '@/hooks/useFetchUser';
import { ProtectedRoute } from '@/components/Routing/ProtectedRoute';

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
