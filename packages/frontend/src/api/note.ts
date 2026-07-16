import api from './axios';

export const noteApi = {
  list: (params?: Record<string, any>) => api.get('/notes', { params }),
  my: (page = 1, limit = 9) => api.get('/notes/my', { params: { page, limit } }),
  get: (id: string) => api.get(`/notes/${id}`),
  create: (formData: FormData) =>
    api.post('/notes', formData),
  update: (id: string, data: Record<string, any> | FormData) => api.patch(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
  download: (id: string) => api.post(`/notes/${id}/download`),
  related: (id: string) => api.get(`/notes/${id}/related`),
  top: (type = 'downloads', limit = 10) => api.get('/notes/top', { params: { type, limit } }),
  share: (id: string) => api.get(`/notes/${id}/share`),
};
