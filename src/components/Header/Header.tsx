import React from 'react';
import styles from './Header.module.css';
import {Avatar, Button, Text as GText, Icon, Theme, User, useThemeValue} from '@gravity-ui/uikit';
import {useUser} from '@/hooks/useUser';
import {useAuth} from '@/hooks/useAuth';
import {DARK, LIGHT} from '@/constants';
import {Link} from 'react-router-dom';
import {Moon, Sun} from '@gravity-ui/icons';

export type AppProps = {
    setTheme: (theme: Theme) => void;
};

const Header: React.FC<AppProps> = ({setTheme}) => {
    const theme = useThemeValue();
    const {data, loading} = useUser();
    const {accessToken} = useAuth();
    const isAuthenticated = Boolean(accessToken);
    const isDark = theme === DARK;
    return (
        <div className={styles.header}>
            <div className={styles.leftside}>
                <Avatar
                    text="1202"
                    imgUrl="https://1202.tatardev.tech/logo.png"
                    theme="brand"
                    size="xl"
                    className={styles.avatar}
                />
            </div>
            <div className={styles.center}>
                <GText variant="header-1">Super Burmyash</GText>
            </div>
            <div className={styles.rightside}>
                {!isAuthenticated ? (
                    <Link style={{color: 'var(--g-color-text-primary)'}} to="/auth/login">
                        Log in
                    </Link>
                ) : loading ? (
                    'loading...'
                ) : (
                    <Link
                        to="/profile"
                        style={{textDecoration: 'none', color: 'var(--g-color-text-primary)'}}
                    >
                        <User
                            avatar={{
                                text: `${data?.first_name || ''} ${data?.last_name || ''}`.trim(),
                                imgUrl: data?.avatar_url,
                                backgroundColor: 'var(--g-color-text-misc-heavy)',
                                color: 'var(--g-color-text-primary)',
                            }}
                            name={
                                data?.first_name && data?.last_name
                                    ? `${data.first_name} ${data.last_name}`
                                    : data?.email || ''
                            }
                            description={data?.email || ''}
                            size="l"
                        />
                    </Link>
                )}
                <div className={styles.themeButton}>
                    <Button
                        size="l"
                        view="outlined"
                        onClick={() => {
                            setTheme(isDark ? LIGHT : DARK);
                        }}
                    >
                        <Icon data={isDark ? Sun : Moon} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Header;
