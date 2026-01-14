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
import {useAuthInit} from './hooks/useAuthInit';
import ProfileEdit from './pages/profile/ProfileEdit';
import Profile from './pages/profile/Profile';

const App = () => {
    // useAuthInit();
    useFetchUser();

    const [theme, setTheme] = React.useState<Theme>(DEFAULT_THEME);

    return (
        <ThemeProvider theme={theme}>
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
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Wrapper>
        </ThemeProvider>
    );
};

export default App;
