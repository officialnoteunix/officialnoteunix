import api from './axios';

export const searchApi = {
  search: (q: string, notePage = 1) => api.get('/search', { params: { q, notePage } }),
};
