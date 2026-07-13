import api from './axios';

export const bookmarkApi = {
  list: (page = 1) => api.get('/bookmarks', { params: { page } }),
  toggle: (noteId: string) => api.post(`/bookmarks/${noteId}`),
  check: (noteId: string) => api.get(`/bookmarks/${noteId}/check`),
};
