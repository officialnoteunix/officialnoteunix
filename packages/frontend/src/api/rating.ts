import api from './axios';

export const ratingApi = {
  rate: (noteId: string, value: number) => api.post(`/ratings/${noteId}`, { value }),
  get: (noteId: string) => api.get(`/ratings/${noteId}`),
};
