import axios from 'axios';
import { useAdminAuthStore } from './authStore';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios Request Interceptor for the ADMIN App.
 *
 * This intercepts every request and attaches the JWT from the *admin* auth store.
 * It uses 'flowsplit-admin-auth' from localStorage, ensuring it does NOT
 * conflict with the token from the main user-facing application.
 */
api.interceptors.request.use(
  (config) => {
    // We get the state directly from the admin-specific Zustand store.
    const token = useAdminAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        
        // 1. Clear Admin Auth State
        useAdminAuthStore.getState().logout();
        
        // 2. Redirect
        window.location.href = '/login?error=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;