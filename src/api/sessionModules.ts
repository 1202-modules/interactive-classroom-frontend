import type {AxiosInstance} from 'axios';

import type {SessionModulesByPasscodeResponse} from '@/types/sessionModulesByPasscode';

export async function getModulesByPasscode(
    apiClient: AxiosInstance,
    passcode: string,
    authToken: string,
): Promise<SessionModulesByPasscodeResponse> {
    const res = await apiClient.get<SessionModulesByPasscodeResponse>(
        `/sessions/by-passcode/${passcode}/modules`,
        {
            headers: {Authorization: `Bearer ${authToken}`},
        },
    );
    return res.data;
}

