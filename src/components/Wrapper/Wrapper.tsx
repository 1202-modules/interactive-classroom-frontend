import React from 'react';
import block from 'bem-cn-lite';
import { Button, Icon, Text, Theme, User, useThemeValue } from '@gravity-ui/uikit';
import { Moon, Sun } from '@gravity-ui/icons';
import { DARK, LIGHT } from '../../constants';
import styles from './Wrapper.module.css'

export type AppProps = {
    children: React.ReactNode;
    setTheme: (theme: Theme) => void;
};

export const Wrapper: React.FC<AppProps> = ({ children, setTheme }) => {
    const theme = useThemeValue();
    const isDark = theme === DARK;
    return (
        <>
            <div className={styles.header}>
                <div className={styles.leftside}>

                </div>
                <div className={styles.center}>
                    <Text variant='header-1'>Super Burmyash</Text>
                </div>
                <div className={styles.rightside}>
                <User avatar={{text: 'Charles Darwin', theme: 'brand'}} name="Charles Darwin" description="charles@mail.ai" size="xl" />
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

            <div className={styles.layout}>
                <div className={styles.content}>{children}</div>
            </div>
        </>
    );
};
