import axios from 'axios';
import type { ApiError } from './types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000'),
  timeout: 15000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      const e = new Error('Network error. Please check your connection.');
      (e as any).errors = undefined;
      return Promise.reject(e);
    }

    const data = error.response.data as ApiError | undefined;

    if (error.response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('needs_password_change');
      localStorage.removeItem('user_role');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response.status === 403 && data?.message === 'blocked' && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('needs_password_change');
      localStorage.removeItem('user_role');
      if (window.location.pathname !== '/') {
        window.location.href = '/?blocked=true';
      }
    }

    if (error.response.status === 503 && data?.message === 'maintenance' && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('needs_password_change');
      localStorage.removeItem('user_role');
      localStorage.setItem('toast_message', 'System Maintenance: You were safely logged out.');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const apiErr = data || { message: 'An unexpected error occurred', errors: undefined } as ApiError;
    const e = new Error(apiErr.message || 'An unexpected error occurred');
    (e as any).errors = apiErr.errors;
    (e as any).status = error.response?.status;
    return Promise.reject(e);
  }
);

export default api;
