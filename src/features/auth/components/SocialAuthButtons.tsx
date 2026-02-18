import { useState } from 'react';
import { Text, Tooltip } from '@gravity-ui/uikit';
import './SocialAuthButtons.css';

const WIP_TOOLTIP = 'WIP (Work In Progress)';
const TOOLTIP_SHOW_MS = 2000;

const PROVIDERS = [
    { id: 'google', src: '/auth-logos/google.svg', alt: 'Google' },
    { id: 'yandex', src: '/auth-logos/yandex.svg', alt: 'Yandex' },
    { id: 'github', src: '/auth-logos/github.svg', alt: 'GitHub' },
    { id: 'microsoft', src: '/auth-logos/microsoft.svg', alt: 'Microsoft' },
] as const;

export function SocialAuthButtons() {
    const [openId, setOpenId] = useState<string | null>(null);

    const handleClick = (id: string) => {
        setOpenId(id);
        window.setTimeout(() => setOpenId(null), TOOLTIP_SHOW_MS);
    };

    return (
        <div className="auth-social-buttons">
            <Text variant="body-2" color="secondary" className="auth-social-buttons__label">
                Log in with
            </Text>
            <div className="auth-social-buttons__row">
                {PROVIDERS.map(({ id, src, alt }) => (
                    <Tooltip
                        key={id}
                        content={WIP_TOOLTIP}
                        open={openId === id}
                        onOpenChange={(open: boolean) => !open && setOpenId(null)}
                    >
                        <button
                            type="button"
                            className="auth-social-buttons__btn"
                            aria-label={`${alt} (${WIP_TOOLTIP})`}
                            onClick={() => handleClick(id)}
                        >
                            <img src={src} alt={alt} width={24} height={24} />
                        </button>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}
