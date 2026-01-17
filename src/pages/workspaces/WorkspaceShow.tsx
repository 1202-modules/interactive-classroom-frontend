import {
    Button,
    Icon,
    Loader,
    Tab,
    TabList,
    TabProvider,
    Text,
    TextInput,
    Dialog,
    TextArea,
    Label,
    DropdownMenu,
    Alert,
} from '@gravity-ui/uikit';
import styles from './WorkspaceShow.module.css';
import { useParams } from 'react-router-dom';
import NotFound from '@/components/NotFound/NotFound';
import { useWorkspace, useSessions, useCreateSession, useArchiveSession, useUnarchiveSession, useDeleteSession } from './queries';
import { useState } from 'react';
import { Persons, Plus } from '@gravity-ui/icons';
import { Link, useNavigate } from 'react-router-dom';

type SessionStatus = 'active' | 'archive' | 'trash';

const WorkspaceShow = () => {
    const { workspaceId } = useParams<string>();
    const wid = Number(workspaceId);
    const isValidId = Number.isFinite(wid) && wid > 0;

    const {
        data: dataWorkspace,
        isLoading: isWorkspaceLoading,
        isError: isWorkspaceError,
        error: workspaceError,
    } = useWorkspace(wid);

    const [activeTab, setActiveTab] = useState<SessionStatus>('active');
    const [search, setSearch] = useState('');

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const shouldLoadSessions =
        isValidId && !isWorkspaceLoading && !isWorkspaceError && !!dataWorkspace;

    const {
        data: sessionsData,
        isLoading: isSessionsLoading,
        isError: isSessionsError,
    } = useSessions(
        wid,
        activeTab === 'trash' ? undefined : activeTab,
        activeTab === 'trash',
        undefined,
        shouldLoadSessions,
    );

    const createSessionMutation = useCreateSession(isValidId ? wid : 0);
    const archiveSessionMutation = useArchiveSession(isValidId ? wid : 0);
    const unarchiveSessionMutation = useUnarchiveSession(isValidId ? wid : 0);
    const deleteSessionMutation = useDeleteSession(isValidId ? wid : 0);
    const isMutateError = createSessionMutation.isError;
    const [actionError, setActionError] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
    const navigate = useNavigate();

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
    };

    const handleOpenCreateDialog = () => {
        setName('');
        setDescription('');
        createSessionMutation.reset();
        setCreateDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        createSessionMutation.mutate(
            { name: name.trim(), description: description.trim() || undefined },
            {
                onSuccess: () => {
                    setCreateDialogOpen(false);
                    setName('');
                    setDescription('');
                    setActionError('');
                },
            },
        );
    };

    const handleArchiveSession = (sessionId: number) => {
        archiveSessionMutation.mutate(sessionId, {
            onError: () => setActionError('Failed to archive session'),
            onSuccess: () => setActionError(''),
        });
    };

    const handleUnarchiveSession = (sessionId: number) => {
        unarchiveSessionMutation.mutate(sessionId, {
            onError: () => setActionError('Failed to unarchive session'),
            onSuccess: () => setActionError(''),
        });
    };

    const handleDeleteClick = (sessionId: number) => {
        setActionError('');
        setSessionToDelete(sessionId);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSessionToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (sessionToDelete === null) return;

        deleteSessionMutation.mutate(sessionToDelete, {
            onError: (err: any) => {
                const message = err?.response?.data?.detail ?? 'Failed to delete session';
                setActionError(message);
            },
            onSuccess: () => {
                setActionError('');
                handleCloseDeleteDialog();
            },
        });
    };

    if (!isValidId) {
        return (
            <div className={styles.container}>
                <Text variant="body-2" color="danger">
                    Invalid workspace id
                </Text>
            </div>
        );
    }

    if (isWorkspaceLoading) {
        return <Loader className={styles.loader} />;
    }

    if (isWorkspaceError) {
        return (
            <NotFound
                title="Workspace Not Found"
                description="The workspace you're looking for doesn't exist or has been deleted."
                showBackButton
                showHomeButton
            />
        );
    }

    return (
        <div className={styles.container}>
            <Text variant="header-2">Workspace: {dataWorkspace?.name}</Text>
            <Text variant="body-2" style={{ marginTop: '10px' }}>
                Add a sessions to kickstart your events, meetings, workshops, etc with
                better engagement
            </Text>

            <div className={styles.sessionsTabs}>
                <TabProvider
                    value={activeTab}
                    onUpdate={(value) => setActiveTab(value as SessionStatus)}
                >
                    <TabList size="xl">
                        <Tab value="active">Active</Tab>
                        <Tab value="archive">Archive</Tab>
                        <Tab value="trash">Trash</Tab>
                    </TabList>
                </TabProvider>
            </div>

            <div className={styles.actionPanel}>
                <Button size="xl" view="action" onClick={handleOpenCreateDialog}>
                    <Icon data={Plus} /> Add new session
                </Button>

                <div>
                    <TextInput
                        size="xl"
                        placeholder="Search sessions"
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            <div className={styles.tableWrapper}>
                {isSessionsLoading ? (
                    <Loader className={styles.loader} />
                ) : isSessionsError ? (
                    <Text variant="body-2" color="danger">
                        Failed to load sessions
                    </Text>
                ) : (
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th className={styles.tableName}>Event name</th>
                                <th className={styles.tableStatus}>Status</th>
                                <th className={styles.tableDate}>Date</th>
                                <th className={styles.tableParticipants}>Participants</th>
                                <th className={styles.tableUpdate} colSpan={2}>Last Edited</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sessionsData?.sessions || [])
                                .filter((s) =>
                                    activeTab === 'trash'
                                        ? s.status === 'trash' || s.status === 'deleted'
                                        : true,
                                )
                                .map((s) => {
                                    const isDeleted = s.status === 'trash' || s.status === 'deleted';
                                    return (
                                        <tr className={styles.sessionsTr} key={s.id}>
                                            <td className={styles.tableName}>
                                                <div className={styles.sessionNameBlock}>
                                                    <Text color='secondary'>{s.id}</Text>
                                                    <Link to={`/sessions/${s.id}`} style={{ textDecoration: 'none' }}>
                                                        <Text variant='subheader-3'>{s.name}</Text>
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className={styles.tableStatus}>
                                                <Label theme={isDeleted ? 'danger' : s.status === 'active' ? 'success' : 'normal'}>
                                                    {isDeleted ? 'Deleted' : s.status}
                                                </Label>
                                            </td>
                                            <td className={styles.tableDate}>
                                                {s.start_datetime} - {s.end_datetime}
                                            </td>
                                            <td className={styles.tableParticipants}>
                                                <div className={styles.tableParticipantsBlock}>
                                                    <Icon data={Persons} />{s.stopped_participant_count}
                                                </div>
                                            </td>
                                            <td className={styles.tableUpdate}>
                                                {formatUpdatedAgo(s.updated_at)}
                                            </td>
                                            <td className={styles.tableActions}>
                                                <DropdownMenu items={[
                                                    {
                                                        action: () => navigate(`/sessions/${s.id}/edit`),
                                                        text: 'Edit',
                                                    },
                                                    {
                                                        action: () => s.status === 'active'
                                                            ? handleArchiveSession(s.id)
                                                            : handleUnarchiveSession(s.id),
                                                        text: s.status === 'active' ? 'Archive' : 'Unarchive',
                                                    },
                                                    {
                                                        action: () => handleDeleteClick(s.id),
                                                        text: 'Delete',
                                                        theme: 'danger',
                                                    },
                                                ]} />
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                )}
            </div>

            <Dialog
                onClose={() => setCreateDialogOpen(false)}
                open={createDialogOpen}
                onEscapeKeyDown={() => setCreateDialogOpen(false)}
                disableOutsideClick={true}
                disableBodyScrollLock={true}
            >
                <Dialog.Body className={styles.dialogBody}>
                    <Text variant="subheader-3">Name of Session *</Text>
                    <div className={styles.searchInput}>
                        <TextInput
                            size="l"
                            validationState={isMutateError ? 'invalid' : undefined}
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setName(e.target.value)
                            }
                        />
                    </div>
                    <Text variant="subheader-3">Session description</Text>
                    <TextArea
                        minRows={3}
                        maxRows={7}
                        validationState={isMutateError ? 'invalid' : undefined}
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setDescription(e.target.value)
                        }
                    />
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={() => setCreateDialogOpen(false)}
                    onClickButtonApply={handleSubmit}
                    textButtonApply={
                        createSessionMutation.isPending ? 'Creating…' : 'Add'
                    }
                    textButtonCancel="Cancel"
                />
            </Dialog>
            <Dialog
                onClose={handleCloseDeleteDialog}
                open={deleteDialogOpen}
                onEscapeKeyDown={handleCloseDeleteDialog}
                disableOutsideClick={true}
                hasCloseButton={false}
            >
                <Dialog.Body className={styles.dialogBody}>
                    <Text variant="subheader-3">Do you want to delete this session?</Text>
                    {actionError && (
                        <Alert
                            theme="danger"
                            title="Error"
                            message={actionError}
                            style={{ marginTop: '10px' }}
                        />
                    )}
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={handleCloseDeleteDialog}
                    onClickButtonApply={handleConfirmDelete}
                    textButtonApply={deleteSessionMutation.isPending ? 'Deleting…' : 'Delete'}
                    textButtonCancel="Cancel"
                />
            </Dialog>
        </div>
    );
};

function formatUpdatedAgo(updatedAt: string) {
    const updated = new Date(updatedAt);
    const diffMs = Date.now() - updated.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
}

export default WorkspaceShow;
