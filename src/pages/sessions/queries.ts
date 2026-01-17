import { useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import type { Session } from '../workspaces/queries';

const fetchSession = async (apiClient: AxiosInstance, sessionId: number): Promise<Session> => {
    const res = await apiClient.get<Session>(`/sessions/${sessionId}`);
    return res.data;
};

export const useSession = (sessionId: number) => {
    const apiClient = useApi();

    return useQuery({
        queryKey: ['session', { sessionId }],
        queryFn: () => fetchSession(apiClient, sessionId),
        enabled: Number.isFinite(sessionId),
    });
};

type UpdateSessionDto = {
    name?: string;
    description?: string | null;
    settings?: Record<string, unknown>;
};

export const useUpdateSession = () => {
    const apiClient = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ sessionId, payload }: { sessionId: number; payload: UpdateSessionDto }) => {
            const res = await apiClient.put<Session>(`/sessions/${sessionId}`, payload);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['session', { sessionId: data.id }] });
            queryClient.invalidateQueries({ queryKey: ['sessions', { workspaceId: data.workspace_id }] });
        },
    });
};
