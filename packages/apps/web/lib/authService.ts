import api from './api'; // Our configured axios instance
import { useAuthStore } from './authStore';
import { User } from '@flowsplit/prisma';

// Define the expected shapes of our API requests
// In a larger app, these might live in a shared types package
type RegisterData = {
  fullName: string;
  email: string;
  password: string;
};

type LoginData = {
  email: string;
  password: string;
};

// Define the shape of a successful login response
type LoginResponse = {
  accessToken: string;
};

// --- AUTHENTICATION API FUNCTIONS ---

/**
 * Handles user registration by calling the auth-service.
 * @param data - The user's registration details.
 * @returns The newly created user's profile.
 */
export const registerUser = async (data: RegisterData): Promise<Omit<User, 'password'>> => {
  try {
    const response = await api.post<Omit<User, 'password'>>(
      'http://localhost:3100/api/auth/register', // URL to the auth-service
      data
    );
    return response.data;
  } catch (error: any) {
    // Re-throw a more user-friendly error message
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

/**
 * Handles user login. On success, it fetches the user's profile
 * and updates the global authentication store.
 * @param data - The user's login credentials.
 */
export const loginUser = async (data: LoginData): Promise<void> => {
  try {
    // 1. Call the login endpoint to get a token
    const response = await api.post<LoginResponse>(
      'http://localhost:3100/api/auth/login',
      data
    );
    const { accessToken } = response.data;

    // 2. If login is successful, update the global store with the new token
    useAuthStore.getState().setToken(accessToken);

    // 3. Immediately call the profile endpoint to get the user's data
    const profileResponse = await api.get<Omit<User, 'password'>>(
      'http://localhost:3100/api/auth/profile'
      // The token is now automatically added by our axios interceptor
    );

    // 4. Update the global store with the fetched user profile
    useAuthStore.getState().setUser(profileResponse.data);

  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

/**
 * Logs the user out by clearing the global authentication store.
 */
export const logoutUser = () => {
  useAuthStore.getState().logout();
  // Optional: redirect the user to the login page
  window.location.href = '/login';
};