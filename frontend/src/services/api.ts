import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Automatically inject JWT token into all outgoing backend API requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('workflow_token');
    if (token && !token.startsWith('demo_jwt_bearer_token_')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const handleUnauthorized = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('workflow_token');
    localStorage.removeItem('workflow_user');
    
    // Avoid redirect loops if already on login/signup pages
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/signup') {
      window.location.href = '/login';
    }
  }
};

// Automatically handle 401 Unauthorized responses to clean up expired sessions
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
