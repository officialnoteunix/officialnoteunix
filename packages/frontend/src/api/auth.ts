import api from './axios';

export const authApi = {
  register: (fullname: string, email: string, password: string) =>
    api.post('/auth/register', { fullname, email, password }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  verifyEmail: (token: string, email: string) => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`),

  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),

  resetPassword: (token: string, email: string, password: string) =>
    api.post(`/auth/reset-password?email=${encodeURIComponent(email)}`, { token, password }),

};
