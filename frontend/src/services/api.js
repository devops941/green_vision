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

  // Preprocessing & District Masking (Phase 3)
  preprocessImage: (id) => apiClient.post(`/preprocessing/process/${id}`),
  getPreprocessingStatus: (id) => apiClient.get(`/preprocessing/status/${id}`),

  // NDVI Calculation & Vegetation Classification (Phase 4)
  calculateNdvi: (imageId) => apiClient.post(`/ndvi/calculate/${imageId}`),
  listNdviAnalyses: () => apiClient.get('/ndvi/analyses'),
  getNdviAnalysis: (analysisId) => apiClient.get(`/ndvi/analyses/${analysisId}`),
  getNdviAnalysisByImage: (imageId) => apiClient.get(`/ndvi/analyses/image/${imageId}`),
  probeNdviPixel: (imageId, lat, lon) =>
    apiClient.get(`/ndvi/probe/${imageId}`, { params: { lat, lon } }),

  // Temporal Change & Multi-Year Comparison (Phase 6)
  compareScenes: (data) => apiClient.post('/comparison/compare', data),
  listComparisons: () => apiClient.get('/comparison/list'),
  getComparison: (comparisonId) => apiClient.get(`/comparison/${comparisonId}`),

  // PDF Report Generation & Export (Phase 7)
  generateNdviReport: (analysisId) => apiClient.post(`/reports/generate/${analysisId}`),
  generateComparisonReport: (comparisonId) => apiClient.post(`/reports/generate-comparison/${comparisonId}`),
  listReports: () => apiClient.get('/reports/list'),
  deleteReport: (filename) => apiClient.delete(`/reports/${filename}`),
};

export default apiClient;
