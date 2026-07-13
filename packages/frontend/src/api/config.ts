import api from './axios';

export const configApi = {
  get: () => api.get('/config'),
};
