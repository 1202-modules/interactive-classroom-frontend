import React from 'react';
import {Theme, ThemeProvider} from '@gravity-ui/uikit';
import {Wrapper} from './components/Wrapper';
import {DEFAULT_THEME} from './constants';
import {Link, Route, Routes} from 'react-router-dom';
import Auth from './pages/auth/Auth';
import NotFound from './pages/NotFound';
import Logout from './pages/auth/Logout';
import {ProtectedRoute} from './components/Routing/ProtectedRoute';
import {useFetchUser} from './hooks/useFetchUser';
import ProfileEdit from './pages/profile/ProfileEdit';
import Profile from './pages/profile/Profile';
import Workspaces from './pages/workspaces/Workspaces';
import WorkspaceShow from './pages/workspaces/WorkspaceShow';
import SessionShow from './pages/sessions/SessionShow';
import SessionEdit from './pages/sessions/SessionEdit';
import TemplateApp from './template/TemplateApp';

const MainApp = () => {
    const [, setTheme] = React.useState<Theme>(DEFAULT_THEME);
    
    return (
        <Wrapper setTheme={setTheme}>
            <Routes>
                <Route path="/" element={<Link to="/auth/login">Home</Link>} />
                <Route path="/auth/*" element={<Auth />} />
                <Route
                    path="/logout"
                    element={
                        <ProtectedRoute>
                            <Logout />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile/edit"
                    element={
                        <ProtectedRoute>
                            <ProfileEdit />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspaces"
                    element={
                        <ProtectedRoute>
                            <Workspaces />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspaces/:workspaceId"
                    element={
                        <ProtectedRoute>
                            <WorkspaceShow />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sessions/:sessionId"
                    element={
                        <ProtectedRoute>
                            <SessionShow />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sessions/:sessionId/edit"
                    element={
                        <ProtectedRoute>
                            <SessionEdit />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Wrapper>
    );
};

const App = () => {
    // useAuthInit();
    useFetchUser();

    return (
        <ThemeProvider theme={DEFAULT_THEME}>
            <Routes>
                <Route path="/template/*" element={<TemplateApp />} />
                <Route path="/*" element={<MainApp />} />
            </Routes>
        </ThemeProvider>
    );
};

export default App;
