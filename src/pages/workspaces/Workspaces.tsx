import { Button, Dialog, Divider, DropdownMenu, Icon, Label, Loader, Select, text, Text, TextArea, TextInput } from "@gravity-ui/uikit";
import styles from "./Workspaces.module.css"
import { useCreateWorkspace, useWorkspaces, Workspace } from "./queries";
import { ChangeEvent, useEffect, useState } from "react";
import { FileLetterX, Plus } from '@gravity-ui/icons';
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api/api";
import { useQueryClient } from "@tanstack/react-query";

type WorkspaceStatus = 'active' | 'archive' | 'null';

const Workspaces = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<WorkspaceStatus[]>(['null']);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filteredData, setFilteredData] = useState<Workspace[] | undefined>([]);
    const [open, setOpen] = useState<boolean>(false);
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
    const [archiveOpen, setArchiveOpen] = useState<boolean>(false);

    const [archiveId, setArchiveId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useWorkspaces(status[0]);

    useEffect(() => {
        if (!data) {
            setFilteredData([]);
            return;
        }

        const normalized = searchQuery.toLowerCase();
        const base = data.workspaces;

        setFilteredData(
            normalized
                ? base.filter((w) => w.name.toLowerCase().includes(normalized))
                : base,
        );
    }, [data, searchQuery]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { mutate, isPending, isError: isMutateError, error: mutateError } = useCreateWorkspace(setOpen, setName, setDescription);

    const handleSubmit = () => {
        if (!name.trim()) return;

        mutate({
            name: name.trim(),
            description: description.trim() || undefined,
            session_settings: {},
        });
    };

    const handleArchive = (id: number) => {
        setArchiveId(id);
        setArchiveOpen(true);
    }

    const archiveWorkspace = async () => {
        if (!archiveId) return;
        const res = await api.post(`/workspaces/${archiveId}/archive`);
        setArchiveOpen(false);
        setArchiveId(null);

        queryClient.invalidateQueries({queryKey: ['workspaces']});
        return res;
    }

    const handleUnarhive = async (id: number) => {
        if (!id) return;
        const res = await api.post(`/workspaces/${id}/unarchive`);

        queryClient.invalidateQueries({queryKey: ['workspaces']});
        return res;
    }

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setDeleteOpen(true);
    }

    const deleteWorkspace = async () => {
        if (!deleteId) return;
        const res = await api.delete(`/workspaces/${deleteId}`);

        setDeleteOpen(false);
        setDeleteId(null);

        queryClient.invalidateQueries({queryKey: ['workspaces']});
        return res;
    }


    return (
        <div className={styles.container}>
            <Text variant="header-2">My Workspaces</Text>
            <div className={styles.table}>
                <div className={styles.tableHeader}>
                    <Text variant="header-1">Workspaces overview</Text>
                </div>
                <div className={styles.tableBody}>
                    <Divider />
                    <div className={styles.actionPanel}>
                        <Select
                            value={status}
                            onUpdate={(next: string[]) => setStatus(next as WorkspaceStatus[])}
                            size="xl"
                        >
                            <Select.Option value="null">All</Select.Option>
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="archive">Archive</Select.Option>
                        </Select>
                        <div className={styles.searchInput}>
                            <TextInput placeholder="Search..."
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setSearchQuery(e.target.value)
                                }
                                size="xl" />
                        </div>
                        <Button view="action" size="xl" onClick={() => setOpen(true)}>Add new <Icon data={Plus} /></Button>
                    </div>
                    <div className={styles.workspaces}>
                        {isLoading ? <Loader className={styles.loader} /> :
                            filteredData?.length ?
                                filteredData.map((w, ind) =>
                                    <div key={w.id} className={styles.workspace}>
                                        <div className={styles.card}>
                                            <div className={styles.cardHeader}>
                                                <Link to={`/workspaces/${w.id}`}><Text variant="subheader-3">{w.name}</Text></Link>
                                                {w.status === "active" ? <Label theme="success">Active</Label> : <Label theme="unknown">{w.status}</Label>}
                                            </div>
                                            <div className={styles.cardBody}>
                                                {w.description}
                                            </div>
                                            <div className={styles.cardFooter}>
                                                <span>{w.participant_count} participitions</span>
                                                <DropdownMenu items={[
                                                    {
                                                        text: "Edit",
                                                        action: () => navigate(`/workspaces/${w.id}/edit`),
                                                    },
                                                    {
                                                        text: w.status === "active" ? "Archive" : "Unarhive",
                                                        action: w.status === "active" ? () => handleArchive(w.id) : () => handleUnarhive(w.id)
                                                    },
                                                    {
                                                        text: "Delete",
                                                        theme: "danger",
                                                        action: () => handleDelete(w.id)
                                                    },

                                                ]}></DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                )
                                :
                                <div className={styles.notFound}>
                                    <Icon data={FileLetterX} />
                                    <Text variant="subheader-1">There is no available Workspaces</Text>
                                </div>
                        }
                    </div>
                </div>
            </div>
            <Dialog
                onClose={() => setOpen(false)}
                open={open}
                onEscapeKeyDown={() => setOpen(false)}
                disableOutsideClick={true}
                disableBodyScrollLock={true}
            >
                <Dialog.Body className={styles.dialogBody}>
                    <Text variant="subheader-3">Name of Workspace *</Text>
                    <div className={styles.searchInput}>
                        <TextInput size="l" validationState={isMutateError ? 'invalid' : undefined} value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                    </div>
                    <Text variant="subheader-3">Workspace's description</Text>
                    <TextArea minRows={3} maxRows={7} validationState={isMutateError ? 'invalid' : undefined} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setDescription(e.target.value)
                    } />
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={() => setOpen(false)}
                    onClickButtonApply={() => handleSubmit()}
                    textButtonApply="Add"
                    textButtonCancel="Cancel"
                />
            </Dialog>
            <Dialog
                onClose={() => setArchiveOpen(false)}
                open={archiveOpen}
                onEscapeKeyDown={() => setArchiveOpen(false)}
                disableOutsideClick={true}
                hasCloseButton={false}
            >
                <Dialog.Body className={styles.dialogBody}>
                    <Text variant="subheader-3">Do you want to archive this workspace</Text>
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={() => {
                        setArchiveOpen(false)
                    }}
                    onClickButtonApply={async () => await archiveWorkspace()}
                    textButtonApply="Archive"
                    textButtonCancel="Cancel"
                    className={styles.archiveDialogFooter}
                />
            </Dialog>
            <Dialog
                onClose={() => setDeleteOpen(false)}
                open={deleteOpen}
                onEscapeKeyDown={() => setDeleteOpen(false)}
                disableOutsideClick={true}
                hasCloseButton={false}
            >
                <Dialog.Body className={styles.dialogBody}>
                    <Text variant="subheader-3">Do you want to archive this workspace</Text>
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={() => {
                        setDeleteOpen(false)
                    }}
                    onClickButtonApply={async () => await deleteWorkspace()}
                    textButtonApply="Delete"
                    textButtonCancel="Cancel"
                    className={styles.deleteDialogFooter}
                />
            </Dialog>
        </div>
    )
}

export default Workspaces;