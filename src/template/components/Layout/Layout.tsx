import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Avatar,
  Button,
  DropdownMenu,
  Icon,
  Text,
  Spin,
  Skeleton,
} from '@gravity-ui/uikit';
import {
  Sun,
  Moon,
  Gear,
  Person,
  ArrowRightFromSquare,
  GraduationCap,
} from '@gravity-ui/icons';
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
  const cleanPath = location.pathname.replace(/^\/template/, '');
  const isAuthRoute = cleanPath.startsWith('/login') || cleanPath.startsWith('/register');

  useEffect(() => {
    // Simulate page load for 0.2 seconds on every route change
    setIsPageLoading(true);
    const timer = window.setTimeout(() => {
      setIsPageLoading(false);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const getPageTitle = (): string => {
    const path = location.pathname;
    // Remove /template prefix for path matching
    const cleanPath = path.replace(/^\/template/, '');
    if (cleanPath.startsWith('/login')) return 'Login';
    if (cleanPath.startsWith('/register')) return 'Register';
    if (cleanPath.startsWith('/profile')) return 'Profile';
    if (cleanPath.startsWith('/settings')) return 'Settings';
    if (cleanPath.startsWith('/workspace/create')) return 'Create Workspace';
    if (cleanPath.includes('/session/') && cleanPath.includes('/presentation')) return 'Presentation';
    if (cleanPath.includes('/session/')) return 'Session';
    if (cleanPath.startsWith('/workspace/')) return 'Workspace';
    if (cleanPath.startsWith('/dashboard')) return 'Dashboard';
    return 'Dashboard';
  };

  const userMenuItems = [
    [
      {
        text: 'john.doe@example.com',
        action: () => {},
        disabled: true,
      },
      {
        text: 'Profile',
        iconStart: <Icon data={Person} size={16} />,
        action: () => navigate('/template/profile'),
      },
      {
        text: 'Settings',
        iconStart: <Icon data={Gear} size={16} />,
        action: () => navigate('/template/settings'),
      },
      {
        text: 'Log out',
        iconStart: <Icon data={ArrowRightFromSquare} size={16} />,
        theme: 'danger' as const,
        action: () => {
          // TODO: replace with real auth/logout
        },
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
              onClick={() => navigate(isAuthRoute ? '/template/login' : '/template/dashboard')}
              className="layout-header__logo"
            >
              <Icon data={GraduationCap} size={22} className="layout-header__logo-icon" />
              <div className="layout-header__logo-text">
                <Text variant="subheader-3" className="layout-header__logo-title">
                  Interactive Classroom Platform
                </Text>
                {!isAuthRoute && (
                  <Text variant="body-1" color="secondary" className="layout-header__logo-sub">
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
              title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              <Icon data={theme === 'light' ? Moon : Sun} size={24} />
            </Button>
            {isAuthRoute ? null : isPageLoading ? (
              <div className="layout-header__user-skeleton">
                <Skeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <Skeleton style={{ width: 80, height: 16, borderRadius: 4 }} />
              </div>
            ) : (
            <DropdownMenu
              items={userMenuItems}
              switcherWrapperClassName="layout-header__user-wrap"
                popupProps={{ placement: 'bottom-end' }}
              renderSwitcher={(props) => (
                  <Button {...props} view="flat" size="l" className="layout-header__user">
                    <Avatar
                      size="m"
                      text="JD"
                      theme="brand"
                      className="layout-header__user-avatar"
                    />
                    <Text variant="body-1" className="layout-header__user-name">
                    John Doe
                  </Text>
                </Button>
              )}
            />
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
            <Button
              view="flat"
              size="s"
              onClick={() => navigate('/template/terms')}
            >
              <Text variant="body-2" color="secondary">Terms</Text>
            </Button>
            <Button
              view="flat"
              size="s"
              onClick={() => navigate('/template/privacy')}
            >
              <Text variant="body-2" color="secondary">Privacy</Text>
            </Button>
            <Button
              view="flat"
              size="s"
              onClick={() => navigate('/template/support')}
            >
              <Text variant="body-2" color="secondary">Support</Text>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
