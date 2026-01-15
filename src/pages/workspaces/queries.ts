import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/api';
import { Dispatch, SetStateAction } from 'react';

export type Workspace = {
    id: number;
    user_id: number;
    name: string;
    description: string;
    status: 'active' | 'archive' | string;
    session_settings: Record<string, unknown>;
    session_count: number;
    participant_count: number;
    last_session_at: string | null;
    created_at: string;
    updated_at: string;
};

type WorkspacesResponse = {
    workspaces: Workspace[];
    total: number;
};

const fetchWorkspaces = async (
    status?: 'active' | 'archive' | 'null',
    includeDeleted?: boolean,
): Promise<WorkspacesResponse> => {
    const res = await api.get<WorkspacesResponse>('/workspaces', {
        params: {
            status: status === 'null' ? null : status,
            include_deleted: includeDeleted,
        },
    });
    return res.data;
};

export const useWorkspaces = (
    status?: 'active' | 'archive' | 'null',
    includeDeleted = false,
) =>
    useQuery({
        queryKey: ['workspaces', { status, includeDeleted }],
        queryFn: () => fetchWorkspaces(status, includeDeleted),
    });

type CreateWorkspaceDto = {
    name: string;
    description?: string;
    session_settings?: Record<string, unknown>;
};

export const useCreateWorkspace = (setOpen: Dispatch<SetStateAction<boolean>>, setName: React.Dispatch<React.SetStateAction<string>>, setDescription: React.Dispatch<React.SetStateAction<string>> ) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateWorkspaceDto): Promise<Workspace> => {
            const res = await api.post<Workspace>('/workspaces', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            setOpen(false);
            setName('');
            setDescription('')
        },
    });
};