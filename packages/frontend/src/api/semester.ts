import api from './axios';

export const semesterApi = {
  list: (courseId?: string) => api.get('/semesters', { params: { courseId } }),
  get: (id: string) => api.get(`/semesters/${id}`),
  subjects: (id: string) => api.get(`/semesters/${id}/subjects`),
  create: (data: Record<string, any>) => api.post('/semesters', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/semesters/${id}`, data),
  delete: (id: string) => api.delete(`/semesters/${id}`),
};
