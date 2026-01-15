// src/api/api.ts
import axios from 'axios';

// Get API URL from environment variable (set during build)
export const baseUrl = import.meta.env.VITE_API_URL || 'https://api-icplatform.cloudpub.ru';
export const api = axios.create({
    baseURL: `${baseUrl}/api/v1`,
});
