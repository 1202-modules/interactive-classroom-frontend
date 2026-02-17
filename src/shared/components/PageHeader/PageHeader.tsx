import type { ReactNode } from 'react';
import { Button, Icon, Text } from '@gravity-ui/uikit';
import { ArrowLeft } from '@gravity-ui/icons';
import './PageHeader.css';

export interface PageHeaderBack {
    label: string;
    onClick: () => void;
}

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    back?: PageHeaderBack;
    actions?: ReactNode;
    meta?: ReactNode;
    className?: string;
}

export function PageHeader({ title, subtitle, back, actions, meta, className }: PageHeaderProps) {
    return (
        <div className={className ? `page-header ${className}` : 'page-header'}>
            <div className="page-header__main">
                {back && (
                    <Button
                        view="flat"
                        size="l"
                        onClick={back.onClick}
                        className="page-header__back"
                    >
                        <Icon data={ArrowLeft} size={16} />
                        {back.label}
                    </Button>
                )}
                <div className="page-header__title-wrap">
                    <Text variant="display-2" as="h1" className="page-header__title">
                        {title}
                    </Text>
                    {subtitle !== undefined && subtitle !== '' && (
                        <Text variant="body-2" color="secondary" className="page-header__subtitle">
                            {subtitle}
                        </Text>
                    )}
                </div>
            </div>
            {(meta != null || actions != null) && (
                <div className="page-header__right">
                    {meta}
                    {actions}
                </div>
            )}
        </div>
    );
}
