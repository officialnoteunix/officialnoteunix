import api from './axios';

export interface DiscoverParams {
  search?: string;
  universityId?: string;
  courseId?: string;
  semesterId?: string;
  page?: number;
  limit?: number;
}

export const subjectApi = {
  list: (semesterId?: string, search?: string) =>
    api.get('/subjects', { params: { semesterId, search } }),
  get: (id: string) => api.get(`/subjects/${id}`),
  notes: (id: string, page = 1, limit = 5, resourceType?: string) => api.get(`/subjects/${id}/notes`, { params: { page, limit, resourceType } }),
  discover: (params: DiscoverParams) => api.get('/subjects/discover', { params }),
  create: (data: Record<string, any>) => api.post('/subjects', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};
