import axios from 'axios';
import { useAuthStore } from './authStore';

/**
 * Creates a configured instance of axios for all API requests.
 * This is the single source of truth for our frontend HTTP client.
 */
const api = axios.create({
  // We can't set a single baseURL because we are calling multiple microservices
  // on different ports (e.g., :3100 for auth, :3101 for users).
  // URLs will be specified in the service functions (e.g., authService.ts).
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios Request Interceptor
 * 
 * This is a powerful mechanism that intercepts every single request made by our `api` instance
 * BEFORE it is sent. Its job is to:
 * 1. Get the current authentication token from our Zustand store.
 * 2. If a token exists, it dynamically adds the `Authorization` header to the request.
 * 3. If no token exists, it does nothing and sends the request as-is.
 * 
 * This completely decouples token management from our UI components. A component can simply
 * call `api.get('/some-protected-route')` without ever needing to know what the token is
 * or how to attach it.
 */
api.interceptors.request.use(
  (config) => {
    // Get the state directly from the Zustand store.
    const token = useAuthStore.getState().token;

    if (token) {
      // If the token exists, add the standard Bearer token authorization header.
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Return the modified config to be sent.
    return config;
  },
  (error) => {
    // Handle any errors during the request setup phase.
    return Promise.reject(error);
  }
);

export default api;