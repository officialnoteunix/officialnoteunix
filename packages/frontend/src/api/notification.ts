import api from './axios';

export const notificationApi = {
  list: (params?: Record<string, any>) => api.get('/notifications', { params }),
  count: () => api.get('/notifications/count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};
