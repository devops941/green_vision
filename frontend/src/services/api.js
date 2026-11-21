import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const api = {
  // System Health
  getSystemStatus: () => apiClient.get('/health'),

  // Madurai District
  getMaduraiOverview: () => apiClient.get('/madurai/overview'),
  getMaduraiBoundary: () => apiClient.get('/madurai/boundary'),
};

export default apiClient;
