import type { AxiosInstance } from 'axios';

import type {
    CreateQuestionMessageRequest,
    QuestionMessagesResponse,
    QuestionMessageItem,
} from '@/shared/types/questions';

/** Lecturer: list messages with real author. Uses session id and auth. */
export async function getQuestionMessagesLecturer(
    apiClient: AxiosInstance,
    sessionId: number,
    moduleId: number,
    params?: { limit?: number; offset?: number },
): Promise<QuestionMessagesResponse> {
    const res = await apiClient.get<QuestionMessagesResponse>(
        `/sessions/${sessionId}/modules/${moduleId}/questions/messages`,
        { params },
    );
    return res.data;
}

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

/** Lecturer: patch message (is_answered, delete, pin, unpin). */
export async function patchQuestionMessageLecturer(
    apiClient: AxiosInstance,
    sessionId: number,
    moduleId: number,
    msgId: number,
    body: { is_answered?: boolean; delete?: boolean; pin?: boolean; unpin?: boolean },
): Promise<QuestionMessageItem | { deleted: boolean }> {
    const res = await apiClient.patch<QuestionMessageItem | { deleted: boolean }>(
        `/sessions/${sessionId}/modules/${moduleId}/questions/${msgId}`,
        body,
    );
    return res.data;
}

export async function likeQuestionMessage(
    apiClient: AxiosInstance,
    passcode: string,
    moduleId: number,
    msgId: number,
    authToken: string,
): Promise<{ likes_count: number; liked_by_me: boolean }> {
    const res = await apiClient.post(
        `/sessions/by-passcode/${passcode}/modules/questions/${moduleId}/messages/${msgId}/like`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } },
    );
    return res.data as { likes_count: number; liked_by_me: boolean };
}
