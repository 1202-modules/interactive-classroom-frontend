import React from 'react';
import {Theme} from '@gravity-ui/uikit';
import styles from './Wrapper.module.css';
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
