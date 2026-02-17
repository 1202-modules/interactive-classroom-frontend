import { Alert, Button, Dialog, Text, TextArea, TextInput } from '@gravity-ui/uikit';

interface CreateSessionDialogProps {
    open: boolean;
    onClose: () => void;
    name: string;
    description: string;
    error: string | null;
    isLoading: boolean;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onSubmit: () => void;
    nameInputId: string;
    descriptionInputId: string;
}

export function CreateSessionDialog({
    open,
    onClose,
    name,
    description,
    error,
    isLoading,
    onNameChange,
    onDescriptionChange,
    onSubmit,
    nameInputId,
    descriptionInputId,
}: CreateSessionDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            size="s"
            className="workspace-page__module-rename-dialog"
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
                    <div className="workspace-page__module-form-field">
                        <Text variant="body-1" className="workspace-page__settings-label">
                            Description
                        </Text>
                        <TextArea
                            id={descriptionInputId}
                            value={description}
                            onUpdate={onDescriptionChange}
                            size="l"
                            rows={4}
                            placeholder="Optional description"
                        />
                    </div>
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
