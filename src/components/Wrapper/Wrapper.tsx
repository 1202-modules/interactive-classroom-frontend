import React from 'react';
import block from 'bem-cn-lite';
import {Button, Icon, Text, Theme, User, useThemeValue} from '@gravity-ui/uikit';
import {Moon, Sun} from '@gravity-ui/icons';
import {DARK, LIGHT} from '../../constants';
import styles from './Wrapper.module.css';
import {useUser} from '@/hooks/useUser';
import {Link} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';
import Header from '../Header/Header';

export type AppProps = {
    children: React.ReactNode;
    setTheme: (theme: Theme) => void;
};

export const Wrapper: React.FC<AppProps> = ({children, setTheme}) => {
    return (
        <>
            <Header setTheme={setTheme}></Header>
            <div className={styles.layout}>
                <div className={styles.content}>{children}</div>
            </div>
        </>
    );
};
