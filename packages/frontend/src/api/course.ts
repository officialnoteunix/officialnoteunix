import api from './axios';

export const courseApi = {
  list: (universityId?: string) => api.get('/courses', { params: { universityId } }),
  get: (id: string) => api.get(`/courses/${id}`),
  semesters: (id: string) => api.get(`/courses/${id}/semesters`),
  create: (data: Record<string, any>) => api.post('/courses', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};
