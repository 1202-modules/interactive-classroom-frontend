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


const fetchWorkspace = async (id: number): Promise<Workspace> => {
    const res = await api.get<Workspace>(`/workspaces/${id}`);
    return res.data;
}

export const useWorkspace = (id: number) =>
    useQuery({
        queryKey: ['workspace', { id }],
        queryFn: () => fetchWorkspace(id),
    });


type CreateWorkspaceDto = {
    name: string;
    description?: string;
    session_settings?: Record<string, unknown>;
};

export const useCreateWorkspace = (setOpen: Dispatch<SetStateAction<boolean>>, setName: React.Dispatch<React.SetStateAction<string>>, setDescription: React.Dispatch<React.SetStateAction<string>>) => {
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

export type Session = {
    id: number;
    workspace_id: number;
    name: string;
    description: string | null;
    stopped_participant_count: number;
    start_datetime: string | null;
    end_datetime: string | null;
    is_stopped: boolean;
    status: 'active' | 'archive' | string;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
};

type SessionsResponse = {
    sessions: Session[];
    total: number;
};

// api
const fetchSessions = async (
    workspaceId: number,
    status?: 'active' | 'archive',
    includeDeleted = false,
    fields?: string,
): Promise<SessionsResponse> => {
    const res = await api.get<SessionsResponse>(
        `/workspaces/${workspaceId}/sessions`,
        {
            params: {
                status,
                include_deleted: includeDeleted,
                fields,
            },
        },
    );
    return res.data;
};

// hook
export const useSessions = (
    workspaceId: number,
    status?: 'active' | 'archive',
    includeDeleted = false,
    fields?: string,
) =>
    useQuery({
        queryKey: ['sessions', { workspaceId, status, includeDeleted, fields }],
        queryFn: () => fetchSessions(workspaceId, status, includeDeleted, fields),
        enabled: !!workspaceId,
    });

export type CreateSessionDto = {
    name: string;
    description?: string;
};

const createSession = async (
    workspaceId: number,
    payload: CreateSessionDto,
    fields?: string,
): Promise<Session> => {
    const res = await api.post<Session>(
        `/workspaces/${workspaceId}/sessions`,
        payload,
        { params: { fields } },
    );
    return res.data;
};

export const useCreateSession = (workspaceId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateSessionDto) =>
            createSession(workspaceId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['sessions', { workspaceId }],
            });
        },
    });
};