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
import ProfilePage from './pages/Profile/Profile';
import SettingsPage from './pages/Settings/Settings';
import LoginPage from './pages/Auth/Login';
import RegisterPage from './pages/Auth/Register';
import { useFetchUser } from '@/hooks/useFetchUser';

function TemplateApp() {
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
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/workspace/create" element={<CreateWorkspacePage />} />
                    <Route
                        path="/workspace/:workspaceId/session/:sessionId/presentation"
                        element={<PresentationPage />}
                    />
                    <Route
                        path="/workspace/:workspaceId/session/:sessionId"
                        element={<SessionPage />}
                    />
                    <Route path="/workspace/:id" element={<WorkspacePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/terms" element={<Oops />} />
                    <Route path="/privacy" element={<Oops />} />
                    <Route path="/support" element={<Oops />} />
                </Routes>
            </Layout>
        </ThemeProvider>
    );
}

export default TemplateApp;
