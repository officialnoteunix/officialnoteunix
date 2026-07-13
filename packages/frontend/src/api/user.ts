import api from './axios';

export const userApi = {
  profile: () => api.get('/users/profile'),
  updateProfile: (data: Record<string, any>) => api.patch('/users/profile', data),
  updatePassword: (data: Record<string, any>) => api.patch('/users/password', data),
  uploadAvatar: (formData: FormData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  dashboardStats: () => api.get('/users/dashboard/stats'),
  deleteAccount: () => api.delete('/users/account'),
};
