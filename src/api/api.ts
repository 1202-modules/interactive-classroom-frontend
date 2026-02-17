// src/api/api.ts
import axios from 'axios';

// API URL configuration:
// - For local dev: set VITE_API_URL in front/.env.local (e.g., VITE_API_URL=http://localhost:10200)
// - For production: VITE_API_URL is not set, uses relative path /api/v1 (proxied by nginx)
const apiUrl = import.meta.env.VITE_API_URL;
const baseURL = apiUrl ? `${apiUrl}/api/v1` : '/api/v1';

export const baseUrl = apiUrl || window.location.origin;
export const api = axios.create({
    baseURL,
});
