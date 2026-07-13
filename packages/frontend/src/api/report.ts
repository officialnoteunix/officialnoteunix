import api from './axios';

export const reportApi = {
  list: (params?: Record<string, any>) => api.get('/reports', { params }),
  my: (page = 1) => api.get('/reports/my', { params: { page } }),
  create: (data: Record<string, any>) => api.post('/reports', data),
  updateStatus: (id: string, status: string) => api.patch(`/reports/${id}/status`, { status }),
};
