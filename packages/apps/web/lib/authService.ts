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

type LoginResponse = {
  accessToken?: string;
  requiresTwoFactor?: boolean;
  tempToken?: string; // The intermediate token for 2FA verification
  message?: string;
};

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// --- MONOLITHENTICATION API FUNCTIONS ---

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
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

/**
 * Handles user login. On success, it fetches the user's profile
 * and updates the global authentication store.
 * Supports both standard login and 2FA interception flows.
 * @param data - The user's login credentials.
 */
export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>(
      `${API_URLS.MONOLITH}/auth/login`,
      data
    );

    // Scenario 1: 2FA is enabled for this user
    if (response.data.requiresTwoFactor) {
      return response.data;
    }

    // Scenario 2: Standard Login (Success)
    const { accessToken } = response.data;
    if (!accessToken) throw new Error('Invalid server response.');

    // 1. Set Token
    useAuthStore.getState().setToken(accessToken);

    // 2. Fetch Profile to hydrate user state
    const profileResponse = await api.get<Omit<User, 'password'>>(
      `${API_URLS.MONOLITH}/auth/profile`
    );

    useAuthStore.getState().setUser(profileResponse.data);

    return response.data;

  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

/**
 * Generates a new 2FA secret and QR code for the authenticated user.
 */
export const generate2FA = async (): Promise<{ secret: string; qrCodeUrl: string }> => {
  const response = await api.post(`${API_URLS.MONOLITH}/auth/2fa/generate`);
  return response.data;
};

/**
 * Enables 2FA by verifying the TOTP code against the generated secret.
 * Returns the recovery codes on success.
 */
export const enable2FA = async (secret: string, code: string): Promise<{ recoveryCodes: string[] }> => {
  const response = await api.post(`${API_URLS.MONOLITH}/auth/2fa/enable`, { secret, code });
  return response.data;
};

/**
 * Finalizes the login process by exchanging the Temp Token and 2FA Code for a real Access Token.
 */
export const verify2FALogin = async (tempToken: string, code: string): Promise<void> => {
  try {
    const response = await api.post<{ accessToken: string }>(
      `${API_URLS.MONOLITH}/auth/2fa/authenticate`,
      { tempToken, code }
    );
    // Success! Update the store with the REAL access token.
    useAuthStore.getState().setToken(response.data.accessToken);
    
    // Fetch profile to complete login
    const profileResponse = await api.get(`${API_URLS.MONOLITH}/auth/profile`);
    useAuthStore.getState().setUser(profileResponse.data);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Invalid 2FA code.');
  }
};

/**
 * Disables 2FA. Requires the user's password.
 */
export const disable2FA = async (password: string): Promise<void> => {
  try {
    await api.post(`${API_URLS.MONOLITH}/auth/2fa/disable`, { password });
    
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.getState().setUser({ ...currentUser, isTwoFactorEnabled: false });
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to disable 2FA.');
  }
};

/**
 * Logs the user out by clearing the global authentication store.
 */
export const logoutUser = () => {
  useAuthStore.getState().logout();
  window.location.href = '/login';
};

/**
 * Changes the user's password.
 */
export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  try {
    await api.post(`${API_URLS.MONOLITH}/auth/change-password`, data);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to change password.');
  }
};

/**
 * Fetches the latest user profile from the backend and updates the local store.
 * Critical for syncing KYC status and balance changes.
 */
export const refreshProfile = async () => {
  try {
    const response = await api.get(`${API_URLS.MONOLITH}/auth/profile`);
    // Update Zustand Store
    useAuthStore.getState().setUser(response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to refresh profile', error);
  }
};