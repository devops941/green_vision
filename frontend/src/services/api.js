import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export const api = {
  // System Health
  getSystemStatus: () => apiClient.get('/health'),

  // Madurai District
  getMaduraiOverview: () => apiClient.get('/madurai/overview'),
  getMaduraiBoundary: () => apiClient.get('/madurai/boundary'),

  // Satellite Ingestion & Validation (Phase 2)
  validateSatelliteHeaders: (formData) =>
    apiClient.post('/satellite/validate-headers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadSatelliteImage: (formData) =>
    apiClient.post('/satellite/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  listSatelliteImages: () => apiClient.get('/satellite/images'),

  getSatelliteImage: (id) => apiClient.get(`/satellite/images/${id}`),

  deleteSatelliteImage: (id) => apiClient.delete(`/satellite/images/${id}`),
};

export default apiClient;
