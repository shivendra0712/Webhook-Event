import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const API_KEY = import.meta.env.VITE_API_KEY || 'test-api-key';
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || 'default-client';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-Client-ID': CLIENT_ID,
    },
});

// Events API
export const eventsAPI = {
    create: (eventType, payload, idempotencyKey) =>
        apiClient.post('/events', { eventType, payload, idempotencyKey }),
    getAll: (params) => apiClient.get('/events', { params }),
    getById: (id) => apiClient.get(`/events/${id}`),
    getStats: () => apiClient.get('/events/stats/summary'),
};

// Webhooks API
export const webhooksAPI = {
    create: (name, url, eventTypes, headers) =>
        apiClient.post('/webhooks', { name, url, eventTypes, clientId: CLIENT_ID, headers }),
    getAll: (params) => apiClient.get('/webhooks', { params: { ...params, clientId: CLIENT_ID } }),
    getById: (id) => apiClient.get(`/webhooks/${id}`),
    update: (id, data) => apiClient.put(`/webhooks/${id}`, data),
    delete: (id) => apiClient.delete(`/webhooks/${id}`),
    rotateSecret: (id) => apiClient.post(`/webhooks/${id}/rotate-secret`),
};

// Deliveries API
export const deliveriesAPI = {
    getAll: (params) => apiClient.get('/deliveries', { params }),
    getById: (id) => apiClient.get(`/deliveries/${id}`),
    retry: (id) => apiClient.post(`/deliveries/${id}/retry`),
    getStats: () => apiClient.get('/deliveries/stats/summary'),
};

export default apiClient;

