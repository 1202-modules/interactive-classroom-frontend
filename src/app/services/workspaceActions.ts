import { api } from '@/api/api';
import type { Workspace } from '../types/workspace';

/**
 * WorkspaceActions - Business logic for workspace actions hooked to real API endpoints
 */
export class WorkspaceActions {
    /** Archive workspace: POST /workspaces/{id}/archive */
    async moveToArchive(workspaceId: number, fields?: string) {
        const res = await api.post<Workspace>(`/workspaces/${workspaceId}/archive`, undefined, {
            params: { fields },
        });
        return res.data;
    }

    /** Soft delete (move to trash): DELETE /workspaces/{id} */
    async moveToTrash(workspaceId: number) {
        await api.delete(`/workspaces/${workspaceId}`);
    }

    /** Restore from archive (unarchive): POST /workspaces/{id}/unarchive */
    async restoreFromArchive(workspaceId: number, fields?: string) {
        const res = await api.post<Workspace>(`/workspaces/${workspaceId}/unarchive`, undefined, {
            params: { fields },
        });
        return res.data;
    }

    /** Restore workspace from trash (stub) */
    async restoreFromTrash(workspaceId: number, fields?: string) {
        const res = await api.post<Workspace>(`/workspaces/${workspaceId}/restore`, undefined, {
            params: { fields },
        });
        return res.data;
    }

    /** Permanently delete workspace (stub) */
    async deletePermanently(workspaceId: number) {
        await api.delete(`/workspaces/${workspaceId}/permanent`);
    }
}

export const workspaceActions = new WorkspaceActions();
