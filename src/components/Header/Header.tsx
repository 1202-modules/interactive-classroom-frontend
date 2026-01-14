import React from 'react'
import styles from './Header.module.css'
import { Button, Icon, Text, Theme, User, useThemeValue } from '@gravity-ui/uikit';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { DARK, LIGHT } from '@/constants';
import { Link } from 'react-router-dom';
import { Moon, Sun } from '@gravity-ui/icons';

export type AppProps = {
    setTheme: (theme: Theme) => void;
};

const Header: React.FC<AppProps> =  ({ setTheme }) => {
    const theme = useThemeValue();
    const { data, loading, error } = useUser();
    const { accessToken } = useAuth();
    const isDark = theme === DARK;
    return (
        <div className={styles.header}>
            <div className={styles.leftside}>

            </div>
            <div className={styles.center}>
                <Text variant='header-1'>Super Burmyash</Text>
            </div>
            <div className={styles.rightside}>
                {loading ? (
                    'loading...'
                ) : !accessToken || error || !data ? (
                    <Link to="/auth/login">Log in</Link>
                ) : (
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
    )
}

export default Header