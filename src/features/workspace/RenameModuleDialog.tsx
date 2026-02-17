import { Button, Dialog, Text, TextInput } from '@gravity-ui/uikit';

interface RenameModuleDialogProps {
    open: boolean;
    onClose: () => void;
    value: string;
    onValueChange: (value: string) => void;
    onConfirm: () => void;
}

export function RenameModuleDialog({
    open,
    onClose,
    value,
    onValueChange,
    onConfirm,
}: RenameModuleDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            size="s"
            className="workspace-page__module-rename-dialog"
        >
            <Dialog.Header caption="Rename module" />
            <Dialog.Body>
                <div className="workspace-page__module-form">
                    <div className="workspace-page__module-form-field">
                        <Text variant="body-1" className="workspace-page__settings-label">
                            New name
                        </Text>
                        <TextInput
                            value={value}
                            onUpdate={onValueChange}
                            size="l"
                            placeholder="Module name"
                        />
                    </div>
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <Button view="flat" onClick={onClose}>
                    Cancel
                </Button>
                <Button view="action" onClick={onConfirm}>
                    Rename
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
}
