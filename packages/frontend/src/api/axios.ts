import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api',
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(original));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshBase = import.meta.env.VITE_BACKEND_URL || '';
        await axios.get(`${refreshBase}/api/auth/refresh`, { withCredentials: true });
        processQueue(null);
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    if (err.response?.status === 429 && err.response?.data?.code === 'RATE_LIMITED') {
      window.dispatchEvent(new CustomEvent('rate-limited', {
        detail: { retryAfter: err.response.data.retryAfter },
      }));
    }

    if (err.code === 'ERR_NETWORK' || (err.response && err.response.status >= 500)) {
      window.dispatchEvent(new CustomEvent('api:error', { detail: { code: err.code, status: err.response?.status } }));
    }

    return Promise.reject(err);
  }
);

export default api;
