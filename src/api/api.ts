// src/api/api.ts
import axios from 'axios';
export const baseUrl = 'https://api-icplatform.cloudpub.ru';
export const api = axios.create({
    baseURL: `${baseUrl}/api/v1`,
    // withCredentials: true,
});
