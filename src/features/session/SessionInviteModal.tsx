import { useCallback, useRef, useState } from 'react';
import { Button, Dialog, Icon, Text } from '@gravity-ui/uikit';
import { Copy } from '@gravity-ui/icons';
import { QRCodeSVG } from 'qrcode.react';
import './SessionInviteModal.css';

interface SessionInviteModalProps {
    open: boolean;
    onClose: () => void;
    sessionName: string;
    passcode: string;
}

const INVITE_WIDTH = 340;
const INVITE_HEIGHT = 420;
const QR_SIZE = 200;

function svgToImageDataUrl(svg: SVGSVGElement): Promise<string> {
    return new Promise((resolve, reject) => {
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = svg.width.baseVal.value;
            c.height = svg.height.baseVal.value;
            const ctx = c.getContext('2d');
            if (ctx) ctx.drawImage(img, 0, 0);
            resolve(c.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
}

async function drawInviteToCanvas(
    canvas: HTMLCanvasElement,
    qrSvg: SVGSVGElement | null,
    sessionName: string,
    passcode: string,
): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = INVITE_WIDTH * dpr;
    canvas.height = INVITE_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const joinUrl = `${window.location.origin}/s/`;
    const PADDING = 24;
    let y = PADDING;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, INVITE_WIDTH, INVITE_HEIGHT);

    if (sessionName) {
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 18px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sessionName, INVITE_WIDTH / 2, y + 18);
        y += 36;
    }

    if (qrSvg) {
        try {
            const qrDataUrl = await svgToImageDataUrl(qrSvg);
            const img = await new Promise<HTMLImageElement>((res, rej) => {
                const i = new Image();
                i.onload = () => res(i);
                i.onerror = rej;
                i.src = qrDataUrl;
            });
            const qrPad = (INVITE_WIDTH - QR_SIZE) / 2;
            ctx.drawImage(img, qrPad, y, QR_SIZE, QR_SIZE);
        } catch {
            /* skip QR */
        }
        y += QR_SIZE + 20;
    }

    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillText(`Join at: ${joinUrl}`, INVITE_WIDTH / 2, y + 14);
    y += 28;

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(passcode || '—', INVITE_WIDTH / 2, y + 24);
    y += 40;

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText('Scan QR code or enter passcode to join', INVITE_WIDTH / 2, y + 12);
}

export function SessionInviteModal({ open, onClose, sessionName, passcode }: SessionInviteModalProps) {
    const qrRef = useRef<HTMLDivElement>(null);
    const [copyFeedback, setCopyFeedback] = useState<'image' | 'link' | null>(null);

    const inviteUrl = passcode ? `${window.location.origin}/s/${passcode}` : '';

    const showFeedback = useCallback((type: 'image' | 'link') => {
        setCopyFeedback(type);
        setTimeout(() => setCopyFeedback(null), 2000);
    }, []);

    const handleCopyImage = useCallback(async () => {
        const qrSvg = qrRef.current?.querySelector('svg') as SVGSVGElement | null;
        const canvas = document.createElement('canvas');

        await drawInviteToCanvas(canvas, qrSvg, sessionName, passcode);

        try {
            const blob = await new Promise<Blob | null>((res) =>
                canvas.toBlob(res, 'image/png'),
            );
            if (blob) {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob }),
                ]);
                showFeedback('image');
            }
        } catch {
            showFeedback('image');
        }
    }, [sessionName, passcode, showFeedback]);

    const handleCopyLink = useCallback(async () => {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            showFeedback('link');
        } catch {
            showFeedback('link');
        }
    }, [inviteUrl, showFeedback]);

    return (
        <Dialog open={open} onClose={onClose} hasCloseButton>
            <Dialog.Header caption="Invite participants" />
            <Dialog.Body>
                <div className="session-invite-modal">
                    <div className="session-invite-modal__preview-wrap">
                        <div
                            className="session-invite-modal__preview"
                            style={{ width: INVITE_WIDTH, minHeight: INVITE_HEIGHT }}
                        >
                            {sessionName && (
                                <Text variant="header-2" className="session-invite-modal__title">
                                    {sessionName}
                                </Text>
                            )}
                            <div ref={qrRef} className="session-invite-modal__qr">
                                {inviteUrl ? (
                                    <QRCodeSVG value={inviteUrl} size={QR_SIZE} level="M" />
                                ) : null}
                            </div>
                            <Text variant="body-1" color="secondary" className="session-invite-modal__join">
                                Join at: {window.location.origin}/s/
                            </Text>
                            <Text variant="display-2" className="session-invite-modal__passcode">
                                {passcode || '—'}
                            </Text>
                            <Text variant="caption-1" color="secondary">
                                Scan QR code or enter passcode to join
                            </Text>
                        </div>
                        <div className="session-invite-modal__overlay">
                            <div className="session-invite-modal__overlay-buttons">
                                <button
                                    type="button"
                                    className="session-invite-modal__overlay-btn"
                                    onClick={handleCopyImage}
                                    disabled={!inviteUrl}
                                    title="Copy image"
                                >
                                    <Icon data={Copy} size={20} />
                                    <span>
                                        {copyFeedback === 'image' ? 'Copied!' : 'Copy image'}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="session-invite-modal__overlay-btn"
                                    onClick={handleCopyLink}
                                    disabled={!inviteUrl}
                                    title="Copy link"
                                >
                                    <Icon data={Copy} size={20} />
                                    <span>
                                        {copyFeedback === 'link' ? 'Copied!' : 'Copy link'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog.Body>
        </Dialog>
    );
}
