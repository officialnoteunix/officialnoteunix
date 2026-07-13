import api from './axios';

export const adApi = {
  active: () => api.get('/ads/active'),
  activeBySlot: (slot: string) => api.get(`/ads/active/${slot}`),
  list: () => api.get('/ads'),
  get: (id: string) => api.get(`/ads/${id}`),
  create: (data: Record<string, any>) => api.post('/ads', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/ads/${id}`, data),
  delete: (id: string) => api.delete(`/ads/${id}`),
  impression: (id: string) => api.post(`/ads/${id}/impression`),
  click: (id: string) => api.post(`/ads/${id}/click`),
  stats: () => api.get('/ads/stats/full'),
};
