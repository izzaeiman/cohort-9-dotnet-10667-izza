import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  if (method === 'post' || method === 'put' || method === 'delete') {
    if (!config.url?.includes('/auth/antiforgery-token')) {
      try {
        const tokenRes = await axios.get(`${API_BASE_URL}/auth/antiforgery-token`, { withCredentials: true });
        if (tokenRes.data?.token) {
          config.headers['X-XSRF-TOKEN'] = tokenRes.data.token;
        }
      } catch (err) {
        console.warn('Failed to fetch antiforgery token:', err);
      }
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const handleUnauthorized = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('workflow_user');
    
    // Avoid redirect loops if already on login/signup pages
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/signup') {
      window.location.href = '/login';
    }
  }
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Automatically handle 401 Unauthorized: attempt silent refresh via /auth/refresh before logging out
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retry) {
      // Don't loop on refresh/login calls themselves
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        handleUnauthorized();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        handleUnauthorized();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
