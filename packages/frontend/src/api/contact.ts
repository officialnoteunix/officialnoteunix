import api from './axios';

export const contactApi = {
  send: (data: Record<string, string>) => api.post('/contact', data),
};
