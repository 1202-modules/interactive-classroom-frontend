import { Alert, Button, Dialog, Divider, Text, TextInput } from '@gravity-ui/uikit';

interface CreateSessionDialogProps {
    open: boolean;
    onClose: () => void;
    name: string;
    error: string | null;
    isLoading: boolean;
    onNameChange: (name: string) => void;
    onSubmit: () => void;
    nameInputId: string;
    sessionSettingsSection: React.ReactNode;
}

export function CreateSessionDialog({
    open,
    onClose,
    name,
    error,
    isLoading,
    onNameChange,
    onSubmit,
    nameInputId,
    sessionSettingsSection,
}: CreateSessionDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            size="m"
            className="create-session-dialog"
        >
            <Dialog.Header caption="Create session" />
            <Dialog.Body>
                {error && (
                    <Alert theme="danger" title="Could not create session" message={error} />
                )}
                <div className="workspace-page__module-form">
                    <div className="workspace-page__module-form-field">
                        <Text variant="body-1" className="workspace-page__settings-label">
                            Name
                        </Text>
                        <TextInput
                            id={nameInputId}
                            value={name}
                            onUpdate={onNameChange}
                            size="l"
                            placeholder="Session name"
                        />
                    </div>
                    {sessionSettingsSection && (
                        <>
                            <Divider />
                            <div className="workspace-page__module-form-field">
                                <Text variant="subheader-2" className="workspace-page__settings-label">
                                    Session settings
                                </Text>
                            </div>
                            {sessionSettingsSection}
                        </>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <Button view="flat" onClick={onClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button
                    view="action"
                    onClick={onSubmit}
                    loading={isLoading}
                    disabled={name.trim().length === 0}
                >
                    Create session
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
}
