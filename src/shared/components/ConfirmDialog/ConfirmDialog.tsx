import React from 'react';
import {Button, Dialog, Text} from '@gravity-ui/uikit';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    confirmButtonView?: React.ComponentProps<typeof Button>['view'];
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmText,
    cancelText,
    confirmButtonView = 'outlined-danger',
    onConfirm,
    onCancel,
}) => {
    return (
        <Dialog open={open} onClose={onCancel} size="s" className="confirm-dialog">
            <Dialog.Header caption={title} />
            <Dialog.Body>
                <Text variant="body-2">{message}</Text>
            </Dialog.Body>
            <Dialog.Footer>
                <Button view="flat" onClick={onCancel}>
                    {cancelText}
                </Button>
                <Button view={confirmButtonView} onClick={onConfirm}>
                    {confirmText}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};
