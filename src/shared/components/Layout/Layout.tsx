import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, DropdownMenu, Icon, Skeleton, Spin, Text } from '@gravity-ui/uikit';
import { ArrowRightFromSquare, Gear, GraduationCap, Moon, Person, Sun } from '@gravity-ui/icons';
import { useDispatch } from 'react-redux';
import { useUser } from '@/shared/hooks/useUser';
import { useAuth } from '@/features/auth/useAuth';
import { logout } from '@/shared/store/authSlice';
import { setUser } from '@/shared/store/userSlice';
import type { AppDispatch } from '@/shared/store/store';
import { api } from '@/shared/api/api';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, theme, onToggleTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isPageLoading, setIsPageLoading] = useState(false);
    const { accessToken } = useAuth();
    const { data: user, loading: userLoading } = useUser();
    const dispatch = useDispatch<AppDispatch>();
    const path = location.pathname;
    const isAuthRoute =
        path.startsWith('/login') || path.startsWith('/register');
    const isPublicRoute =
        path === '/' ||
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path === '/terms' ||
        path === '/privacy' ||
        path === '/support';
    const isHomePage = path === '/';
    const isPublicWithHeader =
        isHomePage || path === '/terms' || path === '/privacy' || path === '/support';

    useEffect(() => {
        // Simulate page load for 0.2 seconds on every route change
        setIsPageLoading(true);
        const timer = window.setTimeout(() => {
            setIsPageLoading(false);
        }, 200);

        return () => window.clearTimeout(timer);
    }, [location.pathname]);

    const getPageTitle = (): string => {
        if (path.startsWith('/login')) return 'Login';
        if (path.startsWith('/register')) return 'Register';
        if (path.startsWith('/profile')) return 'Profile';
        if (path.startsWith('/settings')) return 'Settings';
        if (path.startsWith('/workspace/create')) return 'Create Workspace';
        if (path.includes('/session/') && path.includes('/presentation'))
            return 'Presentation';
        if (path.includes('/session/')) return 'Session';
        if (path.startsWith('/workspace/')) return 'Workspace';
        if (path.startsWith('/dashboard')) return 'Dashboard';
        return 'Dashboard';
    };

    const handleLogout = useCallback(async () => {
        try {
            await api.post('/auth/logout', null, { withCredentials: true });
        } catch {
            // Proceed with local cleanup even if server logout fails (e.g. offline)
        }
        dispatch(logout());
        dispatch(setUser(null));
        delete api.defaults.headers.common.Authorization;
        navigate('/login', { replace: true });
    }, [dispatch, navigate]);

    const userDisplayName = useMemo(() => {
        if (!user) return '';
        const first = user.first_name?.trim();
        const last = user.last_name?.trim();
        const full = [first, last].filter(Boolean).join(' ');
        return full || user.email || '';
    }, [user]);

    const userInitials = useMemo(() => {
        if (!user) return 'U';
        const first = user.first_name?.[0] || '';
        const last = user.last_name?.[0] || '';
        const initials = `${first}${last}`.trim();
        if (initials.length > 0) return initials.toUpperCase();
        if (user.email) return user.email[0]?.toUpperCase() || 'U';
        return 'U';
    }, [user]);

    const userEmailItem = user?.email || 'Not signed in';

    const userMenuItems = [
        [
            {
                text: userEmailItem,
                action: () => { },
                disabled: true,
            },
            {
                text: 'Profile',
                iconStart: <Icon data={Person} size={16} />,
                action: () => navigate('/profile'),
            },
            {
                text: 'Settings',
                iconStart: <Icon data={Gear} size={16} />,
                action: () => navigate('/settings'),
            },
            {
                text: 'Log out',
                iconStart: <Icon data={ArrowRightFromSquare} size={16} />,
                theme: 'danger' as const,
                action: handleLogout,
            },
        ],
    ];

    return (
        <div className="layout">
            <header className="layout-header">
                <div className="layout-header__inner">
                    <div className="layout-header__left">
                        <Button
                            view="flat"
                            size="m"
                            onClick={() =>
                                navigate(isPublicRoute ? '/' : '/dashboard')
                            }
                            className="layout-header__logo"
                        >
                            <Icon
                                data={GraduationCap}
                                size={22}
                                className="layout-header__logo-icon"
                            />
                            <div className="layout-header__logo-text">
                                <Text variant="subheader-3" className="layout-header__logo-title">
                                    Interactive Classroom Platform
                                </Text>
                                {!isPublicRoute && (
                                    <Text
                                        variant="body-1"
                                        color="secondary"
                                        className="layout-header__logo-sub"
                                    >
                                        {getPageTitle()}
                                    </Text>
                                )}
                            </div>
                        </Button>
                    </div>
                    <div className="layout-header__right">
                        <Button
                            view="flat"
                            size="l"
                            onClick={onToggleTheme}
                            className="layout-header__theme"
                            title={
                                theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
                            }
                        >
                            <Icon data={theme === 'light' ? Moon : Sun} size={24} />
                        </Button>
                        {isAuthRoute ? (
                            path === '/login' ? (
                                <Button
                                    view="outlined"
                                    size="l"
                                    onClick={() => navigate('/register')}
                                >
                                    Sign Up
                                </Button>
                            ) : path === '/register' ? (
                                <Button
                                    view="outlined"
                                    size="l"
                                    onClick={() => navigate('/login')}
                                >
                                    Log in
                                </Button>
                            ) : null
                        ) : isPublicWithHeader ? (
                            isPageLoading || (accessToken && userLoading) ? (
                                <div className="layout-header__user-skeleton">
                                    <Skeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
                                    <Skeleton style={{ width: 80, height: 16, borderRadius: 4 }} />
                                </div>
                            ) : accessToken && user ? (
                                <>
                                    <Button
                                        view="action"
                                        size="l"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Dashboard
                                    </Button>
                                    <DropdownMenu
                                        items={userMenuItems}
                                        switcherWrapperClassName="layout-header__user-wrap"
                                        popupProps={{ placement: 'bottom-end' }}
                                        renderSwitcher={(props) => (
                                            <Button
                                                {...props}
                                                view="flat"
                                                size="l"
                                                className="layout-header__user"
                                            >
                                                <Avatar
                                                    size="m"
                                                    text={userInitials}
                                                    theme="brand"
                                                    imgUrl={user.avatar_url || undefined}
                                                    className="layout-header__user-avatar"
                                                />
                                                <Text variant="body-1" className="layout-header__user-name">
                                                    {userDisplayName}
                                                </Text>
                                            </Button>
                                        )}
                                    />
                                </>
                            ) : (
                                <>
                                    <Button
                                        view="outlined"
                                        size="l"
                                        onClick={() => navigate('/login')}
                                    >
                                        Log in
                                    </Button>
                                    <Button
                                        view="outlined"
                                        size="l"
                                        onClick={() => navigate('/register')}
                                    >
                                        Sign Up
                                    </Button>
                                </>
                            )
                        ) : isPageLoading || (accessToken && userLoading) ? (
                            <div className="layout-header__user-skeleton">
                                <Skeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
                                <Skeleton style={{ width: 80, height: 16, borderRadius: 4 }} />
                            </div>
                        ) : accessToken && user ? (
                            <DropdownMenu
                                items={userMenuItems}
                                switcherWrapperClassName="layout-header__user-wrap"
                                popupProps={{ placement: 'bottom-end' }}
                                renderSwitcher={(props) => (
                                    <Button
                                        {...props}
                                        view="flat"
                                        size="l"
                                        className="layout-header__user"
                                    >
                                        <Avatar
                                            size="m"
                                            text={userInitials}
                                            theme="brand"
                                            imgUrl={user.avatar_url || undefined}
                                            className="layout-header__user-avatar"
                                        />
                                        <Text variant="body-1" className="layout-header__user-name">
                                            {userDisplayName}
                                        </Text>
                                    </Button>
                                )}
                            />
                        ) : (
                            <Button
                                view="outlined"
                                size="l"
                                onClick={() => navigate('/login')}
                            >
                                Log in
                            </Button>
                        )}
                    </div>
                </div>
            </header>
            <main className="layout-main">
                <div className="layout-main__center">
                    {isPageLoading ? (
                        <div className="layout__page-loading">
                            <Spin size="l" />
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </main>
            <footer className="layout-footer">
                <div className="layout-footer__inner">
                    <Text variant="body-2" color="secondary">
                        © 2026 Interactive Classroom Platform. All rights reserved.
                    </Text>
                    <div className="layout-footer__links">
                            <Button view="flat" size="s" onClick={() => navigate('/terms')}>
                            <Text variant="body-2" color="secondary">
                                Terms
                            </Text>
                        </Button>
                            <Button view="flat" size="s" onClick={() => navigate('/privacy')}>
                            <Text variant="body-2" color="secondary">
                                Privacy
                            </Text>
                        </Button>
                            <Button view="flat" size="s" onClick={() => navigate('/support')}>
                            <Text variant="body-2" color="secondary">
                                Support
                            </Text>
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
