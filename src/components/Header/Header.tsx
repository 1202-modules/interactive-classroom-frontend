import React from 'react';
import styles from './Header.module.css';
import { Avatar, Button, Text as GText, Icon, Theme, User, useThemeValue } from '@gravity-ui/uikit';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { DARK, LIGHT } from '@/constants';
import { Link } from 'react-router-dom';
import { Moon, Sun } from '@gravity-ui/icons';

export type AppProps = {
    setTheme: (theme: Theme) => void;
};

const Header: React.FC<AppProps> = ({ setTheme }) => {
    const theme = useThemeValue();
    const { data, loading, error } = useUser();
    const { accessToken } = useAuth();
    const isDark = theme === DARK;
    return (
        <div className={styles.header}>
            <div className={styles.leftside}>
                <Avatar text="1202" imgUrl='https://1202.tatardev.tech/logo.png' theme="brand" size="xl" className={styles.avatar} />
            </div>
            <div className={styles.center}>
                <GText variant="header-1">Super Burmyash</GText>
            </div>
            <div className={styles.rightside}>
                {loading ? (
                    'loading...'
                ) : !accessToken || error || !data ? (
                    <Link to="/auth/login">Log in</Link>
                ) : (
                    <Link to='/profile'>
                        <User
                            avatar={{
                                text: `${data.first_name} ${data.last_name}`,
                                imgUrl: data.avatar_url,
                                theme: 'brand',
                            }}
                            name={
                                data.first_name && data.last_name
                                    ? `${data.first_name} ${data.last_name}`
                                    : ''
                            }
                            description={data.email}
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
