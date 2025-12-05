import api from './api';
import { useAuthStore } from './authStore';
import { User } from '../types/index';
import { API_URLS } from './config';

type RegisterData = {
  email: string;
  phone: string;
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
      `${API_URLS.MONOLITH}/auth/register`, data
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
      `${API_URLS.MONOLITH}/auth/login`,
      data
    );
    const { accessToken } = response.data;

    // 2. If login is successful, update the global store with the new token
    useAuthStore.getState().setToken(accessToken);

    // 3. Immediately call the profile endpoint to get the user's data
    const profileResponse = await api.get<Omit<User, 'password'>>(
      `${API_URLS.MONOLITH}/auth/profile`
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
  window.location.href = '/login';
};