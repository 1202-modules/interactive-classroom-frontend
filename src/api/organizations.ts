import type { AxiosInstance } from 'axios';

export interface Organization {
    id: number;
    name: string;
    created_at?: string | null;
    updated_at?: string | null;
}

interface OrganizationsResponse {
    organizations: Organization[];
    total: number;
}

export async function getOrganizations(apiClient: AxiosInstance): Promise<Organization[]> {
    try {
        const res = await apiClient.get<OrganizationsResponse>('/organizations');
        return res.data?.organizations || [];
    } catch (err) {
        console.error('Failed to load organizations:', err);
        return [];
    }
}
