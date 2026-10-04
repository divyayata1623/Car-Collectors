import axios from 'axios';

// Use Vite's same-origin proxies during local development. Production builds
// can set VITE_API_BASE_URL to the backend origin (without a trailing slash).
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const resolveImageUrl = (url?: string | null): string => {
  if (!url || url.startsWith('blob:') || url.startsWith('data:') || /^https?:\/\//.test(url)) {
    return url || '';
  }

  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
};

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      error.config?.url?.startsWith('/api/admin')
    ) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/admin/login';
    } else if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
