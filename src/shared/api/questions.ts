import type { AxiosInstance } from 'axios';

import type {
    CreateQuestionMessageRequest,
    QuestionMessagesResponse,
    QuestionMessageItem,
} from '@/shared/types/questions';

export async function getQuestionMessages(
    apiClient: AxiosInstance,
    passcode: string,
    moduleId: number,
    authToken: string,
    params?: { limit?: number; offset?: number },
): Promise<QuestionMessagesResponse> {
    const res = await apiClient.get<QuestionMessagesResponse>(
        `/sessions/by-passcode/${passcode}/modules/questions/${moduleId}/messages`,
        {
            headers: { Authorization: `Bearer ${authToken}` },
            params,
        },
    );
    return res.data;
}

export async function createQuestionMessage(
    apiClient: AxiosInstance,
    passcode: string,
    moduleId: number,
    authToken: string,
    payload: CreateQuestionMessageRequest,
): Promise<QuestionMessageItem> {
    const res = await apiClient.post<QuestionMessageItem>(
        `/sessions/by-passcode/${passcode}/modules/questions/${moduleId}/messages`,
        payload,
        {
            headers: { Authorization: `Bearer ${authToken}` },
        },
    );
    return res.data;
}

export async function likeQuestionMessage(
    apiClient: AxiosInstance,
    passcode: string,
    moduleId: number,
    msgId: number,
    authToken: string,
): Promise<{ likes_count?: number } | Record<string, unknown>> {
    const res = await apiClient.post(
        `/sessions/by-passcode/${passcode}/modules/questions/${moduleId}/messages/${msgId}/like`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } },
    );
    return res.data;
}
