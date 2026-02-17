import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type {AxiosInstance} from 'axios';
import {Dispatch, SetStateAction} from 'react';
import {useApi} from '@/hooks/useApi';

const isNotFound = (error: unknown) => {
    const status = (error as {response?: {status?: number}})?.response?.status;
    return status === 404;
};

export type Workspace = {
    id: number;
    user_id: number;
    name: string;
    description: string;
    status: 'active' | 'archive' | string;
    is_deleted?: boolean;
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
    apiClient: AxiosInstance,
    status?: 'active' | 'archive' | 'null',
    includeDeleted?: boolean,
): Promise<WorkspacesResponse> => {
    const res = await apiClient.get<WorkspacesResponse>('/workspaces', {
        params: {
            status: status === 'null' ? null : status,
            include_deleted: includeDeleted,
        },
    });
    return res.data;
};

export const useWorkspaces = (status?: 'active' | 'archive' | 'null', includeDeleted = false) => {
    const apiClient = useApi();

    return useQuery({
        queryKey: ['workspaces', {status, includeDeleted}],
        queryFn: () => fetchWorkspaces(apiClient, status, includeDeleted),
    });
};

const fetchWorkspace = async (apiClient: AxiosInstance, id: number): Promise<Workspace> => {
    const res = await apiClient.get<Workspace>(`/workspaces/${id}`);
    return res.data;
};

export const useWorkspace = (id: number) => {
    const apiClient = useApi();

    return useQuery({
        queryKey: ['workspace', {id}],
        queryFn: () => fetchWorkspace(apiClient, id),
        enabled: Number.isFinite(id),
        retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
    });
};

type CreateWorkspaceDto = {
    name: string;
    description?: string;
    session_settings?: Record<string, unknown>;
};

export const useCreateWorkspace = (
    setOpen: Dispatch<SetStateAction<boolean>>,
    setName: React.Dispatch<React.SetStateAction<string>>,
    setDescription: React.Dispatch<React.SetStateAction<string>>,
) => {
    const queryClient = useQueryClient();
    const apiClient = useApi();

    return useMutation({
        mutationFn: async (payload: CreateWorkspaceDto): Promise<Workspace> => {
            const res = await apiClient.post<Workspace>('/workspaces', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['workspaces']});
            setOpen(false);
            setName('');
            setDescription('');
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
    apiClient: AxiosInstance,
    workspaceId: number,
    status?: 'active' | 'archive',
    includeDeleted = false,
    fields?: string,
): Promise<SessionsResponse> => {
    const res = await apiClient.get<SessionsResponse>(`/workspaces/${workspaceId}/sessions`, {
        params: {
            status,
            include_deleted: includeDeleted,
            fields,
        },
    });
    return res.data;
};

// hook
export const useSessions = (
    workspaceId: number,
    status?: 'active' | 'archive',
    includeDeleted = false,
    fields?: string,
    enabled = true,
) => {
    const apiClient = useApi();

    return useQuery({
        queryKey: ['sessions', {workspaceId, status, includeDeleted, fields}],
        queryFn: () => fetchSessions(apiClient, workspaceId, status, includeDeleted, fields),
        enabled: Boolean(workspaceId) && enabled,
    });
};

export type CreateSessionDto = {
    name: string;
    description?: string;
};

const createSession = async (
    apiClient: AxiosInstance,
    workspaceId: number,
    payload: CreateSessionDto,
    fields?: string,
): Promise<Session> => {
    const res = await apiClient.post<Session>(`/workspaces/${workspaceId}/sessions`, payload, {
        params: {fields},
    });
    return res.data;
};

export const useCreateSession = (workspaceId: number) => {
    const queryClient = useQueryClient();
    const apiClient = useApi();

    return useMutation({
        mutationFn: (payload: CreateSessionDto) => createSession(apiClient, workspaceId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['sessions', {workspaceId}],
            });
        },
    });
};

export const useArchiveSession = (workspaceId: number) => {
    const queryClient = useQueryClient();
    const apiClient = useApi();

    return useMutation({
        mutationFn: (sessionId: number) => apiClient.post(`/sessions/${sessionId}/archive`),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['sessions', {workspaceId}]});
        },
    });
};

export const useUnarchiveSession = (workspaceId: number) => {
    const queryClient = useQueryClient();
    const apiClient = useApi();

    return useMutation({
        mutationFn: (sessionId: number) => apiClient.post(`/sessions/${sessionId}/unarchive`),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['sessions', {workspaceId}]});
        },
    });
};

export const useDeleteSession = (workspaceId: number) => {
    const queryClient = useQueryClient();
    const apiClient = useApi();

    return useMutation({
        mutationFn: (sessionId: number) => apiClient.delete(`/sessions/${sessionId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['sessions', {workspaceId}]});
        },
    });
};
