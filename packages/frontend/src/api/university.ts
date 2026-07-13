import api from './axios';

export const universityApi = {
  list: (search?: string) => api.get('/universities', { params: { search } }),
  get: (id: string) => api.get(`/universities/${id}`),
  courses: (id: string) => api.get(`/universities/${id}/courses`),
  create: (data: Record<string, any>) => api.post('/universities', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/universities/${id}`, data),
  delete: (id: string) => api.delete(`/universities/${id}`),
};
