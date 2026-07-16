import api from './axios';

export const searchApi = {
  search: (q: string, notePage = 1, resourceType?: string) => api.get('/search', { params: { q, notePage, resourceType } }),
  autocomplete: (q: string) => api.get('/search/autocomplete', { params: { q } }),
};
