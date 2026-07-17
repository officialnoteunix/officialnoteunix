import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshBase = import.meta.env.VITE_BACKEND_URL || '';
        await axios.get(`${refreshBase}/api/auth/refresh`, { withCredentials: true });
        return api(original);
      } catch {
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(err);
      }
    }
    if (err.response?.status === 429 && err.response?.data?.code === 'RATE_LIMITED') {
      window.dispatchEvent(new CustomEvent('rate-limited', {
        detail: { retryAfter: err.response.data.retryAfter },
      }));
    }
    return Promise.reject(err);
  }
);

export default api;
